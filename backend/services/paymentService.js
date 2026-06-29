// services/paymentService.js
// Handles payment gateway interactions (Stripe and Razorpay), card validation, and webhooks.

const crypto = require('crypto');
const logger = require('../utils/logger');

// Safe Stripe initialization
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    logger.info('[Payments] Stripe initialized successfully.');
  } catch (err) {
    logger.error('[Payments] Stripe failed to initialize: %s', err.message);
  }
} else {
  logger.warn('[Payments] STRIPE_SECRET_KEY is missing. Sandbox simulation active for Stripe.');
}

// Safe Razorpay initialization
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    logger.info('[Payments] Razorpay initialized successfully.');
  } catch (err) {
    logger.error('[Payments] Razorpay failed to initialize: %s', err.message);
  }
} else {
  logger.warn('[Payments] Razorpay credentials missing. Sandbox simulation active for Razorpay.');
}

/**
 * Luhn algorithm implementation for credit card number validation
 */
function luhnCheck(cardNumber) {
  const digits = String(cardNumber).replace(/\D/g, '');
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

/**
 * Basic card field validation (Luhn, expiry future, CVV numeric length 3-4)
 */
function validateCard({ number, expMonth, expYear, cvv }) {
  if (!luhnCheck(number)) {
    throw new Error('Invalid card number (failed Luhn check)');
  }
  const now = new Date();
  const exp = new Date(expYear, expMonth - 1); // month is 0-indexed
  if (exp <= now) {
    throw new Error('Card expiry date must be in the future');
  }
  if (!/^[0-9]{3,4}$/.test(String(cvv))) {
    throw new Error('CVV must be a 3 or 4 digit number');
  }
  return true;
}

/**
 * Create a Stripe Payment Intent
 */
async function createStripeIntent(amount) {
  const amountInCents = Math.round(amount * 100);
  if (stripe) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'inr',
      payment_method_types: ['card'],
    });
    return {
      clientSecret: paymentIntent.client_secret,
      isMock: false,
      id: paymentIntent.id
    };
  } else {
    const mockSecret = `mock_stripe_secret_${crypto.randomBytes(16).toString('hex')}`;
    const mockId = `mock_pi_${crypto.randomBytes(8).toString('hex')}`;
    return {
      clientSecret: mockSecret,
      isMock: true,
      id: mockId
    };
  }
}

/**
 * Create a Razorpay Order
 */
async function createRazorpayOrder(amount) {
  const amountInPaisa = Math.round(amount * 100);
  if (razorpay) {
    const options = {
      amount: amountInPaisa,
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      isMock: false
    };
  } else {
    const mockOrderId = `mock_rzp_order_${crypto.randomBytes(8).toString('hex')}`;
    return {
      orderId: mockOrderId,
      amount: amountInPaisa,
      currency: 'INR',
      keyId: 'mock_rzp_key_id',
      isMock: true
    };
  }
}

/**
 * Verify a Razorpay Payment signature
 */
function verifyRazorpayPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  if (razorpay_order_id.startsWith('mock_') || !razorpay) {
    logger.info('Verifying mock Razorpay transaction: %s', razorpay_order_id);
    return { status: 'success', isMock: true };
  }

  if (!razorpay_signature) {
    throw new Error('Missing signature.');
  }

  const text = razorpay_order_id + '|' + razorpay_payment_id;
  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(text)
    .digest('hex');

  if (generated_signature === razorpay_signature) {
    logger.info('Verification successful for live order: %s', razorpay_order_id);
    return { status: 'success', isMock: false };
  } else {
    logger.warn('Verification failed for live order: %s', razorpay_order_id);
    throw new Error('Invalid transaction signature.');
  }
}

module.exports = {
  validateCard,
  createStripeIntent,
  createRazorpayOrder,
  verifyRazorpayPaymentSignature,
};
