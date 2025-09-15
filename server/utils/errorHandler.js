// Standardized error handling utility

class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Predefined error types
const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

// Error factory functions
const createError = {
  validation: (message, details = null) => {
    const error = new AppError(message, 400);
    error.type = ErrorTypes.VALIDATION_ERROR;
    error.details = details;
    return error;
  },
  
  authentication: (message = 'Authentication required') => {
    const error = new AppError(message, 401);
    error.type = ErrorTypes.AUTHENTICATION_ERROR;
    return error;
  },
  
  authorization: (message = 'Insufficient permissions') => {
    const error = new AppError(message, 403);
    error.type = ErrorTypes.AUTHORIZATION_ERROR;
    return error;
  },
  
  notFound: (message = 'Resource not found') => {
    const error = new AppError(message, 404);
    error.type = ErrorTypes.NOT_FOUND_ERROR;
    return error;
  },
  
  conflict: (message = 'Resource conflict') => {
    const error = new AppError(message, 409);
    error.type = ErrorTypes.CONFLICT_ERROR;
    return error;
  },
  
  rateLimit: (message = 'Rate limit exceeded') => {
    const error = new AppError(message, 429);
    error.type = ErrorTypes.RATE_LIMIT_ERROR;
    return error;
  },
  
  externalApi: (message, service = 'External API') => {
    const error = new AppError(`${service}: ${message}`, 502);
    error.type = ErrorTypes.EXTERNAL_API_ERROR;
    error.service = service;
    return error;
  },
  
  database: (message, operation = 'Database operation') => {
    const error = new AppError(`${operation}: ${message}`, 500);
    error.type = ErrorTypes.DATABASE_ERROR;
    error.operation = operation;
    return error;
  },
  
  internal: (message = 'Internal server error') => {
    const error = new AppError(message, 500);
    error.type = ErrorTypes.INTERNAL_ERROR;
    return error;
  }
};

// Error response formatter
const formatErrorResponse = (error, includeStack = false) => {
  const response = {
    error: {
      message: error.message,
      type: error.type || ErrorTypes.INTERNAL_ERROR,
      timestamp: error.timestamp || new Date().toISOString(),
      statusCode: error.statusCode || 500
    }
  };
  
  // Add details if available
  if (error.details) {
    response.error.details = error.details;
  }
  
  // Add service/operation info for external/database errors
  if (error.service) {
    response.error.service = error.service;
  }
  if (error.operation) {
    response.error.operation = error.operation;
  }
  
  // Include stack trace in development
  if (includeStack && process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }
  
  return response;
};

// Async error handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handler middleware
const globalErrorHandler = (error, req, res, next) => {
  // Log error
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // Handle different error types
  if (error instanceof AppError) {
    return res.status(error.statusCode).json(formatErrorResponse(error));
  }
  
  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    const authError = createError.authentication('Invalid token');
    return res.status(401).json(formatErrorResponse(authError));
  }
  
  if (error.name === 'TokenExpiredError') {
    const authError = createError.authentication('Token expired');
    return res.status(401).json(formatErrorResponse(authError));
  }
  
  // Handle validation errors
  if (error.name === 'ValidationError') {
    const validationError = createError.validation('Validation failed', error.details);
    return res.status(400).json(formatErrorResponse(validationError));
  }
  
  // Handle database errors
  if (error.code && error.code.startsWith('23')) { // PostgreSQL constraint errors
    const dbError = createError.conflict('Database constraint violation');
    return res.status(409).json(formatErrorResponse(dbError));
  }
  
  // Handle Axios errors
  if (error.isAxiosError) {
    const apiError = createError.externalApi(
      error.response?.data?.message || error.message,
      error.config?.url || 'External API'
    );
    return res.status(502).json(formatErrorResponse(apiError));
  }
  
  // Default to internal server error
  const internalError = createError.internal('An unexpected error occurred');
  return res.status(500).json(formatErrorResponse(internalError));
};

// Database operation wrapper with error handling
const withDatabaseErrorHandling = async (operation, errorMessage = 'Database operation failed') => {
  try {
    return await operation();
  } catch (error) {
    console.error('Database error:', error);
    throw createError.database(error.message, errorMessage);
  }
};

// External API wrapper with error handling
const withApiErrorHandling = async (operation, serviceName = 'External API') => {
  try {
    return await operation();
  } catch (error) {
    console.error(`${serviceName} error:`, error);
    throw createError.externalApi(error.message, serviceName);
  }
};

module.exports = {
  AppError,
  ErrorTypes,
  createError,
  formatErrorResponse,
  asyncHandler,
  globalErrorHandler,
  withDatabaseErrorHandling,
  withApiErrorHandling
};