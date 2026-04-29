const supabase = require('../config/supabase');
const Order = require('../models/Order');
const mpesaController = require('./mpesaController');

// Get all orders - FIXED VERSION
exports.getAllOrders = async (req, res) => {
  try {
    console.log('User from token:', { id: req.user.id, type: req.user.user_type });
    
    // Start with base query - only select fields that definitely exist
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `);

    // Apply user type filters
    if (req.user.user_type === 'artist') {
      console.log('Filtering orders for artist:', req.user.id);
      query = query.eq('artist_id', req.user.id);
    } else if (req.user.user_type === 'customer') {
      console.log('Filtering orders for customer:', req.user.id);
      query = query.eq('customer_id', req.user.id);
    }

    // Apply additional filters from query params
    const { status, payment_status, customer_id, artist_id } = req.query;
    
    if (status) {
      query = query.eq('status', status);
    }
    if (payment_status) {
      query = query.eq('payment_status', payment_status);
    }
    if (customer_id && req.user.user_type === 'admin') {
      query = query.eq('customer_id', customer_id);
    }
    if (artist_id && req.user.user_type === 'admin') {
      query = query.eq('artist_id', artist_id);
    }

    // Order by created_at descending
    query = query.order('created_at', { ascending: false });

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }

    // If we need customer and artist info, fetch them separately
    if (orders && orders.length > 0) {
      // Get unique customer and artist IDs
      const customerIds = [...new Set(orders.map(order => order.customer_id).filter(id => id))];
      const artistIds = [...new Set(orders.map(order => order.artist_id).filter(id => id))];
      
      // Fetch customer profiles
      let customers = {};
      if (customerIds.length > 0) {
        const { data: customerData, error: customerError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', customerIds);
        
        if (!customerError && customerData) {
          customers = customerData.reduce((acc, customer) => {
            acc[customer.id] = customer;
            return acc;
          }, {});
        }
      }
      
      // Fetch artist profiles
      let artists = {};
      if (artistIds.length > 0) {
        const { data: artistData, error: artistError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', artistIds);
        
        if (!artistError && artistData) {
          artists = artistData.reduce((acc, artist) => {
            acc[artist.id] = artist;
            return acc;
          }, {});
        }
      }
      
      // Attach customer and artist data to orders
      const enrichedOrders = orders.map(order => ({
        ...order,
        customer: customers[order.customer_id] || null,
        artist: artists[order.artist_id] || null
      }));
      
      console.log(`Found ${enrichedOrders.length} orders for user ${req.user.id}`);
      return res.json(enrichedOrders);
    }

    console.log(`Found ${orders?.length || 0} orders for user ${req.user.id}`);
    res.json(orders || []);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single order - FIXED VERSION
exports.getOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    // First get the order with items
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Order not found' });
      }
      console.error('Error fetching order:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }

    // Check permissions
    if (req.user.user_type === 'customer' && order.customer_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.user_type === 'artist' && order.artist_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Fetch customer info separately
    const { data: customer, error: customerError } = await supabase
      .from('profiles')
      .select('id, name, email, phone')
      .eq('id', order.customer_id)
      .single();
    
    if (!customerError) {
      order.customer = customer;
    }

    // Fetch artist info separately
    const { data: artist, error: artistError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', order.artist_id)
      .single();
    
    if (!artistError) {
      order.artist = artist;
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new order - USING MODEL (keep as is, it's working)
exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      total_amount,
      subtotal,
      shipping_amount = 0,
      tax_amount = 0,
      discount_amount = 0,
      payment_method = 'mpesa',
      shipping_address,
      phone,
    } = req.body;

    console.log('Received order request:', { items, total_amount, phone });

    // Validate required fields
    if (!items || !items.length) {
      return res.status(400).json({ message: 'No items in order' });
    }

    if (!total_amount || !subtotal || !shipping_address) {
      return res.status(400).json({ 
        message: 'Missing required fields: total_amount, subtotal, or shipping_address' 
      });
    }

    // Get artist_id from first product
    const firstProduct = items[0];
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('artist_id')
      .eq('id', firstProduct.product_id)
      .single();

    if (productError) {
      console.error('Product fetch error:', productError);
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    // Convert artist_id to proper UUID format
    let artistUuid = product.artist_id;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(String(artistUuid))) {
      console.log('artist_id is not a UUID, fetching from profiles...');
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_type', 'artist')
        .limit(1)
        .single();
      
      if (profileError) {
        console.error('Failed to fetch artist profile:', profileError);
        artistUuid = null;
      } else {
        artistUuid = profile.id;
        console.log('Using fallback artist UUID:', artistUuid);
      }
    }

    // USE THE MODEL to create order
    const order = await Order.create({
      customer_id: req.user.id,
      artist_id: artistUuid,
      total_amount,
      subtotal,
      shipping_amount,
      tax_amount,
      discount_amount,
      payment_method,
      shipping_address,
      items: items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name || item.name,
        product_price: item.product_price || item.price,
        quantity: item.quantity,
        total_price: (item.product_price || item.price) * item.quantity
      }))
    });

    console.log('Order created successfully via Model:', order.id);

    // Initialize M-Pesa STK Push if payment method is mpesa and phone is provided
    let paymentResponse = null;
    let checkoutRequestId = null;
    
    if (payment_method === 'mpesa' && phone) {
      try {
        // Create a mock request object for the M-Pesa controller
        const mockReq = {
          body: {
            phoneNumber: phone,
            amount: total_amount,
            orderId: order.id,
            accountReference: order.order_number
          }
        };
        
        let mpesaResult = null;
        const mockRes = {
          json: (data) => { 
            mpesaResult = data;
            paymentResponse = data;
          },
          status: (code) => ({
            json: (data) => {
              mpesaResult = data;
              paymentResponse = data;
              paymentResponse.statusCode = code;
              return data;
            }
          })
        };
        
        // Call the M-Pesa STK Push function
        await mpesaController.initiateSTKPush(mockReq, mockRes);
        
        console.log('M-Pesa STK Push response:', mpesaResult);
        
        // Extract CheckoutRequestID from the response
        if (mpesaResult && mpesaResult.success && mpesaResult.data) {
          checkoutRequestId = mpesaResult.data.CheckoutRequestID;
          
          // Update order with checkout_request_id
          if (checkoutRequestId) {
            await supabase
              .from('orders')
              .update({ 
                checkout_request_id: checkoutRequestId,
                updated_at: new Date().toISOString()
              })
              .eq('id', order.id);
          }
        }
        
      } catch (mpesaError) {
        console.error('M-Pesa STK Push failed:', mpesaError);
        paymentResponse = { 
          success: false, 
          message: 'Failed to initiate M-Pesa payment',
          error: mpesaError.message 
        };
      }
    }

    // Return success response with payment info
    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order.id,
        order_number: order.order_number,
        total_amount: order.total_amount
      },
      payment: {
        success: paymentResponse?.success || false,
        checkout_request_id: checkoutRequestId, // ✅ This is what frontend expects
        message: paymentResponse?.message || (checkoutRequestId ? 'STK push initiated' : 'No payment initiated'),
        data: paymentResponse?.data || null
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ 
      message: 'Error creating order', 
      error: error.message 
    });
  }
};

// Get order status for polling
exports.getOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, order_number, status, payment_status, checkout_request_id')
      .eq('id', orderId)
      .single();

    if (error) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Also get the latest transaction status
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('status, transaction_ref')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    res.json({
      order_id: order.id,
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      checkout_request_id: order.checkout_request_id,
      transaction_status: transaction?.status || null,
      transaction_ref: transaction?.transaction_ref || null
    });
  } catch (error) {
    console.error('Get order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, note } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Get order to check permissions
    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (findError) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check permissions
    if (req.user.user_type === 'customer' || 
        (req.user.user_type === 'artist' && order.artist_id !== req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      return res.status(500).json({ message: 'Error updating order status', error: updateError.message });
    }

    // Add status history
    await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        status: status,
        note: note || `Status changed to ${status}`,
        created_by: req.user.id,
        created_at: new Date().toISOString()
      });

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { payment_status } = req.body;

    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!validStatuses.includes(payment_status)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const { error } = await supabase
      .from('orders')
      .update({ 
        payment_status: payment_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      return res.status(500).json({ message: 'Error updating payment status', error: error.message });
    }

    res.json({ message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get order status history
exports.getOrderHistory = async (req, res) => {
  try {
    const orderId = req.params.id;

    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (findError) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check permissions
    if (req.user.user_type === 'customer' && order.customer_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.user_type === 'artist' && order.artist_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { data: history, error } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ message: 'Error fetching history', error: error.message });
    }

    res.json(history);
  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add transaction
exports.addTransaction = async (req, res) => {
  try {
    const orderId = req.params.id;
    const transactionData = {
      ...req.body,
      order_id: orderId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: 'Error adding transaction', error: error.message });
    }

    // Update order payment status if transaction is completed
    if (transactionData.status === 'completed') {
      await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
    }

    res.status(201).json({
      message: 'Transaction added successfully',
      transactionId: transaction.id
    });
  } catch (error) {
    console.error('Add transaction error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};