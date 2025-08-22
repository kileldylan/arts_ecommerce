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
router.get('/', getAllProducts);
router.get('/:id', getProduct);
router.get('/artist/:artistId', getArtistProducts);

// Protected routes
router.post('', auth, createProduct);
router.put('/:id', auth, updateProduct);
router.delete('/:id', auth, deleteProduct);

module.exports = router;