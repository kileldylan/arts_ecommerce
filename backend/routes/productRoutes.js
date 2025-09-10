// backend/routes/products.js
const express = require('express');
const router = express.Router();
const {
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getArtistProducts,
  getAllProducts
} = require('../controllers/productController');
const { auth } = require('../middleware/auth');
const { uploadProductImages } = require('../middleware/uploads'); // Import from middleware

// Public routes
router.get('/all', getAllProducts);
router.get('/:id', getProduct);
router.get('/artist/:artistId', getArtistProducts);

// Protected routes
router.post('/', auth, uploadProductImages, createProduct);
router.put('/:id', auth, uploadProductImages, updateProduct);
router.delete('/:id', auth, deleteProduct);

module.exports = router;