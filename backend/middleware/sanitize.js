// backend/middleware/sanitize.js
const sanitizeHtml = require('sanitize-html');

const sanitizeInput = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeHtml(req.body[key], {
          allowedTags: [], // No HTML tags allowed
          allowedAttributes: {},
          allowedIframeHostnames: []
        }).trim();
      }
    });
  }
  
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeHtml(req.query[key], {
          allowedTags: [],
          allowedAttributes: {},
          allowedIframeHostnames: []
        }).trim();
      }
    });
  }
  
  next();
};

module.exports = sanitizeInput;