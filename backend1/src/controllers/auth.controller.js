// src/controllers/auth.controller.js
import User from '../models/User.model.js';
import { AppError } from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

const sendToken = (user, code, res) => res.status(code).json({
  success: true,
  token: user.getJWT(),
  user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, avatar: user.avatar },
});

export const register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, role } = req.body;
  if (await User.findOne({ email })) return next(new AppError('Email already registered.', 409));
  const user = await User.create({ firstName, lastName, email, password, role: role === 'Admin' ? 'Employee' : (role || 'Employee') });
  sendToken(user, 201, res);
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new AppError('Email and password are required.', 400));
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) return next(new AppError('Invalid email or password.', 401));
  if (!user.isActive) return next(new AppError('Your account has been deactivated. Contact Admin.', 403));
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  sendToken(user, 200, res);
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('department', 'name code')
    .populate('designation', 'title level')
    .populate('reportingTo', 'firstName lastName');
  res.json({ success: true, data: user });
});

export const updateMe = asyncHandler(async (req, res) => {
  const allowed = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'address', 'emergencyContact', 'education', 'yearsOfExperience'];
  const update  = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true, runValidators: true });
  res.json({ success: true, data: user });
});

export const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) return next(new AppError('Current password is incorrect.', 400));
  user.password = newPassword;
  await user.save();
  sendToken(user, 200, res);
});
