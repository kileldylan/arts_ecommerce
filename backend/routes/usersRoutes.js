// backend/routes/usersRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getProfile, updateProfile, getAllArtists } = require('../controllers/userController');
const { auth } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Public routes
router.get('/artists', cacheMiddleware(900), getAllArtists); // Cache for 15 minutes

// Protected routes
router.use(auth);

// Get profile (cache for 5 minutes)
router.get('/profile/:id', cacheMiddleware(300), getProfile);
router.get('/profile', cacheMiddleware(300), (req, res) => {
  req.params = {};
  getProfile(req, res);
});

// Update profile with optional avatar (no cache)
router.put('/profile', upload.single('avatar'), updateProfile);

module.exports = router;