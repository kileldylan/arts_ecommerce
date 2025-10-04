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
const { cacheMiddleware } = require('../middleware/cache');

// All routes are protected
router.use(auth);

// Order routes
router.get('/', cacheMiddleware(180), getAllOrders); // Cache for 3 minutes
router.get('/:id', cacheMiddleware(300), getOrder); // Cache for 5 minutes
router.post('/', createOrder); // No cache for creation
router.put('/:id/status', updateOrderStatus); // No cache for updates
router.put('/:id/payment-status', updatePaymentStatus); // No cache for updates
router.get('/:id/history', cacheMiddleware(180), getOrderHistory); // Cache for 3 minutes
router.post('/:id/transactions', addTransaction); // No cache for transactions

module.exports = router;