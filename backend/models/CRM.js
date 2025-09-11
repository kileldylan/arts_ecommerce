// models/CRM.js
const db = require('../config/db');

const CRM = {
  // Get all customers for an artist (users with user_type = 'customer' who ordered from this artist)
  getCustomers: (artistId, filters = {}, callback) => {
    let query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.created_at as joined_date,
        u.bio,
        u.avatar,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(oi.quantity * oi.product_price) as total_spent,
        MAX(o.created_at) as last_order_date,
        AVG(oi.quantity * oi.product_price) as average_order_value,
        DATEDIFF(NOW(), MAX(o.created_at)) as days_since_last_order
      FROM users u
      JOIN orders o ON u.id = o.customer_id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE p.artist_id = ? 
      AND u.user_type = 'customer'
      AND o.status != 'cancelled'
    `;

    const params = [artistId];

    // Add filters
    if (filters.search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.minOrders) {
      query += ` AND (SELECT COUNT(*) FROM orders o2 WHERE o2.customer_id = u.id) >= ?`;
      params.push(filters.minOrders);
    }

    if (filters.minSpent) {
      query += ` AND (SELECT COALESCE(SUM(oi2.quantity * oi2.price), 0) 
                FROM orders o2 
                JOIN order_items oi2 ON o2.id = oi2.order_id 
                WHERE o2.customer_id = u.id) >= ?`;
      params.push(filters.minSpent);
    }

    query += `
      GROUP BY u.id
      ORDER BY total_spent DESC
    `;

    if (filters.limit) {
      query += ` LIMIT ?`;
      params.push(filters.limit);
    }

    db.query(query, params, callback);
  },

  // Get customer details with order history
  getCustomerDetails: (customerId, artistId, callback) => {
    const query = `
      SELECT 
        u.*,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(oi.quantity * oi.product_price) as total_spent,
        AVG(oi.quantity * oi.product_price) as average_order_value,
        MAX(o.created_at) as last_order_date,
        MIN(o.created_at) as first_order_date,
        DATEDIFF(NOW(), MAX(o.created_at)) as days_since_last_order
      FROM users u
      JOIN orders o ON u.id = o.customer_id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE u.id = ? AND p.artist_id = ? AND u.user_type = 'customer'
      GROUP BY u.id
    `;

    db.query(query, [customerId, artistId], callback);
  },

  // Get customer order history
  getCustomerOrders: (customerId, artistId, callback) => {
    const query = `
      SELECT 
        o.id,
        o.order_number,
        o.total_amount,
        o.status,
        o.payment_method,
        o.payment_status,
        o.created_at,
        o.shipping_address,
        GROUP_CONCAT(DISTINCT p.name SEPARATOR ', ') as products,
        COUNT(oi.id) as items_count,
        SUM(oi.quantity) as total_quantity
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.customer_id = ? AND p.artist_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;

    db.query(query, [customerId, artistId], callback);
  },

  // Get customer lifetime value analysis
  getCustomerLTV: (artistId, callback) => {
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        SUM(oi.quantity * oi.product_price) as lifetime_value,
        COUNT(DISTINCT o.id) as order_count,
        DATEDIFF(NOW(), MIN(o.created_at)) as days_since_first_order,
        DATEDIFF(NOW(), MAX(o.created_at)) as days_since_last_order,
        CASE 
          WHEN SUM(oi.quantity * oi.product_price) >= 10000 THEN 'VIP'
          WHEN SUM(oi.quantity * oi.product_price) >= 5000 THEN 'Premium'
          WHEN SUM(oi.quantity * oi.product_price) >= 1000 THEN 'Regular'
          ELSE 'New'
        END as segment
      FROM users u
      JOIN orders o ON u.id = o.customer_id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE p.artist_id = ? AND u.user_type = 'customer'
      GROUP BY u.id
      ORDER BY lifetime_value DESC
    `;

    db.query(query, [artistId], callback);
  },

  // Get customer segmentation
  getCustomerSegmentation: (artistId, callback) => {
    const query = `
      SELECT 
        CASE 
          WHEN total_spent >= 10000 THEN 'VIP'
          WHEN total_spent >= 5000 THEN 'Premium'
          WHEN total_spent >= 1000 THEN 'Regular'
          ELSE 'New'
        END as segment,
        COUNT(*) as customer_count,
        AVG(total_spent) as avg_spent,
        AVG(order_count) as avg_orders,
        SUM(total_spent) as segment_revenue
      FROM (
        SELECT 
          u.id,
          SUM(oi.quantity * oi.product_price) as total_spent,
          COUNT(DISTINCT o.id) as order_count
        FROM users u
        JOIN orders o ON u.id = o.customer_id
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE p.artist_id = ? AND u.user_type = 'customer'
        GROUP BY u.id
      ) as customer_stats
      GROUP BY segment
      ORDER BY avg_spent DESC
    `;

    db.query(query, [artistId], callback);
  },

  // Get recent customers
  getRecentCustomers: (artistId, limit = 10, callback) => {
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.avatar,
        MAX(o.created_at) as last_order_date,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(oi.quantity * oi.product_price) as total_spent
      FROM users u
      JOIN orders o ON u.id = o.customer_id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE p.artist_id = ? AND u.user_type = 'customer'
      GROUP BY u.id
      ORDER BY last_order_date DESC
      LIMIT ?
    `;

    db.query(query, [artistId, limit], callback);
  },

  // Get top spending customers
  getTopSpenders: (artistId, limit = 10, callback) => {
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.avatar,
        SUM(oi.quantity * oi.product_price) as total_spent,
        COUNT(DISTINCT o.id) as total_orders,
        MAX(o.created_at) as last_order_date
      FROM users u
      JOIN orders o ON u.id = o.customer_id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE p.artist_id = ? AND u.user_type = 'customer'
      GROUP BY u.id
      ORDER BY total_spent DESC
      LIMIT ?
    `;

    db.query(query, [artistId, limit], callback);
  },

  // Update customer notes or tags (we'll store this in user meta or a separate table)
  updateCustomerNotes: (customerId, artistId, notes, callback) => {
    // First check if notes exist for this customer-artist combination
    const checkQuery = `
      SELECT id FROM customer_notes 
      WHERE customer_id = ? AND artist_id = ?
    `;
    
    db.query(checkQuery, [customerId, artistId], (err, results) => {
      if (err) return callback(err);
      
      if (results.length > 0) {
        // Update existing notes
        const updateQuery = `
          UPDATE customer_notes 
          SET notes = ?, updated_at = NOW()
          WHERE customer_id = ? AND artist_id = ?
        `;
        db.query(updateQuery, [notes, customerId, artistId], callback);
      } else {
        // Insert new notes
        const insertQuery = `
          INSERT INTO customer_notes (customer_id, artist_id, notes, created_at, updated_at)
          VALUES (?, ?, ?, NOW(), NOW())
        `;
        db.query(insertQuery, [customerId, artistId, notes], callback);
      }
    });
  },

  // Get customer notes
  getCustomerNotes: (customerId, artistId, callback) => {
    const query = `
      SELECT notes FROM customer_notes 
      WHERE customer_id = ? AND artist_id = ?
    `;
    
    db.query(query, [customerId, artistId], callback);
  }
};

// We need to create a customer_notes table for storing artist-specific customer notes
const createCustomerNotesTable = `
  CREATE TABLE IF NOT EXISTS customer_notes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    artist_id INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_customer_artist (customer_id, artist_id),
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (artist_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// Run the table creation
db.query(createCustomerNotesTable, (err) => {
  if (err) {
    console.error('Error creating customer_notes table:', err);
  } else {
    console.log('Customer notes table ready');
  }
});

module.exports = CRM;