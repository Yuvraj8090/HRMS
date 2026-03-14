/**
 * src/utils/AppError.js
 *
 * A structured, operational error class that extends the native Error.
 * Allows controllers to throw typed errors that the global error handler
 * can distinguish from unexpected (programmer) errors.
 *
 * Usage:
 *   throw new AppError('User not found', 404);
 */

class AppError extends Error {
  /**
   * @param {string} message  - Human-readable error message
   * @param {number} statusCode - HTTP status code (4xx / 5xx)
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode  = statusCode;
    this.isOperational = true; // Mark as a known, handled error

    // Maintain proper stack trace (V8 only)
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
