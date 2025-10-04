// backend/controllers/orderController.js
const supabase = require('../config/supabase');

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    let query = supabase
      .from('orders')
      .select('*, customers:users!orders_customer_id_fkey(name, email), artists:users!orders_artist_id_fkey(name)');

    // Apply filters based on user type
    if (req.user.user_type === 'artist') {
      query = query.eq('artist_id', req.user.id);
    } else if (req.user.user_type === 'customer') {
      query = query.eq('customer_id', req.user.id);
    }

    // Apply additional filters from query params
    const filters = { ...req.query };
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.payment_status) {
      query = query.eq('payment_status', filters.payment_status);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single order
exports.getOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, price, images)), customers:users!orders_customer_id_fkey(*), artists:users!orders_artist_id_fkey(*)')
      .eq('id', orderId)
      .limit(1);

    if (error) {
      console.error('Error fetching order:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];

    // Check permissions
    if (req.user.user_type === 'customer' && order.customer_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.user_type === 'artist' && order.artist_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      customer_id: req.user.id,
      order_number: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Validate required fields
    if (!orderData.artist_id || !orderData.total_amount || !orderData.subtotal || 
        !orderData.payment_method || !orderData.shipping_address || !orderData.items) {
      return res.status(400).json({ 
        message: 'Missing required fields' 
      });
    }

    // Start a transaction (Supabase doesn't have transactions in free tier, but we'll handle sequentially)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return res.status(500).json({ 
        message: 'Error creating order', 
        error: orderError.message 
      });
    }

    // Create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_price: item.product_price,
      quantity: item.quantity,
      total_price: item.total_price,
      variant_id: item.variant_id || null,
      variant_name: item.variant_name || null,
      created_at: new Date().toISOString()
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // If items fail, delete the order
      await supabase.from('orders').delete().eq('id', order.id);
      console.error('Error creating order items:', itemsError);
      return res.status(500).json({ 
        message: 'Error creating order items', 
        error: itemsError.message 
      });
    }

    // Create initial status history
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert([{
        order_id: order.id,
        status: 'pending',
        note: 'Order created',
        created_by: req.user.id,
        created_at: new Date().toISOString()
      }]);

    if (historyError) {
      console.error('Error creating status history:', historyError);
      // We don't fail the order for this
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: order
    });
  } catch (error) {
    console.error('Error in createOrder:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, note } = req.body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // First get the order to check permissions
    const { data: orders, error: findError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .limit(1);

    if (findError) {
      console.error('Error finding order:', findError);
      return res.status(500).json({ message: 'Server error', error: findError.message });
    }

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];

    // Check permissions - only artist or admin can update status
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
      console.error('Error updating order status:', updateError);
      return res.status(500).json({ 
        message: 'Error updating order status', 
        error: updateError.message 
      });
    }

    // Add status history
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert([{
        order_id: orderId,
        status: status,
        note: note || `Status changed to ${status}`,
        created_by: req.user.id,
        created_at: new Date().toISOString()
      }]);

    if (historyError) {
      console.error('Error adding status history:', historyError);
    }

    res.json({
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { payment_status } = req.body;

    // Validate payment status
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
      console.error('Error updating payment status:', error);
      return res.status(500).json({ 
        message: 'Error updating payment status', 
        error: error.message 
      });
    }

    res.json({
      message: 'Payment status updated successfully'
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get order status history
exports.getOrderHistory = async (req, res) => {
  try {
    const orderId = req.params.id;

    // First get the order to check permissions
    const { data: orders, error: findError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .limit(1);

    if (findError) {
      console.error('Error finding order:', findError);
      return res.status(500).json({ message: 'Server error', error: findError.message });
    }

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];

    // Check permissions
    if (req.user.user_type === 'customer' && order.customer_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.user_type === 'artist' && order.artist_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get status history
    const { data: history, error: historyError } = await supabase
      .from('order_status_history')
      .select('*, created_by_user:users(name)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (historyError) {
      console.error('Error fetching order history:', historyError);
      return res.status(500).json({ message: 'Server error', error: historyError.message });
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
      console.error('Error adding transaction:', error);
      return res.status(500).json({ 
        message: 'Error adding transaction', 
        error: error.message 
      });
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
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};