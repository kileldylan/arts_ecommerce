// routes/analytics.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { auth } = require('../middleware/auth');

// Get comprehensive analytics
router.get('/artist', auth, analyticsController.getArtistAnalytics);

// Export reports
router.get('/export', auth, analyticsController.exportReports);

module.exports = router;