const Product = require('../models/Product');
const upload = require('../config/multer');

// Get all products
exports.getAllProducts = (req, res) => {
  const filters = {
    ...req.query
  };

  Product.findAll(filters, (err, products) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
    res.json(products);
  });
};

// Get single product
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
    const productData = {
      ...req.body,
      artist_id: req.user.id
    };

    // Handle uploaded files
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => file.filename);
    } else {
      productData.images = [];
    }

    // Validate required fields
    if (!productData.name || !productData.description || !productData.price || !productData.category_id) {
      // Clean up uploaded files if validation fails
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          const fs = require('fs');
          const path = require('path');
          const filePath = path.join(__dirname, '../uploads', file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
      
      return res.status(400).json({ 
        message: 'Missing required fields: name, description, price, or category_id' 
      });
    }

    // Convert numeric fields
    productData.price = parseFloat(productData.price);
    productData.category_id = parseInt(productData.category_id);
    productData.quantity = parseInt(productData.quantity) || 0;
    if (productData.compare_price) productData.compare_price = parseFloat(productData.compare_price);
    if (productData.cost_per_item) productData.cost_per_item = parseFloat(productData.cost_per_item);
    if (productData.weight) productData.weight = parseFloat(productData.weight);
    if (productData.length) productData.length = parseFloat(productData.length);
    if (productData.width) productData.width = parseFloat(productData.width);
    if (productData.height) productData.height = parseFloat(productData.height);

    // Convert boolean fields
    productData.is_published = Boolean(productData.is_published);
    productData.is_featured = Boolean(productData.is_featured);
    productData.is_digital = Boolean(productData.is_digital);
    productData.requires_shipping = productData.requires_shipping !== false;
    productData.allow_out_of_stock_purchases = Boolean(productData.allow_out_of_stock_purchases);

    Product.create(productData, (err, product) => {
      if (err) {
        console.error('Error creating product:', err);
        
        // Clean up uploaded files if product creation fails
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(__dirname, '../uploads', file.filename);
            if (fs.existsSync(filePath)) {
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
        product: product
      });
    });
  } catch (error) {
    console.error('Error in createProduct:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update product
exports.updateProduct = (req, res) => {
  try {
    const productId = req.params.id;
    let productData = req.body;

    // Handle uploaded files
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => file.filename);
    }

    Product.findById(productId, (err, products) => {
      if (err) return res.status(500).json({ message: 'Server error', error: err.message });
      if (products.length === 0) return res.status(404).json({ message: 'Product not found' });

      Product.update(productId, productData, (err, results) => {
        if (err) {
          // Clean up uploaded files if update fails
          if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
              const fs = require('fs');
              const path = require('path');
              const filePath = path.join(__dirname, '../uploads', file.filename);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            });
          }
          return res.status(500).json({ message: 'Error updating product', error: err.message });
        }

        return res.json({
          message: 'Product updated successfully',
          affectedRows: results.affectedRows
        });
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete product
exports.deleteProduct = (req, res) => {
  const productId = req.params.id;

  Product.findById(productId, (err, products) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err.message });
    }

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = products[0];
    
    if (product.artist_id !== req.user.id && req.user.user_type !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    Product.delete(productId, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
      }

      res.json({
        message: 'Product deleted successfully',
        affectedRows: results.affectedRows
      });
    });
  });
};

// Get products by artist
exports.getArtistProducts = (req, res) => {
  const artistId = req.params.artistId || req.user.id;
  const filters = {
    artist_id: artistId,
    ...req.query
  };

  Product.findAll(filters, (err, products) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
    res.json(products);
  });
};