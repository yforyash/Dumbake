// services/notificationService.js
// Centralized notification helpers for SMS (Twilio) and Email (SendGrid/Nodemailer)

const logger = require('../utils/logger');

// Twilio SMS
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  const twilio = require('twilio');
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// SendGrid Email (fallback to Nodemailer if not configured)
let sendgridMail = null;
if (process.env.SENDGRID_API_KEY) {
  sendgridMail = require('@sendgrid/mail');
  sendgridMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Nodemailer fallback
let nodemailerTransport = null;
if (process.env.SMTP_HOST) {
  const nodemailer = require('nodemailer');
  nodemailerTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Send an SMS via Twilio
 */
async function sendSMS(to, body) {
  if (!twilioClient) {
    logger.warn('Twilio client not configured');
    throw new Error('SMS service unavailable');
  }
  try {
    const message = await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    logger.info('SMS sent to %s, SID %s', to, message.sid);
    return message;
  } catch (err) {
    logger.error('Failed to send SMS', err);
    throw err;
  }
}

/**
 * Send an email (prefer SendGrid, fallback to Nodemailer)
 */
async function sendEmail(to, subject, html) {
  if (sendgridMail) {
    try {
      await sendgridMail.send({
        to,
        from: process.env.SENDGRID_FROM_EMAIL || 'no-reply@dumbake.com',
        subject,
        html,
      });
      logger.info('SendGrid email sent to %s', to);
      return;
    } catch (err) {
      logger.error('SendGrid email error', err);
      throw err;
    }
  }
  if (nodemailerTransport) {
    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || 'no-reply@dumbake.com',
      to,
      subject,
      html,
    };
    try {
      const info = await nodemailerTransport.sendMail(mailOptions);
      logger.info('Nodemailer email sent to %s, %s', to, info.messageId);
    } catch (err) {
      logger.error('Nodemailer email error', err);
      throw err;
    }
  } else {
    logger.warn('No email service configured');
    throw new Error('Email service unavailable');
  }
}

/**
 * Emit a kitchen alarm via Socket.io (server instance injected later)
 */
function emitKitchenAlarm(io, orderId) {
  if (!io) {
    logger.warn('Socket.io instance not provided for kitchen alarm');
    return;
  }
  io.emit('kitchen:alarm', { orderId, timestamp: Date.now() });
  logger.info('Kitchen alarm emitted for order %s', orderId);
}

module.exports = {
  sendSMS,
  sendEmail,
  emitKitchenAlarm,
};
