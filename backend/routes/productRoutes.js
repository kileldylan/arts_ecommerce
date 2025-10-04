// backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { upload, handleMulterError } = require('../config/multer');
const { auth } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

// Public routes (with caching)
router.get('/all', cacheMiddleware(600), productController.getAllProducts); // Cache for 10 minutes
router.get('/:id', cacheMiddleware(600), productController.getProduct); // Cache for 10 minutes
router.get('/artist/:artistId', cacheMiddleware(300), productController.getArtistProducts); // Cache for 5 minutes

// Protected routes
router.use(auth);

// Create product with image upload
router.post('/', 
  upload.array('images', 5),
  handleMulterError,
  productController.createProduct
);

// Update product with image upload
router.put('/:id', 
  upload.array('images', 5),
  handleMulterError,
  productController.updateProduct
);

// Delete product
router.delete('/:id', productController.deleteProduct);

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