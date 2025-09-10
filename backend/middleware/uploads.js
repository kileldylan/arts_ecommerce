// backend/middleware/uploads.js
const upload = require('../config/multer');

exports.uploadProductImages = upload.array('images', 10);

module.exports = exports;