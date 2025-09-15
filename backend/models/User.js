// backend/models/User.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  // Find user by email (always returns array)
  findByEmail: (email, callback) => {
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  },

  // Find user by ID (always returns array)
  findById: (id, callback) => {
    const query = 'SELECT id, name, email, user_type, phone, bio, specialty, portfolio, social_media, avatar, created_at FROM users WHERE id = ?';
    db.query(query, [id], (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  },

  // Create new user
  create: (userData, callback) => {
    const { name, email, password, userType, phone, bio, specialty, portfolio, socialMedia, avatar } = userData;
    
    // If password is empty (social login), generate a random one
    const finalPassword = password || Math.random().toString(36).slice(-8);
    
    bcrypt.hash(finalPassword, 10, (err, hashedPassword) => {
      if (err) return callback(err);
      
      const query = `
        INSERT INTO users (name, email, password, user_type, phone, bio, specialty, portfolio, social_media, avatar)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.query(query, [
        name, email, hashedPassword, userType, phone, bio, specialty, portfolio, socialMedia, avatar
      ], (err, results) => {
        if (err) return callback(err);
        
        // Get the newly created user without password
        const userId = results.insertId;
        User.findById(userId, (err, userResults) => {
          if (err) return callback(err);
          callback(null, { id: userId, ...userResults[0] });
        });
      });
    });
  },

  // Find or create user for social login
  findOrCreate: (profile, provider, callback) => {
    const email = profile.emails[0].value;
    const name = profile.displayName;
    const avatar = profile.photos[0].value;
    
    User.findByEmail(email, (err, users) => {
      if (err) return callback(err);
      
      if (users.length > 0) {
        // User exists, return user
        callback(null, users[0]);
      } else {
        // Create new user
        const userData = {
          name,
          email,
          password: '', // Social login
          userType: 'customer',
          avatar
        };
        
        User.create(userData, (err, user) => {
          if (err) return callback(err);
          callback(null, user);
        });
      }
    });
    }
  ,

  // Compare password
  comparePassword: (candidatePassword, hash, callback) => {
    bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
      if (err) return callback(err);
      callback(null, isMatch);
    });
  },

  // Update user profile
  // backend/models/User.js
updateProfile: (userId, userData, callback) => {
  const { name, phone, bio, specialty, portfolio, social_media, avatar } = userData;

  let query = `
    UPDATE users 
    SET name = ?, phone = ?, bio = ?, specialty = ?, portfolio = ?, social_media = ?, updated_at = CURRENT_TIMESTAMP
  `;
  const values = [name, phone, bio, specialty, portfolio, social_media];

  if (avatar) {
    query += `, avatar = ?`;
    values.push(avatar);
  }

  query += ` WHERE id = ?`;
  values.push(userId);

  db.query(query, values, (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
}}

module.exports = User;