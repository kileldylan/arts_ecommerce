const db = require('../config/db');
const path = require('path');
const fs = require('fs');

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

// Helper function to delete old images when updating
const deleteOldImages = (oldImageUrls) => {
  if (!oldImageUrls || !Array.isArray(oldImageUrls)) return;
  
  oldImageUrls.forEach(imageUrl => {
    if (imageUrl) {
      const filename = path.basename(imageUrl);
      const filePath = path.join(__dirname, '../uploads', filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting old image:', err);
        });
      }
    }
  });
};

// IMPROVED SAFE JSON PARSE FUNCTION - HANDLES ALL CASES
const safeJsonParse = (jsonString, defaultValue = []) => {
  // Handle null, undefined, empty string
  if (!jsonString || jsonString === 'null' || jsonString === 'undefined' || jsonString === '') {
    return defaultValue;
  }
  
  // Handle empty array string
  if (jsonString === '[]') {
    return [];
  }
  
  // Handle already parsed arrays (in case of double parsing)
  if (Array.isArray(jsonString)) {
    return jsonString;
  }
  
  // Handle string that might be JSON
  if (typeof jsonString === 'string') {
    try {
      // Trim and check if it looks like JSON
      const trimmed = jsonString.trim();
      
      // If it starts with [ and ends with ], try to parse as JSON array
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : defaultValue;
      }
      
      // If it starts with { and ends with }, try to parse as JSON object
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : defaultValue;
      }
      
      // If it contains '[object Object]' or malformed data, return empty array
      if (trimmed.includes('[object Object]') || trimmed.includes('uploads/[')) {
        console.warn('Found malformed image data, returning empty array:', trimmed);
        return [];
      }
      
      // If it's a comma-separated string, split it
      if (trimmed.includes(',')) {
        return trimmed.split(',').map(item => item.trim()).filter(item => item);
      }
      
      // If it's a single string, return as array with one item
      return [trimmed];
      
    } catch (error) {
      console.error('Error parsing JSON, returning default:', jsonString, error);
      // If it's a string but not valid JSON, check if it's a single filename
      if (typeof jsonString === 'string' && jsonString.length > 0 && !jsonString.includes('[') && !jsonString.includes('{')) {
        return [jsonString];
      }
      return defaultValue;
    }
  }
  
  return defaultValue;
};

// Helper function to format image URLs for response
// IMPROVED formatImageUrls function - HANDLES NON-STRING VALUES
const formatImageUrls = (imagesArray) => {
  if (!Array.isArray(imagesArray)) return [];
  
  return imagesArray.map(img => {
    // Handle null, undefined, or non-string values
    if (img === null || img === undefined) {
      return '';
    }
    
    // Convert to string if it's not already
    const imgStr = typeof img === 'string' ? img : String(img);
    
    // If it's empty, return empty string
    if (!imgStr || imgStr.trim() === '') {
      return '';
    }
    
    // If it's already a full URL, return as-is
    if (imgStr.startsWith('http') || imgStr.startsWith('/')) {
      return imgStr;
    }
    
    // If it's a filename, add the /uploads/ prefix
    return `/uploads/${imgStr}`;
  }).filter(img => img && img !== ''); // Remove empty strings
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
      
      // Ensure images is always a valid JSON array
      const imagesJson = Array.isArray(images) ? JSON.stringify(images) : '[]';
      
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
      
      // USE IMPROVED SAFE JSON PARSE AND FORMAT URLS
      const products = results.map(product => ({
        ...product,
        images: formatImageUrls(safeJsonParse(product.images))
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

    db.query(query, params, (err, results) => {
      if (err) return callback(err);
      
      // USE IMPROVED SAFE JSON PARSE AND FORMAT URLS
      const products = results.map(product => ({
        ...product,
        images: formatImageUrls(safeJsonParse(product.images))
      }));
      callback(null, products);
    });
  },

  update: (id, productData, callback) => {
    // First get the current product to handle image deletion
    Product.findById(id, (err, currentProducts) => {
      if (err) return callback(err);
      
      if (currentProducts.length > 0) {
        const currentProduct = currentProducts[0];
        // USE IMPROVED SAFE JSON PARSE
        const oldImages = safeJsonParse(currentProduct.images);
        
        // If new images are provided, delete old ones
        if (productData.images && Array.isArray(productData.images)) {
          deleteOldImages(oldImages);
        }
      }

      // Continue with update
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
      if (images !== undefined) { 
        // Ensure images is always valid JSON
        const imagesJson = Array.isArray(images) ? JSON.stringify(images) : '[]';
        fields.push('images = ?'); 
        values.push(imagesJson); 
      }

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
    });
  },

  // Delete product
  delete: (id, callback) => {
    // First get the product to delete associated images
    Product.findById(id, (err, products) => {
      if (err) return callback(err);
      
      if (products.length > 0) {
        const product = products[0];
        // USE IMPROVED SAFE JSON PARSE
        const images = safeJsonParse(product.images);
        deleteOldImages(images);
      }

      // Then delete the product
      const query = 'DELETE FROM products WHERE id = ?';
      db.query(query, [id], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
      });
    });
  }
};

module.exports = Product;