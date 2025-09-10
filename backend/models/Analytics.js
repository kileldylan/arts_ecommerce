// models/Analytics.js
const db = require('../config/db');

const Analytics = {
  // Get sales analytics for artist
  getSalesAnalytics: (artistId, startDate, endDate, callback) => {
    const query = `
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(oi.id) as total_items_sold,
        SUM(oi.quantity * oi.product_price) as total_revenue,
        AVG(oi.quantity * oi.product_price) as average_order_value,
        COUNT(DISTINCT o.customer_id) as total_customers
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE p.artist_id = ? 
      AND o.created_at BETWEEN ? AND ?
      AND o.status != 'cancelled'
    `;
    
    db.query(query, [artistId, startDate, endDate], callback);
  },

    // Get revenue trends
    getRevenueTrends: (artistId, period = 'monthly', callback) => {
    let dateFormat, groupBy;
    
    switch (period) {
        case 'daily':
        dateFormat = '%Y-%m-%d';
        groupBy = 'DATE(o.created_at)';
        break;
        case 'weekly':
        dateFormat = '%Y-%U';
        groupBy = 'YEARWEEK(o.created_at)';
        break;
        default:
        dateFormat = '%Y-%m';
        groupBy = 'YEAR(o.created_at), MONTH(o.created_at)';
    }

    const query = `
        SELECT 
        DATE_FORMAT(o.created_at, ?) as period,
        SUM(oi.quantity * oi.product_price) as revenue,
        COUNT(DISTINCT o.id) as orders_count
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE p.artist_id = ?
        AND o.status != 'cancelled'
        GROUP BY ${groupBy}
        ORDER BY o.created_at DESC
        LIMIT 12
    `;
    
    db.query(query, [dateFormat, artistId], callback);
    },

  // Get top products
  getTopProducts: (artistId, limit = 5, callback) => {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.category_id,
        c.name as category_name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.product_price) as total_revenue,
        AVG(oi.product_price) as average_price
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.artist_id = ?
      AND o.status != 'cancelled'
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT ?
    `;
    
    db.query(query, [artistId, limit], callback);
  },

  // Get customer analytics
  getCustomerAnalytics: (artistId, callback) => {
    const query = `
      SELECT 
        COUNT(DISTINCT o.customer_id) as total_customers,
        COUNT(DISTINCT CASE WHEN o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN o.customer_id END) as new_customers_30d,
        AVG(oi.quantity * oi.product_price) as average_customer_value,
        MAX(oi.quantity * oi.product_price) as highest_order_value
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE p.artist_id = ?
      AND o.status != 'cancelled'
    `;
    
    db.query(query, [artistId], callback);
  },

  // Get inventory insights
  getInventoryInsights: (artistId, callback) => {
    const query = `
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
        SUM(CASE WHEN quantity <= 5 AND quantity > 0 THEN 1 ELSE 0 END) as low_stock,
        AVG(price) as average_price,
        SUM(quantity) as total_inventory_value
      FROM products 
      WHERE artist_id = ?
    `;
    
    db.query(query, [artistId], callback);
  }
};

module.exports = Analytics;