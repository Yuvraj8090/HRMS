/**
 * src/utils/asyncHandler.js
 *
 * Wraps an async Express route handler and forwards any rejected
 * promise to the next() error middleware — eliminating repetitive try/catch.
 *
 * Usage:
 *   router.get('/route', asyncHandler(async (req, res) => { ... }));
 */

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
