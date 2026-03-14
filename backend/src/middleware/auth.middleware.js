/**
 * src/middleware/auth.middleware.js
 *
 * Two exported middleware functions:
 *
 *  1. authMiddleware  — Verifies the JWT in the Authorization header.
 *                       Attaches the decoded user to req.user.
 *
 *  2. checkRole([…])  — Factory that returns a middleware restricting
 *                       access to users whose role is in the provided list.
 *
 * Usage in routes:
 *   router.get('/admin-only', authMiddleware, checkRole(['Admin']), handler);
 *   router.get('/hr-admin',   authMiddleware, checkRole(['Admin','HR']), handler);
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

// ── 1. JWT Verification ────────────────────────────────────────────────────────

/**
 * authMiddleware
 *
 * Reads the token from:
 *   - Authorization header:  "Bearer <token>"
 *
 * On success  → populates req.user (without password) and calls next().
 * On failure  → forwards a 401 AppError.
 */
export const authMiddleware = asyncHandler(async (req, _res, next) => {
  let token;

  // Extract token from the Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Access denied. No token provided.', 401));
  }

  // Verify the token signature and expiry
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Session expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid token. Authentication failed.', 401));
  }

  // Fetch the user from DB (ensures the account still exists and is active)
  const user = await User.findById(decoded.id).select('-password');

  if (!user) {
    return next(new AppError('The user associated with this token no longer exists.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('This account has been deactivated. Please contact HR.', 403));
  }

  // Attach user payload to the request for downstream handlers
  req.user = user;
  next();
});

// ── 2. Role-Based Access Control ──────────────────────────────────────────────

/**
 * checkRole(roles)
 *
 * @param {string[]} roles  — Array of allowed role strings, e.g. ['Admin', 'HR']
 * @returns {Function}      — Express middleware
 *
 * Must be used AFTER authMiddleware (req.user must exist).
 *
 * Example:
 *   router.delete('/user/:id', authMiddleware, checkRole(['Admin']), deleteUser);
 */
export const checkRole = (roles) =>
  asyncHandler(async (req, _res, next) => {
    if (!req.user) {
      // Defensive: authMiddleware should have caught this first
      return next(new AppError('Authentication required.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`,
          403
        )
      );
    }

    next();
  });

// ── 3. Self-or-Admin Check ─────────────────────────────────────────────────────

/**
 * checkSelfOrRole(roles)
 *
 * Allows access if the request is by the resource owner (req.params.id === req.user.id)
 * OR the user holds one of the specified privileged roles.
 *
 * Useful for profile endpoints where an employee can view/edit their own record,
 * but Admin/HR can view/edit any record.
 *
 * @param {string[]} roles — Privileged roles that can access any record
 */
export const checkSelfOrRole = (roles) =>
  asyncHandler(async (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const isSelf       = req.params.id === req.user._id.toString();
    const hasPrivilege = roles.includes(req.user.role);

    if (!isSelf && !hasPrivilege) {
      return next(
        new AppError('Access denied. You can only access your own resources.', 403)
      );
    }

    next();
  });
