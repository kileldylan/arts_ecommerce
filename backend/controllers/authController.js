// backend/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
};

// OAuth success handler
exports.oauthSuccess = (req, res) => {
  if (!req.user) {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
  }
  
  // Generate token
  const token = generateToken(req.user.id);
  
  // Redirect to frontend with token
  res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`);
};

// OAuth failure handler
exports.oauthFailure = (req, res) => {
  res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
};

exports.register = (req, res) => {
  const { name, email, password, userType, phone, bio, specialty, portfolio, socialMedia } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email, and password' });
  }

  // Check if admin registration requires invite code
  if (userType === 'admin') {
    const { inviteCode } = req.body;
    if (inviteCode !== process.env.ADMIN_INVITE_CODE) {
      return res.status(400).json({ message: 'Invalid admin invite code' });
    }
  }

  // Check if user already exists
  User.findByEmail(email, (err, users) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }

    if (users.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const userData = {
      name,
      email,
      password,
      userType: userType || 'customer',
      phone,
      bio,
      specialty,
      portfolio,
      socialMedia
    };

    User.create(userData, (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Error creating user' });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      // Generate token
      const token = generateToken(user.id);

      res.status(201).json({
        message: 'User created successfully',
        token,
        user: userWithoutPassword
      });
    });
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  // Find user by email
  User.findByEmail(email, (err, users) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    User.comparePassword(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }

      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Generate token
      const token = generateToken(user.id);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        message: 'Login successful',
        token,
        user: userWithoutPassword
      });
    });
  });
};

exports.getMe = (req, res) => {
  User.findById(req.user.id, (err, users) => {
    if (err) {
      return res.status(500).json({ message: "Server error" });
    }

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];

    // Ensure avatar has a full URL
    if (user.avatar) {
      if (!user.avatar.startsWith("http")) {
        user.avatar = `${process.env.SERVER_URL || "http://localhost:5000"}/uploads/${user.avatar}`;
      }
    }

    res.json(user);
  });
};