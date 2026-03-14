/**
 * src/routes/designation.routes.js
 */
import { Router } from 'express';
import Designation from '../models/Designation.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { authMiddleware, checkRole } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authMiddleware);

router.get('/', asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.department) filter.department = req.query.department;
  const designations = await Designation.find(filter).populate('department', 'name');
  res.status(200).json({ success: true, data: designations });
}));

router.get('/:id', asyncHandler(async (req, res, next) => {
  const desig = await Designation.findById(req.params.id).populate('department', 'name');
  if (!desig) return next(new AppError('Designation not found.', 404));
  res.status(200).json({ success: true, data: desig });
}));

router.post('/', checkRole(['Admin']), asyncHandler(async (req, res) => {
  const desig = await Designation.create(req.body);
  res.status(201).json({ success: true, data: desig });
}));

router.put('/:id', checkRole(['Admin']), asyncHandler(async (req, res, next) => {
  const desig = await Designation.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!desig) return next(new AppError('Designation not found.', 404));
  res.status(200).json({ success: true, data: desig });
}));

router.delete('/:id', checkRole(['Admin']), asyncHandler(async (req, res, next) => {
  const desig = await Designation.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!desig) return next(new AppError('Designation not found.', 404));
  res.status(200).json({ success: true, message: 'Designation archived.' });
}));

export default router;
