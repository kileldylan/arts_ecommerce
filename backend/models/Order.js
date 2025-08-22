// backend/models/Order.js
const db = require('../config/db');

// Helper function to generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORD-${timestamp}-${random}`;
};

const Order = {
  // Create new order
  create: (orderData, callback) => {
    const {
      customer_id,
      artist_id,
      total_amount,
      subtotal,
      tax_amount = 0,
      shipping_amount = 0,
      discount_amount = 0,
      payment_method,
      shipping_address,
      billing_address = null,
      customer_note = null,
      items
    } = orderData;

    const order_number = generateOrderNumber();

    const query = `
      INSERT INTO orders (
        order_number, customer_id, artist_id, total_amount, subtotal,
        tax_amount, shipping_amount, discount_amount, payment_method,
        shipping_address, billing_address, customer_note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [
      order_number,
      customer_id,
      artist_id,
      total_amount,
      subtotal,
      tax_amount,
      shipping_amount,
      discount_amount,
      payment_method,
      JSON.stringify(shipping_address),
      billing_address ? JSON.stringify(billing_address) : null,
      customer_note
    ], (err, results) => {
      if (err) return callback(err);
      
      const orderId = results.insertId;
      
      // Add order items
      if (items && items.length > 0) {
        Order.addItems(orderId, items, (err) => {
          if (err) return callback(err);
          
          // Get the complete order with items
          Order.findById(orderId, (err, orderResults) => {
            if (err) return callback(err);
            callback(null, orderResults[0]);
          });
        });
      } else {
        Order.findById(orderId, (err, orderResults) => {
          if (err) return callback(err);
          callback(null, orderResults[0]);
        });
      }
    });
  },

  // Add order items
  addItems: (orderId, items, callback) => {
    const values = items.map(item => [
      orderId,
      item.product_id,
      item.product_name,
      item.product_price,
      item.quantity,
      item.total_price,
      item.variant_id || null,
      item.variant_name || null
    ]);

    const query = `
      INSERT INTO order_items (
        order_id, product_id, product_name, product_price, quantity,
        total_price, variant_id, variant_name
      ) VALUES ?
    `;

    db.query(query, [values], (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  },

  // Find order by ID
  findById: (id, callback) => {
    const query = `
      SELECT o.*, 
             c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
             a.name as artist_name, a.email as artist_email
      FROM orders o
      LEFT JOIN users c ON o.customer_id = c.id
      LEFT JOIN users a ON o.artist_id = a.id
      WHERE o.id = ?
    `;
    
    db.query(query, [id], (err, orders) => {
      if (err) return callback(err);
      
      if (orders.length === 0) {
        return callback(null, []);
      }

      // Get order items
      Order.getItems(id, (err, items) => {
        if (err) return callback(err);
        
        const order = {
          ...orders[0],
          shipping_address: JSON.parse(orders[0].shipping_address),
          billing_address: orders[0].billing_address ? JSON.parse(orders[0].billing_address) : null,
          items: items
        };

        callback(null, [order]);
      });
    });
  },

  // Get order items
  getItems: (orderId, callback) => {
    const query = `
      SELECT oi.*, p.slug as product_slug, p.images as product_images
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `;
    
    db.query(query, [orderId], (err, results) => {
      if (err) return callback(err);
      
      // Parse product images if they exist
      const items = results.map(item => ({
        ...item,
        product_images: item.product_images ? JSON.parse(item.product_images) : []
      }));
      
      callback(null, items);
    });
  },

  // Find orders with filters
  findAll: (filters = {}, callback) => {
    let query = `
      SELECT o.*, 
            c.name as customer_name, c.email as customer_email,
            a.name as artist_name, a.email as artist_email
      FROM orders o
      LEFT JOIN users c ON o.customer_id = c.id
      LEFT JOIN users a ON o.artist_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.customer_id) {
      query += ' AND o.customer_id = ?';
      params.push(filters.customer_id);
    }

    if (filters.artist_id) {
      query += ' AND o.artist_id = ?';
      params.push(filters.artist_id);
    }

    if (filters.status) {
      query += ' AND o.status = ?';
      params.push(filters.status);
    }

    if (filters.payment_status) {
      query += ' AND o.payment_status = ?';
      params.push(filters.payment_status);
    }

    if (filters.search) {
      query += ' AND (o.order_number LIKE ? OR c.name LIKE ? OR c.email LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    // Add sorting
    query += ' ORDER BY o.created_at DESC';

    // Add pagination
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    db.query(query, params, async (err, orders) => {
      if (err) return callback(err);

      // Parse JSON fields
      const parsedOrders = orders.map(order => ({
        ...order,
        shipping_address: JSON.parse(order.shipping_address),
        billing_address: order.billing_address ? JSON.parse(order.billing_address) : null
      }));

      // Fetch items for each order
      const ordersWithItems = await Promise.all(parsedOrders.map(order =>
        new Promise((resolve) => {
          Order.getItems(order.id, (itemErr, items) => {
            order.items = items || [];
            resolve(order);
          });
        })
      ));

      callback(null, ordersWithItems);
    });
  },

  // Update order status
  updateStatus: (orderId, status, note, createdBy, callback) => {
    const query = 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    
    db.query(query, [status, orderId], (err, results) => {
      if (err) return callback(err);
      
      // Add to status history
      if (note || createdBy) {
        const historyQuery = `
          INSERT INTO order_status_history (order_id, status, note, created_by)
          VALUES (?, ?, ?, ?)
        `;
        db.query(historyQuery, [orderId, status, note, createdBy], (err) => {
          if (err) console.error('Error adding status history:', err);
        });
      }
      
      callback(null, results);
    });
  },

  // Update payment status
  updatePaymentStatus: (orderId, paymentStatus, callback) => {
    const query = 'UPDATE orders SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    db.query(query, [paymentStatus, orderId], callback);
  },

  // Get order status history
  getStatusHistory: (orderId, callback) => {
    const query = `
      SELECT h.*, u.name as created_by_name
      FROM order_status_history h
      LEFT JOIN users u ON h.created_by = u.id
      WHERE h.order_id = ?
      ORDER BY h.created_at DESC
    `;
    db.query(query, [orderId], callback);
  },

  // Add transaction
  addTransaction: (transactionData, callback) => {
    const {
      order_id,
      transaction_ref,
      amount,
      payment_method,
      status = 'pending',
      payment_details = null
    } = transactionData;

    const query = `
      INSERT INTO transactions (order_id, transaction_ref, amount, payment_method, status, payment_details)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [
      order_id,
      transaction_ref,
      amount,
      payment_method,
      status,
      payment_details ? JSON.stringify(payment_details) : null
    ], callback);
  }
};

module.exports = Order;