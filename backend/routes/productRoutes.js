const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const upload = require('../config/multer');
const { auth } = require('../middleware/auth');

// Protect all product routes

// Create product with image upload - FIXED middleware order
router.post('/', 
  upload.array('images', 10), 
  upload.errorHandler,
  auth,
  productController.createProduct
);

// Update product with image upload
router.put('/:id', 
  upload.array('images', 10),
  upload.errorHandler,
  auth,
  productController.updateProduct
);

// ... other routes remain the same
router.delete('/:id', auth ,productController.deleteProduct);
router.get('/all', auth, productController.getAllProducts);
router.get('/artist/:artistId', auth, productController.getArtistProducts);
router.get('/:id', auth, productController.getProduct);

module.exports = router;