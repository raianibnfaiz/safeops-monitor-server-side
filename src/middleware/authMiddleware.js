const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');
const asyncHandler = require('./asyncHandler');

const requireAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authorization token is required', 401);
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new AppError('JWT_SECRET is not configured', 500);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch (error) {
    throw new AppError('Invalid or expired token', 401);
  }

  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    throw new AppError('User not found for this token', 401);
  }

  req.user = user;
  next();
});

module.exports = {
  requireAuth,
};
