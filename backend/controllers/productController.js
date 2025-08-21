// backend/controllers/productController.js
const Product = require('../models/Product');

// Get all products
exports.getAllProducts = (req, res) => {
  const filters = {
    is_published: true,
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

    // Get product images
    Product.getImages(productId, (err, images) => {
      if (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
      }

      const product = {
        ...products[0],
        images: images
      };

      res.json(product);
    });
  });
};

// Create new product
exports.createProduct = (req, res) => {
  const productData = {
    ...req.body,
    artist_id: req.user.id // Set artist from authenticated user
  };

  Product.create(productData, (err, product) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err.message });
    }

    // Add images if provided
    if (req.body.images && req.body.images.length > 0) {
      Product.addImages(product.id, req.body.images, (err) => {
        if (err) {
          console.error('Error adding product images:', err);
        }
      });
    }

    res.status(201).json({
      message: 'Product created successfully',
      product: product
    });
  });
};

// Update product
exports.updateProduct = (req, res) => {
  const productId = req.params.id;
  const productData = req.body;

  // Check if user owns the product or is admin
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

    Product.update(productId, productData, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
      }

      res.json({
        message: 'Product updated successfully',
        affectedRows: results.affectedRows
      });
    });
  });
};

// Delete product
exports.deleteProduct = (req, res) => {
  const productId = req.params.id;

  // Check if user owns the product or is admin
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