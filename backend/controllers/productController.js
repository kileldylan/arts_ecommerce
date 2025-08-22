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
  try {
    console.log('Creating product with data:', req.body);
    console.log('Authenticated user:', req.user);
    
    const productData = {
      ...req.body,
      artist_id: req.user.id // Set artist from authenticated user
    };

    // Validate required fields
    if (!productData.name || !productData.description || !productData.price || !productData.category_id) {
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
        return res.status(500).json({ 
          message: 'Error creating product', 
          error: err.message,
          code: err.code
        });
      }

      // Add images if provided
      if (req.body.images && req.body.images.length > 0) {
        Product.addImages(product.id, req.body.images, (err) => {
          if (err) {
            console.error('Error adding product images:', err);
            // Still return success but log the image error
          }
          
          res.status(201).json({
            message: 'Product created successfully',
            product: product
          });
        });
      } else {
        res.status(201).json({
          message: 'Product created successfully',
          product: product
        });
      }
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

    // ...convert fields as before...

    Product.findById(productId, (err, products) => {
      if (err) return res.status(500).json({ message: 'Server error', error: err.message });
      if (products.length === 0) return res.status(404).json({ message: 'Product not found' });

      const product = products[0];
      if (product.artist_id !== req.user.id && req.user.user_type !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Separate images from main update data
      const { images, ...mainUpdateData } = productData;

      Product.update(productId, mainUpdateData, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error updating product', error: err.message });

        // If images are provided, update them
        if (Array.isArray(images)) {
          const db = require('../config/db');
          db.query('DELETE FROM product_images WHERE product_id = ?', [productId], (delErr) => {
            if (delErr) console.error('Error deleting old images:', delErr);
            Product.addImages(productId, images, (imgErr) => {
              if (imgErr) console.error('Error adding new images:', imgErr);
              return res.json({
                message: 'Product and images updated successfully',
                affectedRows: results.affectedRows
              });
            });
          });
        } else {
          return res.json({
            message: 'Product updated successfully',
            affectedRows: results.affectedRows
          });
        }
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
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