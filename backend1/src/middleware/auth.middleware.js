// src/middleware/auth.middleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { AppError } from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, _res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return next(new AppError('No token provided.', 401));
  const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select('-password');
  if (!user)          return next(new AppError('User not found.', 401));
  if (!user.isActive) return next(new AppError('Account deactivated. Contact Admin.', 403));
  req.user = user;
  next();
});

export const authorize = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role))
    return next(new AppError(`Access denied. Requires role: ${roles.join(' or ')}.`, 403));
  next();
};

export const selfOrAuthorize = (...roles) => (req, _res, next) => {
  const isSelf = req.params.id && req.params.id === req.user._id.toString();
  if (!isSelf && !roles.includes(req.user.role))
    return next(new AppError('Access denied.', 403));
  next();
};
