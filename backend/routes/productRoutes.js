const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { upload, handleMulterError } = require('../config/multer'); // Fixed import
const {auth} = require('../middleware/auth');

// Create product with image upload - FIXED middleware order
router.post('/', 
  upload.array('images', 5), // Handle up to 5 files
  handleMulterError, // Add error handling
  auth, 
  productController.createProduct
);

// Update product with image upload
router.put('/:id', 
  upload.array('images', 5),
  handleMulterError,
  auth, 
  productController.updateProduct
);

// Delete product
router.delete('/:id', auth, productController.deleteProduct);

// Get all products
router.get('/all', auth, productController.getAllProducts);

// Get artist products
router.get('/artist/:artistId', auth, productController.getArtistProducts);

// Get single product
router.get('/:id', auth, productController.getProduct);

// Test upload endpoint
router.post('/test-upload',
  upload.array('images', 5),
  handleMulterError,
  (req, res) => {
    console.log('=== TEST UPLOAD DEBUG ===');
    console.log('Files received:', req.files ? req.files.length : 0);
    
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        console.log(`File ${index + 1}:`, {
          originalname: file.originalname,
          filename: file.filename,
          size: file.size,
          path: file.path,
          mimetype: file.mimetype
        });
      });
    }
    
    console.log('Body received:', req.body);
    
    res.json({
      success: true,
      message: 'Upload test successful',
      filesReceived: req.files ? req.files.length : 0,
      files: req.files ? req.files.map(f => f.filename) : []
    });
  }
);

module.exports = router;