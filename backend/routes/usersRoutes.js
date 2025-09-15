const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getProfile, updateProfile, getAllArtists } = require('../controllers/userController');
const { auth } = require('../middleware/auth');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/'); // store in /uploads/avatars
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Get profile
router.get('/profile/:id', auth, getProfile);
router.get('/profile', auth, (req, res) => {
  req.params = {};
  getProfile(req, res);
});

// Update profile with optional avatar
router.put('/profile', auth, upload.single('avatar'), updateProfile);

// Get all artists
router.get('/artists', getAllArtists);

module.exports = router;
