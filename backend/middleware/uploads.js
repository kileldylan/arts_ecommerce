const upload = require('../config/multer');

const uploadProductImages = upload.array('images', 10);

module.exports = { uploadProductImages };
