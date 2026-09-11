const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');
const asyncHandler = require('../middleware/asyncHandler');

const createAuthToken = (tokenPayload) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new AppError('JWT_SECRET is not configured', 500);
  }

  return jwt.sign(tokenPayload, jwtSecret, { expiresIn: '7d' });
};

const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  const user = await User.create({ name, email: normalizedEmail, password });
  const authToken = createAuthToken({ id: user._id, email: user.email });

  res.status(201).json({
    success: true,
    message: 'User registered',
    data: { user: toPublicUser(user), token: authToken },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid credentials', 401);
  }

  const authToken = createAuthToken({ id: user._id, email: user.email });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: { user: toPublicUser(user), token: authToken },
  });
});

const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful. Remove token from client storage.',
  });
});

module.exports = {
  register,
  login,
  logout,
};
