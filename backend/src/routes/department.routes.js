/**
 * src/routes/department.routes.js
 */
import { Router } from 'express';
import Department from '../models/Department.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { authMiddleware, checkRole } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authMiddleware);

// GET all
router.get('/', asyncHandler(async (_req, res) => {
  const departments = await Department.find({ isActive: true })
    .populate('headOf', 'firstName lastName');
  res.status(200).json({ success: true, data: departments });
}));

// GET single
router.get('/:id', asyncHandler(async (req, res, next) => {
  const dept = await Department.findById(req.params.id).populate('headOf', 'firstName lastName');
  if (!dept) return next(new AppError('Department not found.', 404));
  res.status(200).json({ success: true, data: dept });
}));

// CREATE
router.post('/', checkRole(['Admin']), asyncHandler(async (req, res) => {
  const dept = await Department.create(req.body);
  res.status(201).json({ success: true, data: dept });
}));

// UPDATE
router.put('/:id', checkRole(['Admin']), asyncHandler(async (req, res, next) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!dept) return next(new AppError('Department not found.', 404));
  res.status(200).json({ success: true, data: dept });
}));

// DELETE (soft)
router.delete('/:id', checkRole(['Admin']), asyncHandler(async (req, res, next) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!dept) return next(new AppError('Department not found.', 404));
  res.status(200).json({ success: true, message: 'Department archived.' });
}));

export default router;
