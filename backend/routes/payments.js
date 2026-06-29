// routes/payments.js
// Payment endpoints: Stripe intent creation, Razorpay order creation and verification

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authGuard');
const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');

/**
 * POST /stripe/create-intent
 * Expected body: { amount }
 */
router.post('/stripe/create-intent', verifyToken, async (req, res, next) => {
  const { amount } = req.body;
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount is required.' });
  }
  try {
    const data = await paymentService.createStripeIntent(amount);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /razorpay/create-order
 * Expected body: { amount }
 */
router.post('/razorpay/create-order', verifyToken, async (req, res, next) => {
  const { amount } = req.body;
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount is required.' });
  }
  try {
    const data = await paymentService.createRazorpayOrder(amount);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /razorpay/verify
 * Expected body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
router.post('/razorpay/verify', verifyToken, async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id) {
    return res.status(400).json({ error: 'Missing required validation properties.' });
  }
  try {
    const result = paymentService.verifyRazorpayPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
