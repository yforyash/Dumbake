// middleware/errorHandler.js
// Centralized error handling middleware for Express

const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  // Log the error details
  logger.error('Unhandled error', { message: err.message, stack: err.stack, path: req.path });

  const status = err.status || 500;
  const response = {
    error: err.message || 'Internal Server Error',
  };

  // In production, omit stack traces
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
}

module.exports = errorHandler;
