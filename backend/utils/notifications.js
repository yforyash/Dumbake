const https = require('https');
const nodemailer = require('nodemailer');
require('dotenv').config();

// 1. Initialize Twilio SDK client
let twilio = null;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('[Notifications] Twilio SMS client initialized.');
  } else {
    console.log('[Notifications] Twilio credentials missing. Sandbox SMS simulator active.');
  }
} catch (err) {
  console.warn('[Notifications] Twilio library failed to load:', err.message);
}

// 2. Initialize Nodemailer fallback transporter
function getFallbackTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: { user, pass }
  });
}

// 3. Centralized SMS sender
async function sendSms(to, message) {
  if (!to) return;
  if (twilio) {
    try {
      const formattedTo = to.startsWith('+') ? to : `+91${to}`;
      await twilio.messages.create({
        body: message,
        from: process.env.TWILIO_FROM_NUMBER,
        to: formattedTo
      });
      console.log(`[SMS Broadcast] Sent to ${formattedTo}: "${message}"`);
    } catch (err) {
      console.error('[SMS Broadcast Error] Twilio delivery failed:', err.message);
    }
  } else {
    console.log(`\n======================================================`);
    console.log(`[SMS SIMULATOR] TWILIO NOT CONFIGURED`);
    console.log(`[SMS SIMULATOR] To: ${to}`);
    console.log(`[SMS SIMULATOR] Message: "${message}"`);
    console.log(`======================================================\n`);
  }
}

// 4. Centralized Email sender via Resend API (falling back to SMTP or logs)
async function sendEmail({ to, subject, html }) {
  const resendKey = process.env.RESEND_API_KEY;
  
  if (resendKey) {
    const postData = JSON.stringify({
      from: process.env.SMTP_FROM || 'Dumbake Bakery <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: html
    });

    return new Promise((resolve) => {
      const req = https.request('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        }
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[Email Broadcast] Sent successfully via Resend to ${to}`);
            resolve(true);
          } else {
            console.error(`[Email Broadcast Error] Resend API returned status ${res.statusCode}: ${body}`);
            resolve(false);
          }
        });
      });
      
      req.on('error', (err) => {
        console.error('[Email Broadcast Error] Resend network error:', err.message);
        resolve(false);
      });
      req.write(postData);
      req.end();
    });
  }

  // Fallback to Nodemailer SMTP
  const transporter = getFallbackTransporter();
  if (transporter) {
    const from = process.env.SMTP_FROM || '"Dumbake Support" <support@dumbake.com>';
    try {
      await transporter.sendMail({ from, to, subject, html });
      console.log(`[Email Broadcast] Sent successfully via SMTP to ${to}`);
      return true;
    } catch (err) {
      console.error(`[Email Broadcast Error] SMTP failed to send to ${to}:`, err.message);
      return false;
    }
  }

  // Final fallback to terminal logs
  console.log(`\n======================================================`);
  console.log(`[EMAIL SIMULATOR] RESEND & SMTP NOT CONFIGURED`);
  console.log(`[EMAIL SIMULATOR] To: ${to}`);
  console.log(`[EMAIL SIMULATOR] Subject: ${subject}`);
  console.log(`[EMAIL SIMULATOR] Body: ${html.substring(0, 300)}...`);
  console.log(`======================================================\n`);
  return true;
}

// 5. Verification OTPs (Send both Email & SMS)
async function sendVerificationCode(email, phone, code) {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 8px;">
      <h2 style="color: #9A0F29; text-align: center; font-family: Georgia, serif;">Dumbake Ranchi 🍰</h2>
      <p>Hi,</p>
      <p>Thank you for signing up with Dumbake Ranchi! To activate your account, please enter the following 6-digit verification code on the registration page:</p>
      <div style="font-size: 24px; font-weight: bold; text-align: center; color: #FAF6EE; background-color: #9A0F29; padding: 15px; border-radius: 6px; letter-spacing: 5px; margin: 20px 0;">
        ${code}
      </div>
      <p>This code is valid for 1 hour. If you didn't request this code, please ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
      <p style="font-size: 12px; color: #999; text-align: center;">Dumbake Ranchi | Ranchi Store Support: +91 91514 63571</p>
    </div>
  `;

  // Send Email code
  await sendEmail({ to: email, subject: 'Dumbake - Verify Your Account', html: emailHtml });

  // Send SMS code (if phone provided)
  if (phone) {
    await sendSms(phone, `Your Dumbake verification code is ${code}. Valid for 1 hour. Chef Ishika is ready to bake your custom orders!`);
  }
}

// 6. Send Checkout Receipt HTML Invoice
async function sendCheckoutReceipt(order) {
  const itemsList = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
  
  let itemsTableRows = '';
  itemsList.forEach(item => {
    itemsTableRows += `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">x${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `;
  });

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #EEDAC5; border-radius: 16px; background-color: #FAF6EE;">
      <h2 style="color: #9A0F29; text-align: center; font-family: Georgia, serif; margin-bottom: 5px;">Dumbake Bakery 🍰</h2>
      <p style="text-align: center; color: #6E5B5D; font-size: 0.85rem; margin-top: 0;">Ranchi, Jharkhand, India</p>
      
      <div style="background: #ffffff; padding: 20px; border-radius: 12px; margin-top: 20px; border: 1px solid #EEDAC5;">
        <h3 style="color: #9A0F29; font-size: 1.1rem; margin-top: 0; border-bottom: 2px solid #9A0F29; padding-bottom: 8px;">Invoice Summary</h3>
        <p style="font-size: 0.9rem; margin: 5px 0;"><strong>Order ID:</strong> #${order.id}</p>
        <p style="font-size: 0.9rem; margin: 5px 0;"><strong>Customer Name:</strong> ${order.customer_name}</p>
        <p style="font-size: 0.9rem; margin: 5px 0;"><strong>Fulfillment:</strong> ${order.delivery_type}</p>
        <p style="font-size: 0.9rem; margin: 5px 0;"><strong>Payment Method:</strong> ${order.payment_method} (${order.payment_status})</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 0.9rem;">
          <thead>
            <tr style="background-color: #FBEBEF; color: #9A0F29;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsTableRows}
          </tbody>
        </table>
        
        <div style="margin-top: 15px; text-align: right; font-size: 1rem; font-weight: bold; color: #9A0F29;">
          Grand Total: ₹${parseFloat(order.total_price).toFixed(2)}
        </div>
      </div>
      
      <p style="margin-top: 20px; font-size: 0.9rem; text-align: center; color: #6E5B5D;">
        Thank you for ordering with Ranchi's premium artisanal bakery!
      </p>
      <hr style="border: 0; border-top: 1px solid #EEDAC5; margin-top: 30px;" />
      <p style="font-size: 12px; color: #999; text-align: center;">Dumbake Ranchi | Ranchi Store Support: +91 91514 63571</p>
    </div>
  `;

  // Send Email invoice
  if (order.customer_email) {
    await sendEmail({ to: order.customer_email, subject: `Dumbake - Order Invoice #${order.id}`, html: emailHtml });
  }

  // Send SMS confirmation
  if (order.customer_phone) {
    await sendSms(
      order.customer_phone,
      `Thank you! Your Dumbake order #${order.id} of ₹${parseFloat(order.total_price).toFixed(2)} has been placed successfully. Track your bakes live on the app.`
    );
  }
}

// 7. Send Order Status updates via SMS
async function sendOrderStatusAlert(order, status, riderName = 'Amit Kumar') {
  if (!order.customer_phone) return;
  
  const customerName = order.customer_name || 'Valued Customer';
  let message = '';

  switch (status) {
    case 'Preparing':
      message = `Hi ${customerName}, your Dumbake order #${order.id} is now in the oven! Chef Ishika is preparing your bakes fresh.`;
      break;
    case 'Ready':
      message = `Delicious news, ${customerName}! Your Dumbake order #${order.id} is boxed and ready. Awaiting delivery pickup.`;
      break;
    case 'Dispatched':
      message = `Out for delivery! Rider ${riderName} has loaded your Dumbake order #${order.id} and is en route. Watch live tracking on your dashboard!`;
      break;
    case 'Delivered':
      message = `Order Delivered! Enjoy your delicious bakes. Thank you for ordering from Dumbake Ranchi!`;
      break;
    default:
      return; // Skip other statuses
  }

  await sendSms(order.customer_phone, message);
}

// 8. Newsletter subscription welcome
async function sendNewsletterWelcome(email) {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 8px;">
      <h2 style="color: #9A0F29; text-align: center; font-family: Georgia, serif;">Dumbake 🍰</h2>
      <p>Hello Gourmet Lover!</p>
      <p>Welcome to the <strong>Dumbake Flavour Club</strong>! You have successfully subscribed using: <strong>${email}</strong>.</p>
      <p>Get flat 10% off coupon code for your next order to celebrate your subscription: <strong>WELCOME10</strong>.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
      <p style="font-size: 12px; color: #999; text-align: center;">Dumbake Ranchi | Ranchi Store Support: +91 91514 63571</p>
    </div>
  `;
  await sendEmail({ to: email, subject: 'Welcome to the Dumbake Flavour Club! 🍰', html: emailHtml });
}

// 9. Bulk order enquiry alert
async function sendBulkEnquiryAlert(email, name, quantity, eventDate) {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 8px;">
      <h2 style="color: #9A0F29; text-align: center; font-family: Georgia, serif;">Dumbake 🍰</h2>
      <p>Dear ${name},</p>
      <p>We have successfully received your bulk order enquiry for <strong>${quantity} units</strong> on <strong>${new Date(eventDate).toLocaleDateString()}</strong>.</p>
      <p>Our head chef and events team are reviewing your notes. We will get in touch with you shortly at this email address or your phone number to coordinate the custom decorations, pricing breakdown, and logistics.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
      <p style="font-size: 12px; color: #999; text-align: center;">Dumbake Ranchi | Ranchi Store Support: +91 91514 63571</p>
    </div>
  `;
  await sendEmail({ to: email, subject: 'Dumbake - Bulk Order Enquiry Received', html: emailHtml });
}

module.exports = {
  sendVerificationCode,
  sendCheckoutReceipt,
  sendOrderStatusAlert,
  sendNewsletterWelcome,
  sendBulkEnquiryAlert
};
