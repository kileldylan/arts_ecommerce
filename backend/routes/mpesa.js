const express = require('express');
const router = express.Router();
const mpesaController = require('../controllers/mpesaController');

// Initiate M-Pesa STK Push
router.post('/stkpush', mpesaController.initiateSTKPush);

// M-Pesa callback URL
router.post('/callback', mpesaController.mpesaCallback);

// Check payment status
router.get('/status/:orderId', mpesaController.checkPaymentStatus);

module.exports = router;