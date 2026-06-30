const { HTTP_STATUS } = require('../utils/constants');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack || err.message);

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(HTTP_STATUS.UNPROCESSABLE).json({
      success: false,
      message: 'File too large. Maximum size is 5MB.',
    });
  }

  // Multer unexpected file
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(HTTP_STATUS.UNPROCESSABLE).json({
      success: false,
      message: 'Unexpected file field.',
    });
  }

  // Validation errors from express-validator
  if (err.type === 'validation') {
    return res.status(HTTP_STATUS.UNPROCESSABLE).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors || [],
    });
  }

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: 'Duplicate entry. This record already exists.',
    });
  }

  // MySQL foreign key error
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: 'Operation failed due to related records.',
    });
  }

  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER;
  const message = err.message || 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// 404 handler
const notFound = (req, res) => {
  return res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

module.exports = { errorHandler, notFound };