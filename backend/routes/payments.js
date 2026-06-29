const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authenticate } = require('../middlewares/auth');

let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    console.log('[Payments] Stripe initialized successfully.');
  } else {
    console.log('[Payments] Stripe secret key missing. Sandbox simulation active for Stripe.');
  }
} catch (err) {
  console.warn('[Payments] Stripe library failed to load or key invalid:', err.message);
}

let razorpay = null;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('[Payments] Razorpay initialized successfully.');
  } else {
    console.log('[Payments] Razorpay credentials missing. Sandbox simulation active for Razorpay.');
  }
} catch (err) {
  console.warn('[Payments] Razorpay library failed to load or keys invalid:', err.message);
}

router.post('/stripe/create-intent', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required.' });
    }

    if (stripe) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), 
        currency: 'inr',
        payment_method_types: ['card'],
      });
      return res.json({
        clientSecret: paymentIntent.client_secret,
        isMock: false,
        id: paymentIntent.id
      });
    } else {
      
      const mockSecret = `mock_stripe_secret_${crypto.randomBytes(16).toString('hex')}`;
      const mockId = `mock_pi_${crypto.randomBytes(8).toString('hex')}`;
      return res.json({
        clientSecret: mockSecret,
        isMock: true,
        id: mockId
      });
    }
  } catch (err) {
    console.error('[Stripe Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/razorpay/create-order', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required.' });
    }

    const amountInPaisa = Math.round(amount * 100);

    if (razorpay) {
      const options = {
        amount: amountInPaisa,
        currency: 'INR',
        receipt: `receipt_order_${Date.now()}`,
      };
      const order = await razorpay.orders.create(options);
      return res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        isMock: false
      });
    } else {
      
      const mockOrderId = `mock_rzp_order_${crypto.randomBytes(8).toString('hex')}`;
      return res.json({
        orderId: mockOrderId,
        amount: amountInPaisa,
        currency: 'INR',
        keyId: 'mock_rzp_key_id',
        isMock: true
      });
    }
  } catch (err) {
    console.error('[Razorpay Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/razorpay/verify', authenticate, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ error: 'Missing required validation properties.' });
    }

    if (razorpay_order_id.startsWith('mock_') || !razorpay) {
      console.log(`[Payments] Verifying mock Razorpay transaction: ${razorpay_order_id}`);
      return res.json({ status: 'success', isMock: true });
    }

    if (!razorpay_signature) {
      return res.status(400).json({ error: 'Missing signature.' });
    }

    const text = razorpay_order_id + '|' + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      console.log(`[Payments] Verification successful for live order: ${razorpay_order_id}`);
      return res.json({ status: 'success', isMock: false });
    } else {
      console.warn(`[Payments] Verification failed for live order: ${razorpay_order_id}`);
      return res.status(400).json({ error: 'Invalid transaction signature.' });
    }
  } catch (err) {
    console.error('[Verification Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
