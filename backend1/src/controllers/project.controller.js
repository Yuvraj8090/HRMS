// src/controllers/project.controller.js
import Project from '../models/Project.model.js';
import { AppError } from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getAll = asyncHandler(async (req, res) => {
  const f = { isActive: true };
  if (req.query.status)   f.status   = req.query.status;
  if (req.query.priority) f.priority = req.query.priority;
  if (req.user.role === 'Employee') f['members.user'] = req.user._id;
  const data = await Project.find(f)
    .populate('projectManager', 'firstName lastName email')
    .populate('department', 'name')
    .populate('members.user', 'firstName lastName email')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: data.length, data });
});

export const getOne = asyncHandler(async (req, res, next) => {
  const p = await Project.findById(req.params.id)
    .populate('projectManager', 'firstName lastName email role')
    .populate('department', 'name code')
    .populate('members.user', 'firstName lastName email');
  if (!p) return next(new AppError('Project not found.', 404));
  if (req.user.role === 'Employee' && !p.members.some(m => m.user?._id?.toString() === req.user._id.toString()))
    return next(new AppError('Access denied.', 403));
  res.json({ success: true, data: p });
});

export const create = asyncHandler(async (req, res) => {
  const p = await Project.create({ ...req.body, projectManager: req.body.projectManager || req.user._id });
  res.status(201).json({ success: true, message: 'Project created.', data: p });
});

export const update = asyncHandler(async (req, res, next) => {
  const p = await Project.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!p) return next(new AppError('Not found.', 404));
  res.json({ success: true, data: p });
});

export const addMembers = asyncHandler(async (req, res, next) => {
  const p = await Project.findById(req.params.id);
  if (!p) return next(new AppError('Not found.', 404));
  for (const m of (req.body.members || []))
    if (!p.members.some(pm => pm.user.toString() === m.user)) p.members.push({ user: m.user, role: m.role || 'Member' });
  await p.save();
  res.json({ success: true, data: p });
});

export const removeMember = asyncHandler(async (req, res, next) => {
  const p = await Project.findById(req.params.id);
  if (!p) return next(new AppError('Not found.', 404));
  p.members = p.members.filter(m => m.user.toString() !== req.params.userId);
  await p.save();
  res.json({ success: true, data: p });
});

export const archive = asyncHandler(async (req, res, next) => {
  const p = await Project.findByIdAndUpdate(req.params.id, { isActive: false, status: 'Cancelled' }, { new: true });
  if (!p) return next(new AppError('Not found.', 404));
  res.json({ success: true, message: 'Project archived.' });
});
