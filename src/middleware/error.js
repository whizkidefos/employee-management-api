import logger from '../utils/logger.js';

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  logger.error('Error:', err);

  // Handle MongoDB validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message
    }));
    return res.status(400).json({ errors });
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      errors: [{
        field,
        message: `A record with this ${field} already exists`
      }]
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // Handle file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size too large' });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected file upload' });
  }

  // Handle missing required fields
  if (err.name === 'MissingRequiredField') {
    return res.status(400).json({ error: err.message });
  }

  // Handle not found errors
  if (err.name === 'NotFoundError') {
    return res.status(404).json({ error: err.message });
  }

  // Handle unauthorized errors
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: err.message });
  }

  // Handle forbidden errors
  if (err.name === 'ForbiddenError') {
    return res.status(403).json({ error: err.message });
  }

  // Handle service unavailable errors
  if (err.name === 'ServiceUnavailableError') {
    return res.status(503).json({ error: err.message });
  }

  // Log stack trace for unexpected errors in development
  if (process.env.NODE_ENV === 'development') {
    logger.error('Stack:', err.stack);
  }

  // Default error response
  res.status(500).json({
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'An unexpected error occurred'
  });
};

// Custom error classes
export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class ServiceUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}

export class MissingRequiredField extends Error {
  constructor(field) {
    super(`Missing required field: ${field}`);
    this.name = 'MissingRequiredField';
  }
}

// Async error wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
