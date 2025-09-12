const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

// Get all products (unchanged)
exports.getAllProducts = (req, res) => {
  const filters = { ...req.query };
  Product.findAll(filters, (err, products) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
    res.json(products);
  });
};

// Get single product (unchanged)
exports.getProduct = (req, res) => {
  const productId = req.params.id;
  Product.findById(productId, (err, products) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(products[0]);
  });
};

// Helper function to parse boolean values from form data
const parseBoolean = (value) => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  if (value === 'on') return true;
  if (value === 'off') return false;
  return Boolean(value);
};

// Helper function to parse number values
const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};

exports.createProduct = (req, res) => {
  try {
    console.log('=== CREATE PRODUCT DEBUG ===');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    console.log('Request files:', req.files ? req.files.map(f => ({ name: f.originalname, size: f.size })) : 'No files');
    console.log('Authenticated user:', req.user); // Debug user

    // Validate authentication
    if (!req.user || !req.user.id) {
      // Clean up uploaded files
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      }
      return res.status(401).json({ message: 'Authentication required: user ID missing' });
    }

    // Validate required fields
    const {
      name, description, price, compare_price, cost_per_item, category_id,
      sku, barcode, quantity, allow_out_of_stock_purchases,
      weight, length, width, height, is_published, is_featured, is_digital,
      requires_shipping, seo_title, seo_description, slug
    } = req.body;

    if (!name || !description || !price || !category_id) {
      // Clean up uploaded files
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      }
      return res.status(400).json({
        message: 'Missing required fields: name, description, price, or category_id',
      });
    }

    // Collect uploaded files
    const imagePaths = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

    const productData = {
      name,
      description,
      price: parseNumber(price),
      compare_price: parseNumber(compare_price),
      cost_per_item: parseNumber(cost_per_item),
      category_id: parseInt(category_id),
      artist_id: req.user.id, // ✅ Use authenticated user's ID
      sku: sku || '',
      barcode: barcode || '',
      quantity: parseInt(quantity) || 0,
      allow_out_of_stock_purchases: parseBoolean(allow_out_of_stock_purchases),
      weight: parseNumber(weight),
      length: parseNumber(length),
      width: parseNumber(width),
      height: parseNumber(height),
      is_published: parseBoolean(is_published),
      is_featured: parseBoolean(is_featured),
      is_digital: parseBoolean(is_digital),
      requires_shipping: parseBoolean(requires_shipping),
      seo_title: seo_title || '',
      seo_description: seo_description || '',
      slug,
      images: imagePaths,
    };

    console.log('Product data for DB:', productData);

    Product.create(productData, (err, product) => {
      if (err) {
        // Clean up uploaded files on DB error
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json(product);
    });
  } catch (error) {
    // Clean up uploaded files on unexpected error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    console.error('Unexpected error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update Product
exports.updateProduct = (req, res) => {
  try {
    const { id } = req.params;

    const {
      name, description, price, compare_price, cost_per_item, category_id,
      artist_id, sku, barcode, quantity, allow_out_of_stock_purchases,
      weight, length, width, height, is_published, is_featured, is_digital,
      requires_shipping, seo_title, seo_description, slug
    } = req.body;

    const imagePaths = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

    const updatedData = {
      name, description, price, compare_price, cost_per_item, category_id,
      artist_id, sku, barcode, quantity, allow_out_of_stock_purchases,
      weight, length, width, height, is_published, is_featured, is_digital,
      requires_shipping, seo_title, seo_description, slug,
      images: imagePaths.length > 0 ? imagePaths : undefined // ✅ only if new images
    };

    Product.update(id, updatedData, (err, product) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json(product);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete product (unchanged, already good with deleteOldImages in model)
exports.deleteProduct = (req, res) => {
  const productId = req.params.id;
  Product.findById(productId, (err, products) => {
    if (err) return res.status(500).json({ message: 'Server error', error: err.message });
    if (products.length === 0) return res.status(404).json({ message: 'Product not found' });

    const product = products[0];
    if (product.artist_id !== req.user.id && req.user.user_type !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    Product.delete(productId, (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error', error: err.message });
      res.json({ message: 'Product deleted successfully', affectedRows: results.affectedRows });
    });
  });
};

// Get products by artist (unchanged)
exports.getArtistProducts = (req, res) => {
  const artistId = req.params.artistId || req.user.id;
  const filters = { artist_id: artistId, ...req.query };
  Product.findAll(filters, (err, products) => {
    if (err) return res.status(500).json({ message: 'Server error', error: err.message });
    res.json(products);
  });
};