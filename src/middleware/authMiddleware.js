const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');
const asyncHandler = require('./asyncHandler');

const requireAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication token is required', 401);
  }

  const authToken = authHeader.slice(7).trim();
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new AppError('JWT_SECRET is not configured', 500);
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(authToken, jwtSecret);
  } catch {
    throw new AppError('Invalid or expired authentication token', 401);
  }

  const authenticatedUser = await User.findById(decodedToken.id).select('-password');
  if (!authenticatedUser) {
    throw new AppError('User not found for this token', 401);
  }

  req.user = authenticatedUser;
  next();
});

module.exports = {
  requireAuth,
};
