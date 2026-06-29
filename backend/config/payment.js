// config/payment.js
// Payment gateway configuration for DumBake backend
// Supports Stripe, Razorpay, and PhonePe (optional) via environment variables

module.exports = {
  // Choose primary gateway: 'stripe', 'razorpay', or 'phonepe'
  primaryGateway: process.env.PAYMENT_GATEWAY || 'stripe',

  // Stripe configuration (use test keys by default)
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  // Razorpay configuration
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },

  // PhonePe configuration (placeholder – requires additional SDK)
  phonepe: {
    merchantId: process.env.PHONEPE_MERCHANT_ID,
    merchantKey: process.env.PHONEPE_MERCHANT_KEY,
    // Additional config as needed
  },
};
