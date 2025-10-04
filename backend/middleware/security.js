const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// Security headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: "same-origin" }
});

// Rate limiting - tailored for your API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
});

// Auth-specific rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per window
  message: {
    success: false,
    error: 'Too many login attempts, please try again after 15 minutes.'
  },
  skipSuccessfulRequests: true,
});

// Slow down after certain requests
// Slow down after certain requests - FIXED VERSION
const speedLimiter = slowDown({
  windowMs: 1 * 60 * 1000, // 1 minute
  delayAfter: 50, // allow 50 requests per minute
  delayMs: 500, // then add 500ms delay per request
  validate: { delayMs: false } // This disables the warning
});

module.exports = {
  securityHeaders,
  apiLimiter,
  authLimiter,
  speedLimiter
};