const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
const axios = require('axios')

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

// Google Strategy - FIXED VERSION
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
  scope: ['profile', 'email'],
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google profile received:', profile);
    
    if (!profile || !profile.emails || !profile.emails[0]) {
      return done(new Error("No email provided by Google"), null);
    }

    const email = profile.emails[0].value;
    const name = profile.displayName || profile.name?.givenName || 'Google User';
    const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : '';
    
    User.findByEmail(email, async (err, users) => {
      if (err) return done(err);

      if (users && users.length > 0) {
        return done(null, users[0]);
      } else {
        const newUser = {
          name,
          email,
          password: '',
          user_type: 'customer',
          avatar,
          google_id: profile.id
        };

        User.create(newUser, (err, user) => {
          if (err) return done(err);
          return done(null, user);
        });
      }
    });
  } catch (error) {
    console.error("Google OAuth error:", error);
    done(error, null);
  }
}));

// GitHub Strategy (unchanged, since it's working)
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "/api/auth/github/callback",
  scope: ['user:email']
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
          user_type: 'customer', // Changed to user_type
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