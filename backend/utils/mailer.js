const nodemailer = require('nodemailer');
require('dotenv').config();

function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('[Mailer Warning] SMTP_USER and SMTP_PASS are not configured in your .env file. Emails will be simulated and logged to the console.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', 
    auth: {
      user: user,
      pass: pass
    }
  });
}

async function sendVerificationEmail(email, code) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || '"Dumbake Support" <support@dumbake.com>';

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`[Email Simulator] Real-time SMTP Credentials Missing!`);
    console.log(`[Email Simulator] Verification OTP for ${email} is: ${code}`);
    console.log(`======================================================\n`);
    return;
  }

  const mailOptions = {
    from: from,
    to: email,
    subject: 'Dumbake - Verify Your Account',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 8px;">
        <h2 style="color: #2e1503; text-align: center; font-family: Georgia, serif;">Dumbake 🍰</h2>
        <p>Hi,</p>
        <p>Thank you for signing up with Dumbake Ranchi! To activate your account, please enter the following 6-digit verification code on the registration page:</p>
        <div style="font-size: 24px; font-weight: bold; text-align: center; color: #d4b1a5; background-color: #2e1503; padding: 15px; border-radius: 6px; letter-spacing: 5px; margin: 20px 0;">
          ${code}
        </div>
        <p>This code is valid for 1 hour. If you didn't request this code, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="font-size: 12px; color: #999; text-align: center;">Dumbake Ranchi | Ranchi Store Support: +91 91514 63571</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Verification OTP sent successfully to ${email}`);
  } catch (err) {
    console.error(`[Email Error] Failed to send verification email to ${email}:`, err.message);
    throw err;
  }
}

async function sendBulkEnquiryEmail(email, name, quantity, eventDate) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || '"Dumbake Support" <support@dumbake.com>';

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`[Email Simulator] Bulk Enquiry Auto-Response to: ${email}`);
    console.log(`[Email Simulator] Name: ${name}, Quantity: ${quantity}, Event Date: ${eventDate}`);
    console.log(`======================================================\n`);
    return;
  }

  const mailOptions = {
    from: from,
    to: email,
    subject: 'Dumbake - Bulk Order Enquiry Received',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 8px;">
        <h2 style="color: #2e1503; text-align: center; font-family: Georgia, serif;">Dumbake 🍰</h2>
        <p>Dear ${name},</p>
        <p>We have successfully received your bulk order enquiry for <strong>${quantity} units</strong> on <strong>${new Date(eventDate).toLocaleDateString()}</strong>.</p>
        <p>Our head chef and events team are reviewing your notes. We will get in touch with you shortly at this email address or your phone number to coordinate the custom decorations, pricing breakdown, and logistics.</p>
        <p>If you have any urgent changes, feel free to reply to this email or contact us via WhatsApp.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="font-size: 12px; color: #999; text-align: center;">Dumbake Ranchi | Ranchi Store Support: +91 91514 63571</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Bulk Enquiry confirmation sent successfully to ${email}`);
  } catch (err) {
    console.error(`[Email Error] Failed to send bulk enquiry confirmation email to ${email}:`, err.message);
  }
}

async function sendNewsletterSubscriptionEmail(email) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || '"Dumbake Support" <support@dumbake.com>';

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`[Email Simulator] Newsletter Subscribed Auto-Response to: ${email}`);
    console.log(`======================================================\n`);
    return;
  }

  const mailOptions = {
    from: from,
    to: email,
    subject: 'Welcome to the Dumbake Flavour Club! 🍰',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 8px;">
        <h2 style="color: #2e1503; text-align: center; font-family: Georgia, serif;">Dumbake 🍰</h2>
        <p>Hello Gourmet Lover!</p>
        <p>Welcome to the <strong>Dumbake Flavour Club</strong>! You have successfully subscribed to our newsletter using: <strong>${email}</strong>.</p>
        <p>From now on, you will be the first to know about:</p>
        <ul>
          <li>Our seasonal specials (like Ishika's Mango Cake!).</li>
          <li>Exclusive club-only discounts and discount codes.</li>
          <li>Behind-the-scenes stories from the bakery.</li>
        </ul>
        <p>Here is flat 10% off coupon code for your next order to celebrate your subscription: <strong>WELCOME10</strong>.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="font-size: 12px; color: #999; text-align: center;">Dumbake Ranchi | Ranchi Store Support: +91 91514 63571</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Newsletter welcome email sent successfully to ${email}`);
  } catch (err) {
    console.error(`[Email Error] Failed to send newsletter welcome email to ${email}:`, err.message);
  }
}

module.exports = {
  sendVerificationEmail,
  sendBulkEnquiryEmail,
  sendNewsletterSubscriptionEmail
};
