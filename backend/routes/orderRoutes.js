// backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderHistory,
  addTransaction
} = require('../controllers/orderController');
const { auth } = require('../middleware/auth');

// All routes are protected
router.use(auth);

// Order routes
router.get('/', getAllOrders);
router.get('/:id', getOrder);
router.post('/', createOrder);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/payment-status', updatePaymentStatus);
router.get('/:id/history', getOrderHistory);
router.post('/:id/transactions', addTransaction);

module.exports = router;