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
  addTransaction,
  getOrderStatus
} = require('../controllers/orderController');
const { auth } = require('../middleware/auth');

// All routes are protected
router.use(auth);

// Order routes - NO CACHE FOR ORDERS (they're real-time)
router.get('/', getAllOrders);
router.get('/:id', getOrder);
router.post('/', createOrder);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/payment-status', updatePaymentStatus);
router.get('/:id/history', getOrderHistory);
router.post('/:id/transactions', addTransaction);
router.get('/:id/status', getOrderStatus);

module.exports = router;