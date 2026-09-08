const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');
const asyncHandler = require('../middleware/asyncHandler');

const signToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'safeops-dev-secret';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new AppError('name, email and password are required', 400);
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    throw new AppError('Email already registered', 409);
  }

  const user = await User.create({ name, email, password });
  const token = signToken({ id: user._id, email: user.email });

  res.status(201).json({
    success: true,
    message: 'User registered',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('email and password are required', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = signToken({ id: user._id, email: user.email });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    },
  });
});

module.exports = {
  register,
  login,
};
