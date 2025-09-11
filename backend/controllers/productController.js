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

// Create Product
exports.createProduct = (req, res) => {
  try {
    console.log('createProduct - req.files:', req.files); // Debug
    console.log('createProduct - req.body:', req.body); // Debug

    const productData = {
      ...req.body,
      artist_id: req.user.id,
      images: req.files ? req.files.map(file => `/uploads/${file.filename}`) : []
    };

    // Validate required fields
    if (!productData.name || !productData.description || !productData.price || !productData.category_id) {
      // Clean up uploaded files
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          const filePath = path.join(__dirname, '..', 'uploads', file.filename);
          if (fs.existsSync(filePath)) {
            console.log('Cleaning up file:', filePath); // Debug
            fs.unlinkSync(filePath);
          }
        });
      }
      return res.status(400).json({
        message: 'Missing required fields: name, description, price, or category_id'
      });
    }

    // Convert fields
    productData.price = parseFloat(productData.price);
    productData.category_id = parseInt(productData.category_id);
    productData.quantity = parseInt(productData.quantity) || 0;
    if (productData.compare_price) productData.compare_price = parseFloat(productData.compare_price);
    if (productData.cost_per_item) productData.cost_per_item = parseFloat(productData.cost_per_item);
    if (productData.weight) productData.weight = parseFloat(productData.weight);
    if (productData.length) productData.length = parseFloat(productData.length);
    if (productData.width) productData.width = parseFloat(productData.width);
    if (productData.height) productData.height = parseFloat(productData.height);
    productData.is_published = Boolean(productData.is_published);
    productData.is_featured = Boolean(productData.is_featured);
    productData.is_digital = Boolean(productData.is_digital);
    productData.requires_shipping = productData.requires_shipping !== false;
    productData.allow_out_of_stock_purchases = Boolean(productData.allow_out_of_stock_purchases);

    Product.create(productData, (err, product) => {
      if (err) {
        console.error('Error creating product:', err);
        // Clean up uploaded files
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
            const filePath = path.join(__dirname, '..', 'uploads', file.filename);
            if (fs.existsSync(filePath)) {
              console.log('Cleaning up file on DB error:', filePath); // Debug
              fs.unlinkSync(filePath);
            }
          });
        }
        return res.status(500).json({
          message: 'Error creating product',
          error: err.message,
          code: err.code
        });
      }
      res.status(201).json({
        message: 'Product created successfully',
        product
      });
    });
  } catch (error) {
    console.error('Error in createProduct:', error);
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