// backend/src/middleware/errorHandler.js
const { validationResult } = require('express-validator');

// Express global error handler
const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR: ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // PostgreSQL unique violation
  if (err.code === '23505') {
    return res.status(409).json({ message: 'A record with that value already exists.' });
  }
  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ message: 'Referenced record does not exist.' });
  }
  // PostgreSQL check constraint
  if (err.code === '23514') {
    return res.status(400).json({ message: 'Invalid value for a constrained field.' });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Validate express-validator results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = { errorHandler, validate };
