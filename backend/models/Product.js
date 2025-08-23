const db = require('../config/db');

// Helper function to generate slug
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

const generateUniqueSlug = (name, callback) => {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  const checkSlug = () => {
    db.query('SELECT COUNT(*) as count FROM products WHERE slug = ?', [slug], (err, results) => {
      if (err) return callback(err);
      if (results[0].count > 0) {
        slug = `${baseSlug}-${counter++}`;
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
    
    ['weight', 'length', 'width', 'height'].forEach((f) => {
    if (productData[f] === '' || productData[f] === undefined) {
      productData[f] = null;
    } else {
      productData[f] = parseFloat(productData[f]);
    }
  });

    const {
      name, description, price, compare_price, cost_per_item, category_id,
      artist_id, sku, barcode, quantity, allow_out_of_stock_purchases,
      weight, length, width, height, is_published, is_featured, is_digital,
      requires_shipping, seo_title, seo_description, slug, images = []
    } = productData;

      productData.weight = productData.weight === '' ? null : parseFloat(productData.weight);
      productData.length = productData.length === '' ? null : parseFloat(productData.length);
      productData.width  = productData.width  === '' ? null : parseFloat(productData.width);
      productData.height = productData.height === '' ? null : parseFloat(productData.height);

    // Generate unique slug if not provided
    const handleCreate = (finalSlug) => {
      const query = `
        INSERT INTO products (
          name, description, price, compare_price, cost_per_item, category_id,
          artist_id, sku, barcode, quantity, allow_out_of_stock_purchases,
          weight, length, width, height, is_published, is_featured, is_digital,
          requires_shipping, seo_title, seo_description, slug, images
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(query, [
        name, description, price, compare_price, cost_per_item, category_id,
        artist_id, sku, barcode, quantity, allow_out_of_stock_purchases,
        weight, length, width, height, is_published, is_featured, is_digital,
        requires_shipping, seo_title, seo_description, finalSlug, JSON.stringify(images)
      ], (err, results) => {
        if (err) return callback(err);
        Product.findById(results.insertId, callback);
      });
    };

    if (slug) {
      handleCreate(slug);
    } else {
      generateUniqueSlug(name, (err, finalSlug) => {
        if (err) return callback(err);
        handleCreate(finalSlug);
      });
    }
  },

  findById: (id, callback) => {
    db.query('SELECT * FROM products WHERE id = ?', [id], (err, results) => {
      if (err) return callback(err);
      if (results.length === 0) return callback(null, []);
      // Parse images JSON
      const products = results.map(product => ({
        ...product,
        images: product.images ? JSON.parse(product.images) : []
      }));
      callback(null, products);
    });
  },

  findAll: (filters = {}, callback) => {
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    if (filters.artist_id) {
      query += ' AND artist_id = ?';
      params.push(filters.artist_id);
    }
    if (filters.category_id) {
      query += ' AND category_id = ?';
      params.push(filters.category_id);
    }
    if (filters.is_published !== undefined) {
      query += ' AND is_published = ?';
      params.push(filters.is_published);
    }
    // Add more filters as needed

    db.query(query, params, (err, results) => {
      if (err) return callback(err);
      // Parse images JSON
      const products = results.map(product => ({
        ...product,
        images: product.images ? JSON.parse(product.images) : []
      }));
      callback(null, products);
    });
  },

  update: (id, productData, callback) => {
 
    ['weight', 'length', 'width', 'height'].forEach((f) => {
    if (productData[f] === '' || productData[f] === undefined) {
      productData[f] = null;
    } else {
      productData[f] = parseFloat(productData[f]);
    }
  });

    const {
      name, description, price, compare_price, cost_per_item, category_id,
      sku, barcode, quantity, allow_out_of_stock_purchases,
      weight, length, width, height, is_published, is_featured, is_digital,
      requires_shipping, seo_title, seo_description, slug, images
    } = productData;

    productData.weight = productData.weight === '' ? null : parseFloat(productData.weight);
    productData.length = productData.length === '' ? null : parseFloat(productData.length);
    productData.width  = productData.width  === '' ? null : parseFloat(productData.width);
    productData.height = productData.height === '' ? null : parseFloat(productData.height);

    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (price !== undefined) { fields.push('price = ?'); values.push(price); }
    if (compare_price !== undefined) { fields.push('compare_price = ?'); values.push(compare_price); }
    if (cost_per_item !== undefined) { fields.push('cost_per_item = ?'); values.push(cost_per_item); }
    if (category_id !== undefined) { fields.push('category_id = ?'); values.push(category_id); }
    if (sku !== undefined) { fields.push('sku = ?'); values.push(sku); }
    if (barcode !== undefined) { fields.push('barcode = ?'); values.push(barcode); }
    if (quantity !== undefined) { fields.push('quantity = ?'); values.push(quantity); }
    if (allow_out_of_stock_purchases !== undefined) { fields.push('allow_out_of_stock_purchases = ?'); values.push(allow_out_of_stock_purchases); }
    if (weight !== undefined) { fields.push('weight = ?'); values.push(weight); }
    if (length !== undefined) { fields.push('length = ?'); values.push(length); }
    if (width !== undefined) { fields.push('width = ?'); values.push(width); }
    if (height !== undefined) { fields.push('height = ?'); values.push(height); }
    if (is_published !== undefined) { fields.push('is_published = ?'); values.push(is_published); }
    if (is_featured !== undefined) { fields.push('is_featured = ?'); values.push(is_featured); }
    if (is_digital !== undefined) { fields.push('is_digital = ?'); values.push(is_digital); }
    if (requires_shipping !== undefined) { fields.push('requires_shipping = ?'); values.push(requires_shipping); }
    if (seo_title !== undefined) { fields.push('seo_title = ?'); values.push(seo_title); }
    if (seo_description !== undefined) { fields.push('seo_description = ?'); values.push(seo_description); }
    if (slug !== undefined) { fields.push('slug = ?'); values.push(slug); }
    if (images !== undefined) { fields.push('images = ?'); values.push(JSON.stringify(images)); }

    if (fields.length === 0) {
      return callback(new Error('No fields to update'));
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;

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
  }
};
module.exports = Product;