// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    User.findById(decoded.userId, (err, users) => {
      if (err || users.length === 0) {
        return res.status(401).json({ message: 'Token is not valid' });
      }
      
      req.user = users[0];
      next();
    });
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const optionalAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      User.findById(decoded.userId, (err, users) => {
        if (!err && users.length > 0) {
          req.user = users[0];
        }
        next();
      });
    } else {
      next();
    }
  } catch (error) {
    next();
  }
};

module.exports = { auth, optionalAuth };