// backend/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
const axios = require('axios');   // for CommonJS

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser((id, done) => {
  User.findById(id, (err, users) => {
    done(err, users[0]);
  });
});

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    User.findByEmail(profile.emails[0].value, async (err, users) => {
      if (err) return done(err);
      
      if (users.length > 0) {
        // User exists, return user
        return done(null, users[0]);
      } else {
        // Create new user
        const newUser = {
          name: profile.displayName,
          email: profile.emails[0].value,
          password: '', // Social login users won't have password
          userType: 'customer',
          avatar: profile.photos[0].value
        };
        
        User.create(newUser, (err, user) => {
          if (err) return done(err);
          return done(null, user);
        });
      }
    });
  } catch (error) {
    done(error, null);
  }
}));

// GitHub Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "/api/auth/github/callback",
  scope: ['user:email'] // Request email scope
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Fetch user emails using the access token
    let email = '';
    try {
      const response = await axios.get('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `token ${accessToken}`,
          'User-Agent': 'Ujamaa-Collective'
        }
      });
      
      // Find primary email or first verified email
      const emails = response.data;
      const primaryEmail = emails.find(email => email.primary && email.verified);
      const verifiedEmail = emails.find(email => email.verified);
      
      email = primaryEmail ? primaryEmail.email : 
              verifiedEmail ? verifiedEmail.email : 
              emails[0]?.email || `${profile.username}@github.com`;
    } catch (emailError) {
      console.error('Error fetching GitHub emails:', emailError);
      email = `${profile.username}@github.com`;
    }
    
    // Check if user already exists
    User.findByEmail(email, async (err, users) => {
      if (err) return done(err);
      
      if (users.length > 0) {
        return done(null, users[0]);
      } else {
        const newUser = {
          name: profile.displayName || profile.username,
          email: email,
          password: '',
          userType: 'customer',
          avatar: profile.photos[0].value
        };
        
        User.create(newUser, (err, user) => {
          if (err) return done(err);
          return done(null, user);
        });
      }
    });
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    done(error, null);
  }
}));

module.exports = passport;