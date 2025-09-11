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
    console.log('Request files:', req.files); // Detailed file info
    console.log('Request body:', req.body);
    
    // Check if files were received
    if (!req.files || req.files.length === 0) {
      console.log('NO FILES RECEIVED - This is the main issue!');
      console.log('Request headers:', req.headers);
    } else {
      console.log('Files received:', req.files.length);
      req.files.forEach((file, index) => {
        console.log(`File ${index + 1}:`, {
          originalname: file.originalname,
          filename: file.filename,
          size: file.size,
          path: file.path,
          mimetype: file.mimetype
        });
        
        // Check if file actually exists on disk
        const fileExists = fs.existsSync(file.path);
        console.log(`File exists on disk: ${fileExists}`);
      });
    }

    // Parse and validate required fields
    const { name, description, price, category_id } = req.body;
    if (!name || !description || !price || !category_id) {
      // Clean up uploaded files if validation fails
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      return res.status(400).json({
        message: 'Missing required fields: name, description, price, or category_id'
      });
    }

    // Process images
    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      imagePaths = req.files.map(file => `/uploads/${file.filename}`);
    }
    
    console.log('Final image paths:', imagePaths);

    const productData = {
      name: name,
      description: description,
      price: parseNumber(price),
      compare_price: parseNumber(req.body.compare_price),
      cost_per_item: parseNumber(req.body.cost_per_item),
      category_id: parseInt(category_id),
      artist_id: req.user.id,
      sku: req.body.sku || '',
      barcode: req.body.barcode || '',
      quantity: parseInt(req.body.quantity) || 0,
      weight: parseNumber(req.body.weight),
      length: parseNumber(req.body.length),
      width: parseNumber(req.body.width),
      height: parseNumber(req.body.height),
      seo_title: req.body.seo_title || '',
      seo_description: req.body.seo_description || '',
      is_published: parseBoolean(req.body.is_published),
      is_featured: parseBoolean(req.body.is_featured),
      is_digital: parseBoolean(req.body.is_digital),
      requires_shipping: parseBoolean(req.body.requires_shipping),
      allow_out_of_stock_purchases: parseBoolean(req.body.allow_out_of_stock_purchases),
      images: JSON.stringify(imagePaths)
    };

    console.log('Product data for database:', productData);

    Product.create(productData, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        // Clean up uploaded files on database error
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        }
        return res.status(500).json({
          message: 'Error creating product',
          error: err.message
        });
      }

      // Return the created product with proper image URLs
      const createdProduct = {
        id: result.insertId,
        ...productData,
        images: imagePaths
      };

      res.status(201).json({
        message: 'Product created successfully',
        product: createdProduct
      });
    });

  } catch (error) {
    console.error('Unexpected error in createProduct:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateProduct = (req, res) => {
  try {
    console.log('updateProduct - req.files:', req.files);
    console.log('updateProduct - req.body:', req.body);

    const productId = req.params.id;
    Product.findById(productId, (err, products) => {
      if (err) return res.status(500).json({ message: 'Server error', error: err.message });
      if (products.length === 0) return res.status(404).json({ message: 'Product not found' });

      const currentProduct = products[0];
      let images = currentProduct.images || [];

      // Append new images if uploaded
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => `/uploads/${file.filename}`);
        images = [...images, ...newImages]; // merge instead of replace
      }

      const productData = {
        ...req.body,
        images
      };

      Product.update(productId, productData, (err, updated) => {
        if (err) {
          // Cleanup if DB error
          if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
              const filePath = path.join(__dirname, '..', 'uploads', file.filename);
              if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });
          }
          return res.status(500).json({ message: 'Error updating product', error: err.message });
        }

        res.json({
          message: 'Product updated successfully',
          product: updated[0]
        });
      });
    });
  } catch (error) {
    console.error('Error in updateProduct:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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