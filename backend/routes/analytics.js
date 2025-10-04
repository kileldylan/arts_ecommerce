// backend/routes/analytics.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { auth } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

// Get comprehensive analytics (cache for 5 minutes)
router.get('/artist', auth, cacheMiddleware(300), analyticsController.getArtistAnalytics);

// Export reports (no cache)
router.get('/export', auth, analyticsController.exportReports);

// Sales over time (cache for 10 minutes)
router.get('/sales-over-time', auth, cacheMiddleware(600), analyticsController.getSalesOverTime);

module.exports = router;