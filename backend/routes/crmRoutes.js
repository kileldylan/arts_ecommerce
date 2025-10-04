// backend/routes/crm.js
const express = require('express');
const router = express.Router();
const crmController = require('../controllers/crmController');
const { auth } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

// Customer management (cache for 5 minutes)
router.get('/customers', auth, cacheMiddleware(300), crmController.getCustomers);
router.get('/customers/search', auth, crmController.searchCustomers);
router.get('/customers/:customerId', auth, cacheMiddleware(300), crmController.getCustomerDetails);

// Customer notes (no cache)
router.put('/customers/:customerId/notes', auth, crmController.updateCustomerNotes);

// Analytics (cache for 10 minutes)
router.get('/analytics', auth, cacheMiddleware(600), crmController.getCustomerAnalytics);

// Customer LTV analysis (cache for 15 minutes)
router.get('/customer-ltv', auth, cacheMiddleware(900), crmController.getCustomerLTV);

// Customer segmentation (cache for 15 minutes)
router.get('/segmentation', auth, cacheMiddleware(900), crmController.getCustomerSegmentation);

module.exports = router;