// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { register, login, getMe, oauthSuccess, oauthFailure } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');

// Apply rate limiting to auth routes
router.use(authLimiter);

// Local auth routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/login',
    session: false 
  }),
  oauthSuccess
);

// GitHub OAuth routes
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/api/auth/failure', session: false }),
  oauthSuccess
);

// OAuth failure route
router.get('/failure', oauthFailure);

module.exports = router;