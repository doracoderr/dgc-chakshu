const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Mongoose validation errors (missing/invalid required fields)
  // e.g. "code" left blank on Department, Block, Room, etc.
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: details.join('; ') || 'Validation failed',
      error: { code: 'VALIDATION_ERROR', fields: Object.keys(err.errors) }
    });
  }

  // MongoDB duplicate key errors (unique index violation)
  // e.g. two departments/blocks saved with the same "code"
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    const value = err.keyValue ? err.keyValue[field] : '';
    return res.status(400).json({
      success: false,
      message: `${field} "${value}" is already in use`,
      error: { code: 'DUPLICATE_KEY', field }
    });
  }

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    error: {
      code: err.code || 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
};

module.exports = errorHandler;
