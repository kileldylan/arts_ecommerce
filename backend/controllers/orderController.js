// backend/controllers/orderController.js - SUPABASE FIRST ARCHITECTURE
const supabase = require('../config/supabase');
const { clearCache } = require('../middleware/cache');
const mpesaController = require('./mpesaController');

// Helper function to normalize order data (like normalizeProduct)
const normalizeOrder = (order) => {
  if (!order) return order;
  
  // Parse shipping_address if it's a string
  if (order.shipping_address && typeof order.shipping_address === 'string') {
    try {
      order.shipping_address = JSON.parse(order.shipping_address);
    } catch (e) {
      console.error('Error parsing shipping_address:', e);
    }
  }
  
  return order;
};

// Helper function to generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORD-${timestamp}-${random}`;
};

// Get all orders - SUPABASE FIRST (like getAllProducts)
exports.getAllOrders = async (req, res) => {
  try {
    console.log('User from token:', { id: req.user.id, type: req.user.user_type });
    
    // Start with base query
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `);

    // Apply user type filters (like in products)
    if (req.user.user_type === 'artist') {
      console.log('Filtering orders for artist:', req.user.id);
      query = query.eq('artist_id', req.user.id);
    } else if (req.user.user_type === 'customer') {
      console.log('Filtering orders for customer:', req.user.id);
      query = query.eq('customer_id', req.user.id);
    }

    // Apply additional filters from query params
    const { status, payment_status, customer_id, artist_id } = req.query;
    
    if (status) query = query.eq('status', status);
    if (payment_status) query = query.eq('payment_status', payment_status);
    if (customer_id && req.user.user_type === 'admin') query = query.eq('customer_id', customer_id);
    if (artist_id && req.user.user_type === 'admin') query = query.eq('artist_id', artist_id);

    // Order by created_at descending
    query = query.order('created_at', { ascending: false });

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }

    // If no orders, return empty array (like products)
    if (!orders || orders.length === 0) {
      return res.json([]);
    }

    // Fetch customer and artist profiles separately (like products does with categories)
    const customerIds = [...new Set(orders.map(order => order.customer_id).filter(id => id))];
    const artistIds = [...new Set(orders.map(order => order.artist_id).filter(id => id))];
    
    // Fetch customers
    let customers = {};
    if (customerIds.length > 0) {
      const { data: customerData, error: customerError } = await supabase
        .from('profiles')
        .select('id, name, email, phone')
        .in('id', customerIds);
      
      if (!customerError && customerData) {
        customers = customerData.reduce((acc, customer) => {
          acc[customer.id] = customer;
          return acc;
        }, {});
      }
    }
    
    // Fetch artists
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
    
    // Enrich orders with customer and artist data
    const enrichedOrders = orders.map(order => ({
      ...order,
      customer: customers[order.customer_id] || null,
      artist: artists[order.artist_id] || null
    }));
    
    console.log(`Found ${enrichedOrders.length} orders for user ${req.user.id}`);
    res.json(enrichedOrders.map(normalizeOrder));
    
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single order - SUPABASE FIRST (like getProduct)
exports.getOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // Fetch order with items (like products with categories)
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

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check permissions
    if (req.user.user_type === 'customer' && order.customer_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.user_type === 'artist' && order.artist_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Fetch customer info (like fetching category in products)
    const { data: customer, error: customerError } = await supabase
      .from('profiles')
      .select('id, name, email, phone')
      .eq('id', order.customer_id)
      .single();
    
    if (!customerError && customer) {
      order.customer = customer;
    }

    // Fetch artist info
    const { data: artist, error: artistError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', order.artist_id)
      .single();
    
    if (!artistError && artist) {
      order.artist = artist;
    }

    res.json(normalizeOrder(order));
    
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new order - SUPABASE FIRST (like createProduct)
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

    console.log('Creating order for user:', req.user.id);

    // Validate required fields
    if (!items || !items.length) {
      return res.status(400).json({ message: 'No items in order' });
    }

    if (!total_amount || !subtotal || !shipping_address) {
      return res.status(400).json({ 
        message: 'Missing required fields: total_amount, subtotal, or shipping_address' 
      });
    }

    // Get artist_id from first product (like in products)
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
      }
    }

    const order_number = generateOrderNumber();

    // Step 1: Insert order (direct Supabase, no model)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number,
        customer_id: req.user.id,
        artist_id: artistUuid,
        total_amount: parseFloat(total_amount),
        subtotal: parseFloat(subtotal),
        tax_amount: parseFloat(tax_amount),
        shipping_amount: parseFloat(shipping_amount),
        discount_amount: parseFloat(discount_amount),
        payment_method,
        payment_status: 'pending',
        status: 'pending',
        shipping_address: typeof shipping_address === 'object' 
          ? JSON.stringify(shipping_address) 
          : shipping_address,
        customer_note: req.body.customer_note || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order insert error:', orderError);
      return res.status(500).json({ message: 'Failed to create order', error: orderError.message });
    }

    console.log('Order created:', order.id);

    // Step 2: Insert order items (direct Supabase)
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name || item.name,
      product_price: parseFloat(item.product_price || item.price),
      quantity: parseInt(item.quantity),
      total_price: parseFloat((item.product_price || item.price) * item.quantity),
      created_at: new Date().toISOString()
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items insert error:', itemsError);
      // Rollback: delete the order
      await supabase.from('orders').delete().eq('id', order.id);
      return res.status(500).json({ message: 'Failed to create order items', error: itemsError.message });
    }

    // Step 3: Add status history
    await supabase
      .from('order_status_history')
      .insert({
        order_id: order.id,
        status: 'pending',
        note: 'Order created',
        created_at: new Date().toISOString()
      });

    // Initialize M-Pesa STK Push if needed
    let checkoutRequestId = null;
    
    if (payment_method === 'mpesa' && phone) {
      try {
        const mockReq = {
          body: {
            phoneNumber: phone,
            amount: total_amount,
            orderId: order.id,
            accountReference: order_number
          }
        };
        
        let mpesaResult = null;
        const mockRes = {
          json: (data) => { mpesaResult = data; },
          status: (code) => ({
            json: (data) => {
              mpesaResult = data;
              return data;
            }
          })
        };
        
        await mpesaController.initiateSTKPush(mockReq, mockRes);
        
        if (mpesaResult && mpesaResult.success && mpesaResult.data) {
          checkoutRequestId = mpesaResult.data.CheckoutRequestID;
          
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
      }
    }

    // Clear cache for orders
    await clearCache('cache:/api/orders*');

    // Return success response (matching product controller pattern)
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order.id,
        order_number: order.order_number,
        total_amount: order.total_amount
      },
      payment: {
        checkout_request_id: checkoutRequestId,
        initiated: !!checkoutRequestId
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

// Get order status - SIMPLE DIRECT QUERY
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

    res.json({
      order_id: order.id,
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      checkout_request_id: order.checkout_request_id
    });
    
  } catch (error) {
    console.error('Get order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update order status - SIMPLE DIRECT UPDATE
exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, note } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Check permissions
    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (findError) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.user.user_type === 'customer' || 
        (req.user.user_type === 'artist' && order.artist_id !== req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update order
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', orderId);

    if (updateError) {
      return res.status(500).json({ message: 'Error updating order status' });
    }

    // Add status history
    await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        status,
        note: note || `Status changed to ${status}`,
        created_by: req.user.id,
        created_at: new Date().toISOString()
      });

    // Clear cache
    await clearCache('cache:/api/orders*');
    await clearCache(`cache:/api/orders/${orderId}`);

    res.json({ message: 'Order status updated successfully' });
    
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get order history - SIMPLE DIRECT QUERY
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
      return res.status(500).json({ message: 'Error fetching history' });
    }

    res.json(history);
    
  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Keep these simple versions (not complex like before)
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
        payment_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      return res.status(500).json({ message: 'Error updating payment status' });
    }

    res.json({ message: 'Payment status updated successfully' });
    
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

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
      return res.status(500).json({ message: 'Error adding transaction' });
    }

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
    res.status(500).json({ message: 'Server error' });
  }
};