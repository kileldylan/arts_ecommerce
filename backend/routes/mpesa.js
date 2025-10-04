// backend/routes/mpesa.js
const express = require('express');
const router = express.Router();
const mpesaController = require('../controllers/mpesaController');
const { apiLimiter } = require('../middleware/security');

// Apply rate limiting to M-Pesa routes
router.use(apiLimiter);

// Initiate M-Pesa STK Push
router.post('/stkpush', mpesaController.initiateSTKPush);

// M-Pesa callback URL
router.post('/callback', mpesaController.mpesaCallback);

// Check payment status (cache for 30 seconds)
router.get('/status/:orderId', mpesaController.checkPaymentStatus);

module.exports = router;