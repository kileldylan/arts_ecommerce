// backend/routes/users.js
const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getAllArtists } = require('../controllers/userController');
const { auth } = require('../middleware/auth');

// Remove the ? from the route parameter - Express doesn't use that syntax
router.get('/profile/:id', auth, getProfile);
router.get('/profile', auth, (req, res) => {
  // This will handle the case when no ID is provided (current user's profile)
  req.params = {}; // Clear params to use the auth middleware's user
  getProfile(req, res);
});
router.put('/profile', auth, updateProfile);
router.get('/artists', getAllArtists);

module.exports = router;