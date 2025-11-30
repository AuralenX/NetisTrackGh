const logger = require('./logger');

const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Unhandled error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.uid,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Firebase Auth errors
  if (err.code === 'auth/argument-error' || err.code === 'auth/id-token-expired') {
    return res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTH_ERROR',
      message: 'Invalid or expired token'
    });
  }

  // Firestore errors
  if (err.code === 'permission-denied') {
    return res.status(403).json({
      error: 'Database permission denied',
      code: 'DB_PERMISSION_DENIED',
      message: 'You do not have permission to access this resource'
    });
  }

  // Firestore not found errors
  if (err.code === 'not-found') {
    return res.status(404).json({
      error: 'Resource not found',
      code: 'RESOURCE_NOT_FOUND',
      message: err.message
    });
  }

  // Validation errors (Joi)
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  // MongoDB duplicate key errors (if you add MongoDB later)
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate resource',
      code: 'DUPLICATE_RESOURCE',
      message: 'A resource with this identifier already exists'
    });
  }

  // Rate limit errors
  if (err.statusCode === 429) {
    return res.status(429).json({
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Please slow down your requests'
    });
  }

  // Default to 500 server error
  const statusCode = err.statusCode || err.status || 500;
  
  // Response based on environment
  if (process.env.NODE_ENV === 'production') {
    res.status(statusCode).json({
      error: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong on our end'
    });
  } else {
    // Development - include more details
    res.status(statusCode).json({
      error: err.message,
      code: err.code || 'INTERNAL_SERVER_ERROR',
      stack: err.stack,
      ...(err.details && { details: err.details })
    });
  }
};

// Custom error classes for better error handling
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

module.exports = {
  errorHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError
};