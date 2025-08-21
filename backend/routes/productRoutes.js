// backend/routes/products.js
const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getArtistProducts
} = require('../controllers/productController');
const { auth } = require('../middleware/auth');

// Public routes
router.get('/products', getAllProducts);
router.get('/products/:id', getProduct);
router.get('/products/artist/:artistId?', getArtistProducts);

// Protected routes
router.post('/products', auth, createProduct);
router.put('/products/:id', auth, updateProduct);
router.delete('/products/:id', auth, deleteProduct);

module.exports = router;