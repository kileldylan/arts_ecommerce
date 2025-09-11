const db = require('../config/db');
const path = require('path');
const fs = require('fs');

// Helper: generate slug
const generateSlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

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

// ✅ Simple safe JSON parse
const safeJsonParse = (str) => {
  try {
    return str ? JSON.parse(str) : [];
  } catch {
    return [];
  }
};

// ✅ Always return proper URLs
const formatImageUrls = (imagesArray) => {
  if (!Array.isArray(imagesArray)) return [];
  return imagesArray.map((img) => {
    if (!img) return '';
    if (img.startsWith('http') || img.startsWith('/uploads')) return img;
    return `/uploads/${img}`;
  }).filter(Boolean);
};

// Helper: delete old files
const deleteOldImages = (oldImageUrls) => {
  if (!oldImageUrls || !Array.isArray(oldImageUrls)) return;
  oldImageUrls.forEach((url) => {
    if (url) {
      const filename = path.basename(url);
      const filePath = path.join(__dirname, '../uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting old image:', err);
        });
      }
    }
  });
};

const Product = {
  // Create new product
  create: (productData, callback) => {
    ['weight', 'length', 'width', 'height'].forEach((f) => {
      if (!productData[f]) productData[f] = null;
      else productData[f] = parseFloat(productData[f]);
    });

    const {
      name, description, price, compare_price, cost_per_item, category_id,
      artist_id, sku, barcode, quantity, allow_out_of_stock_purchases,
      weight, length, width, height, is_published, is_featured, is_digital,
      requires_shipping, seo_title, seo_description, slug, images = []
    } = productData;

    const handleCreate = (finalSlug) => {
      const query = `
        INSERT INTO products (
          name, description, price, compare_price, cost_per_item, category_id,
          artist_id, sku, barcode, quantity, allow_out_of_stock_purchases,
          weight, length, width, height, is_published, is_featured, is_digital,
          requires_shipping, seo_title, seo_description, slug, images
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const imagesJson = JSON.stringify(images);

      db.query(query, [
        name, description, price, compare_price, cost_per_item, category_id,
        artist_id, sku, barcode, quantity, allow_out_of_stock_purchases,
        weight, length, width, height, is_published, is_featured, is_digital,
        requires_shipping, seo_title, seo_description, finalSlug, imagesJson
      ], (err, results) => {
        if (err) return callback(err);
        Product.findById(results.insertId, callback);
      });
    };

    if (slug) handleCreate(slug);
    else generateUniqueSlug(name, (err, finalSlug) => {
      if (err) return callback(err);
      handleCreate(finalSlug);
    });
  },

  findById: (id, callback) => {
    db.query('SELECT * FROM products WHERE id = ?', [id], (err, results) => {
      if (err) return callback(err);
      if (results.length === 0) return callback(null, []);
      const products = results.map((p) => ({
        ...p,
        images: formatImageUrls(safeJsonParse(p.images))
      }));
      callback(null, products);
    });
  },

  findAll: (filters = {}, callback) => {
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    if (filters.artist_id) { query += ' AND artist_id = ?'; params.push(filters.artist_id); }
    if (filters.category_id) { query += ' AND category_id = ?'; params.push(filters.category_id); }
    if (filters.is_published !== undefined) { query += ' AND is_published = ?'; params.push(filters.is_published); }

    db.query(query, params, (err, results) => {
      if (err) return callback(err);
      const products = results.map((p) => ({
        ...p,
        images: formatImageUrls(safeJsonParse(p.images))
      }));
      callback(null, products);
    });
  },

  update: (id, productData, callback) => {
  Product.findById(id, (err, current) => {
    if (err) return callback(err);
    if (current.length === 0) return callback(new Error('Product not found'));

    ['weight', 'length', 'width', 'height'].forEach((f) => {
      if (!productData[f]) productData[f] = null;
      else productData[f] = parseFloat(productData[f]);
    });

    const fields = [];
    const values = [];

    Object.entries(productData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'images') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    // ✅ Save merged images (no delete unless explicitly requested)
    if (productData.images && Array.isArray(productData.images)) {
      fields.push('images = ?');
      values.push(JSON.stringify(productData.images));
    }

    if (fields.length === 0) return callback(new Error('No fields to update'));

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
    db.query(query, values, (err, results) => {
      if (err) return callback(err);
      Product.findById(id, callback); // return updated product
    });
  });
},

  delete: (id, callback) => {
    Product.findById(id, (err, products) => {
      if (err) return callback(err);
      if (products.length > 0) deleteOldImages(safeJsonParse(products[0].images));
      db.query('DELETE FROM products WHERE id = ?', [id], callback);
    });
  }
};

module.exports = Product;
