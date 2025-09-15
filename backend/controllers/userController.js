// backend/controllers/userController.js
const User = require('../models/User');

// ======================= GET PROFILE =======================
exports.getProfile = (req, res) => {
  const userId = req.params.id || req.user.id;

  User.findById(userId, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }

    // Handle case when User.findById returns array or object
    const user = Array.isArray(result) ? result[0] : result;

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Normalize avatar to full URL
    if (user.avatar && !user.avatar.startsWith('http')) {
      user.avatar = `${req.protocol}://${req.get('host')}/uploads/${user.avatar}`;
    }

    // Normalize social_media
    if (user.social_media) {
      try {
        user.social_media = JSON.parse(user.social_media);
      } catch {
        user.social_media = {};
      }
    } else {
      user.social_media = {};
    }

    return res.json(user);
  });
};

// ======================= UPDATE PROFILE =======================
exports.updateProfile = (req, res) => {
  const userId = req.user.id;

  const {
    name,
    phone,
    bio,
    specialty,
    portfolio,
    website,
    instagram,
    facebook,
    twitter
  } = req.body;

  let avatarPath = null;
  if (req.file) {
    // only save relative path in DB
    avatarPath = `avatars/${req.file.filename}`;
  }

  const social_media = JSON.stringify({
    website: website || null,
    instagram: instagram || null,
    facebook: facebook || null,
    twitter: twitter || null,
  });

  const updateData = { name, phone, bio, specialty, portfolio, social_media };
  if (avatarPath) updateData.avatar = avatarPath;

  User.updateProfile(userId, updateData, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    User.findById(userId, (err, result) => {
      if (err) return res.status(500).json({ message: 'Server error' });

      const updatedUser = Array.isArray(result) ? result[0] : result;
      if (!updatedUser) return res.status(404).json({ message: 'User not found' });

      if (updatedUser.avatar && !updatedUser.avatar.startsWith('http')) {
        updatedUser.avatar = `${req.protocol}://${req.get('host')}/uploads/${updatedUser.avatar}`;
      }

      if (updatedUser.social_media) {
        try {
          updatedUser.social_media = JSON.parse(updatedUser.social_media);
        } catch {
          updatedUser.social_media = {};
        }
      } else {
        updatedUser.social_media = {};
      }

      return res.json({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    });
  });
};

// ======================= GET ALL ARTISTS =======================
exports.getAllArtists = (req, res) => {
  const query = `
    SELECT id, name, email, bio, specialty, portfolio, social_media, avatar, created_at 
    FROM users 
    WHERE user_type = 'artist'
    ORDER BY created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }

    return res.json(results);
  });
};
