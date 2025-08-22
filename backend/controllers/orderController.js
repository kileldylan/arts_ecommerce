// backend/controllers/orderController.js
const Order = require('../models/Order');

// Get all orders
exports.getAllOrders = (req, res) => {
  const filters = {
    ...req.query,
    // If user is artist, only show their orders
    ...(req.user.user_type === 'artist' && { artist_id: req.user.id }),
    // If user is customer, only show their orders
    ...(req.user.user_type === 'customer' && { customer_id: req.user.id })
  };

  Order.findAll(filters, (err, orders) => {
    if (err) {
      console.error('Error fetching orders:', err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
    res.json(orders);
  });
};

// Get single order
exports.getOrder = (req, res) => {
  const orderId = req.params.id;

  Order.findById(orderId, (err, orders) => {
    if (err) {
      console.error('Error fetching order:', err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }

    if (orders.length === 0) {
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
  });
};

// Create new order
exports.createOrder = (req, res) => {
  try {
    const orderData = {
      ...req.body,
      customer_id: req.user.id
    };

    // Validate required fields
    if (!orderData.artist_id || !orderData.total_amount || !orderData.subtotal || 
        !orderData.payment_method || !orderData.shipping_address || !orderData.items) {
      return res.status(400).json({ 
        message: 'Missing required fields' 
      });
    }

    Order.create(orderData, (err, order) => {
      if (err) {
        console.error('Error creating order:', err);
        return res.status(500).json({ 
          message: 'Error creating order', 
          error: err.message 
        });
      }

      res.status(201).json({
        message: 'Order created successfully',
        order: order
      });
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
exports.updateOrderStatus = (req, res) => {
  const orderId = req.params.id;
  const { status, note } = req.body;

  // Validate status
  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  // First get the order to check permissions
  Order.findById(orderId, (err, orders) => {
    if (err) {
      console.error('Error finding order:', err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];

    // Check permissions - only artist or admin can update status
    if (req.user.user_type === 'customer' || 
        (req.user.user_type === 'artist' && order.artist_id !== req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    Order.updateStatus(orderId, status, note, req.user.id, (err, results) => {
      if (err) {
        console.error('Error updating order status:', err);
        return res.status(500).json({ 
          message: 'Error updating order status', 
          error: err.message 
        });
      }

      res.json({
        message: 'Order status updated successfully',
        affectedRows: results.affectedRows
      });
    });
  });
};

// Update payment status
exports.updatePaymentStatus = (req, res) => {
  const orderId = req.params.id;
  const { payment_status } = req.body;

  // Validate payment status
  const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
  if (!validStatuses.includes(payment_status)) {
    return res.status(400).json({ message: 'Invalid payment status' });
  }

  Order.updatePaymentStatus(orderId, payment_status, (err, results) => {
    if (err) {
      console.error('Error updating payment status:', err);
      return res.status(500).json({ 
        message: 'Error updating payment status', 
        error: err.message 
      });
    }

    res.json({
      message: 'Payment status updated successfully',
      affectedRows: results.affectedRows
    });
  });
};

// Get order status history
exports.getOrderHistory = (req, res) => {
  const orderId = req.params.id;

  // First get the order to check permissions
  Order.findById(orderId, (err, orders) => {
    if (err) {
      console.error('Error finding order:', err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }

    if (orders.length === 0) {
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

    Order.getStatusHistory(orderId, (err, history) => {
      if (err) {
        console.error('Error fetching order history:', err);
        return res.status(500).json({ message: 'Server error', error: err.message });
      }

      res.json(history);
    });
  });
};

// Add transaction
exports.addTransaction = (req, res) => {
  const orderId = req.params.id;
  const transactionData = {
    ...req.body,
    order_id: orderId
  };

  Order.addTransaction(transactionData, (err, results) => {
    if (err) {
      console.error('Error adding transaction:', err);
      return res.status(500).json({ 
        message: 'Error adding transaction', 
        error: err.message 
      });
    }

    // Update order payment status if transaction is completed
    if (transactionData.status === 'completed') {
      Order.updatePaymentStatus(orderId, 'paid', (err) => {
        if (err) console.error('Error updating payment status:', err);
      });
    }

    res.status(201).json({
      message: 'Transaction added successfully',
      transactionId: results.insertId
    });
  });
};