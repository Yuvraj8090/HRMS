// src/routes/department.routes.js
import { Router } from 'express';
import Department from '../models/Department.model.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
const r = Router(); r.use(protect);
r.get('/', asyncHandler(async (_,res) => { const d = await Department.find({ isActive: true }).populate('headOf','firstName lastName'); res.json({ success: true, data: d }); }));
r.post('/', authorize('Admin'), asyncHandler(async (req,res) => { const d = await Department.create(req.body); res.status(201).json({ success:true, data:d }); }));
r.put('/:id', authorize('Admin'), asyncHandler(async (req,res,next) => { const d = await Department.findByIdAndUpdate(req.params.id, req.body, {new:true}); if (!d) return next(new AppError('Not found.',404)); res.json({ success:true, data:d }); }));
r.delete('/:id', authorize('Admin'), asyncHandler(async (req,res,next) => { const d = await Department.findByIdAndUpdate(req.params.id, {isActive:false}, {new:true}); if (!d) return next(new AppError('Not found.',404)); res.json({ success:true, message:'Archived.' }); }));
export default r;
