const { ZodError } = require('zod');
const AppError = require('../utils/appError');

const validateRequest = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body || {},
      query: req.query || {},
      params: req.params || {},
    });

    req.body = parsed.body;
    req.query = parsed.query;
    req.params = parsed.params;

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((issue) => issue.message).join(', ');
      return next(new AppError(message || 'Validation failed', 400));
    }

    return next(error);
  }
};

module.exports = validateRequest;
