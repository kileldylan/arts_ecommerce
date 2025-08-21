// backend/controllers/userController.js
const User = require('../models/User');

exports.getProfile = (req, res) => {
  const userId = req.params.id || req.user.id;
  
  User.findById(userId, (err, users) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(users[0]);
  });
};

exports.updateProfile = (req, res) => {
  const userId = req.user.id;
  const { name, phone, bio, specialty, portfolio, socialMedia } = req.body;
  
  User.updateProfile(userId, { name, phone, bio, specialty, portfolio, socialMedia }, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get updated user
    User.findById(userId, (err, users) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }
      
      res.json({
        message: 'Profile updated successfully',
        user: users[0]
      });
    });
  });
};

exports.getAllArtists = (req, res) => {
  const query = `
    SELECT id, name, email, bio, specialty, portfolio, social_media, avatar, created_at 
    FROM users 
    WHERE user_type = 'artist'
    ORDER BY created_at DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }
    
    res.json(results);
  });
};