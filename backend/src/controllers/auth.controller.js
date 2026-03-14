/**
 * src/controllers/auth.controller.js
 *
 * Handles registration, login, logout, and "me" (current user).
 */

import User from '../models/User.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

// ── Helper: send token response ────────────────────────────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJWT();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id:        user._id,
      firstName: user.firstName,
      lastName:  user.lastName,
      email:     user.email,
      role:      user.role,
    },
  });
};

// ── @desc    Register a new user
// ── @route   POST /api/auth/register
// ── @access  Public (or Admin-only in prod — guard at route level)
export const register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, role } = req.body;

  // Prevent self-elevation to Admin via public endpoint
  const safeRole = role && role !== 'Admin' ? role : 'Employee';

  const user = await User.create({ firstName, lastName, email, password, role: safeRole });

  sendTokenResponse(user, 201, res);
});

// ── @desc    Login
// ── @route   POST /api/auth/login
// ── @access  Public
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide an email and password.', 400));
  }

  // Explicitly include password (select: false on schema)
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    return next(new AppError('Invalid email or password.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Contact HR.', 403));
  }

  // Update last login timestamp
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

// ── @desc    Get current logged-in user
// ── @route   GET /api/auth/me
// ── @access  Private
export const getMe = asyncHandler(async (req, res) => {
  // req.user is populated by authMiddleware
  const user = await User.findById(req.user._id).populate('profile');

  res.status(200).json({ success: true, data: user });
});

// ── @desc    Change own password
// ── @route   PUT /api/auth/change-password
// ── @access  Private
export const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    return next(new AppError('Current password is incorrect.', 400));
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});
