// routes/crm.js
const express = require('express');
const router = express.Router();
const crmController = require('../controllers/crmController');
const { auth } = require('../middleware/auth');


// Customer management
router.get('/customers', auth, crmController.getCustomers);
router.get('/customers/search', auth, crmController.searchCustomers);
router.get('/customers/:customerId', auth, crmController.getCustomerDetails);

// Customer notes
router.put('/customers/:customerId/notes', auth, crmController.updateCustomerNotes);

// Analytics
router.get('/analytics', auth, crmController.getCustomerAnalytics);

module.exports = router;