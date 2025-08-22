// backend/models/Product.js
const db = require('../config/db');

// Helper function to generate slug
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

// Helper function to generate unique slug
const generateUniqueSlug = (name, callback) => {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  const checkSlug = () => {
    const query = 'SELECT id FROM products WHERE slug = ?';
    db.query(query, [slug], (err, results) => {
      if (err) return callback(err);
      
      if (results.length > 0) {
        // Slug exists, try with counter
        slug = `${baseSlug}-${counter}`;
        counter++;
        checkSlug();
      } else {
        callback(null, slug);
      }
    });
  };

  checkSlug();
};

const Product = {
  // Create new product
  create: (productData, callback) => {
    const {
      name, description, price, compare_price, cost_per_item, category_id,
      artist_id, sku, barcode, quantity, allow_out_of_stock_purchases,
      weight, length, width, height, is_published, is_featured, is_digital,
      requires_shipping, seo_title, seo_description, slug
    } = productData;

    // Generate unique slug if not provided
    if (slug) {
      // If slug is provided, use it directly
      executeInsert(slug);
    } else {
      // Generate unique slug from name
      generateUniqueSlug(name, (err, generatedSlug) => {
        if (err) return callback(err);
        executeInsert(generatedSlug);
      });
    }

    function executeInsert(finalSlug) {
      const query = `
        INSERT INTO products (
          name, description, price, compare_price, cost_per_item, category_id,
          artist_id, sku, barcode, quantity, allow_out_of_stock_purchases,
          weight, length, width, height, is_published, is_featured, is_digital,
          requires_shipping, seo_title, seo_description, slug
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(query, [
        name, 
        description, 
        price, 
        compare_price || null, 
        cost_per_item || null, 
        category_id,
        artist_id, 
        sku || null, 
        barcode || null, 
        quantity || 0, 
        allow_out_of_stock_purchases || false,
        weight || null, 
        length || null, 
        width || null, 
        height || null, 
        is_published || false, 
        is_featured || false, 
        is_digital || false,
        requires_shipping !== false, // Default to true if not specified
        seo_title || null, 
        seo_description || null, 
        finalSlug
      ], (err, results) => {
        if (err) {
          console.error('Database error in Product.create:', err);
          return callback(err);
        }
        
        // Get the newly created product
        const productId = results.insertId;
        Product.findById(productId, (err, productResults) => {
          if (err) {
            console.error('Error fetching created product:', err);
            return callback(err);
          }
          callback(null, { id: productId, ...productResults[0] });
        });
      });
    }
  },

  // Find product by ID
  findById: (id, callback) => {
    const query = `
      SELECT p.*, u.name as artist_name, u.avatar as artist_avatar, c.name as category_name
      FROM products p
      LEFT JOIN users u ON p.artist_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `;
    db.query(query, [id], (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  },

  // Find all products with filters
  findAll: (filters = {}, callback) => {
    let query = `
      SELECT p.*, u.name as artist_name, u.avatar as artist_avatar, c.name as category_name
      FROM products p
      LEFT JOIN users u ON p.artist_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.category_id) {
      query += ' AND p.category_id = ?';
      params.push(filters.category_id);
    }

    if (filters.artist_id) {
      query += ' AND p.artist_id = ?';
      params.push(filters.artist_id);
    }

    if (filters.is_published !== undefined) {
      query += ' AND p.is_published = ?';
      params.push(filters.is_published);
    }

    if (filters.is_featured !== undefined) {
      query += ' AND p.is_featured = ?';
      params.push(filters.is_featured);
    }

    if (filters.min_price) {
      query += ' AND p.price >= ?';
      params.push(filters.min_price);
    }

    if (filters.max_price) {
      query += ' AND p.price <= ?';
      params.push(filters.max_price);
    }

    if (filters.search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    // Add sorting
    query += ' ORDER BY p.created_at DESC';

    // Add pagination
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    db.query(query, params, (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  },

  // Update product
  update: (id, productData, callback) => {
    // Remove slug and images from update data if they exist
    const { slug, images, ...updateData } = productData;

    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      // Only update fields that are not undefined and not empty string
      if (updateData[key] !== undefined && updateData[key] !== '') {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) {
      return callback(new Error('No fields to update'));
    }

    values.push(id);

    const query = `UPDATE products SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    db.query(query, values, (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  },

  // Delete product
  delete: (id, callback) => {
    const query = 'DELETE FROM products WHERE id = ?';
    db.query(query, [id], (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  },

  // Add product images
  addImages: (productId, images, callback) => {
    if (images.length === 0) return callback(null, []);

    const values = images.map(img => [
      productId,
      img.image_url,
      img.alt_text || '',
      img.is_primary || false,
      img.sort_order || 0
    ]);

    const query = 'INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) VALUES ?';
    
    db.query(query, [values], (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  },

  // Get product images
  getImages: (productId, callback) => {
    const query = 'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, is_primary DESC';
    db.query(query, [productId], (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  }
};

module.exports = Product;