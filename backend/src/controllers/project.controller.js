/**
 * src/controllers/project.controller.js
 *
 * Project management — CRUD + team member assignment/removal.
 */

import Project      from '../models/Project.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError     from '../utils/AppError.js';

// ── @desc   Get all projects
// ── @route  GET /api/projects
// ── @access HR, Admin (all) | Employee (assigned only)
export const getAllProjects = asyncHandler(async (req, res) => {
  const { status, priority, page = 1, limit = 20 } = req.query;

  const filter = { isActive: true };
  if (status)   filter.status   = status;
  if (priority) filter.priority = priority;

  // Employees only see projects they're members of
  if (req.user.role === 'Employee') {
    filter['members.user'] = req.user._id;
  }

  const skip   = (Number(page) - 1) * Number(limit);
  const total  = await Project.countDocuments(filter);

  const projects = await Project.find(filter)
    .populate('projectManager', 'firstName lastName email')
    .populate('department',     'name')
    .populate('members.user',   'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({ success: true, total, data: projects });
});

// ── @desc   Get single project
// ── @route  GET /api/projects/:id
// ── @access Authenticated (members or Admin/HR)
export const getProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate('projectManager', 'firstName lastName email role')
    .populate('department',     'name code')
    .populate('members.user',   'firstName lastName email');

  if (!project) return next(new AppError('Project not found.', 404));

  // Employees can only view projects they're in
  if (req.user.role === 'Employee') {
    const isMember = project.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) return next(new AppError('Access denied.', 403));
  }

  res.status(200).json({ success: true, data: project });
});

// ── @desc   Create project
// ── @route  POST /api/projects
// ── @access Admin, HR
export const createProject = asyncHandler(async (req, res) => {
  const project = await Project.create({ ...req.body });

  res.status(201).json({
    success: true,
    message: 'Project created successfully.',
    data:    project,
  });
});

// ── @desc   Update project
// ── @route  PUT /api/projects/:id
// ── @access Admin, HR
export const updateProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!project) return next(new AppError('Project not found.', 404));

  res.status(200).json({ success: true, data: project });
});

// ── @desc   Assign members to project
// ── @route  POST /api/projects/:id/members
// ── @access Admin, HR
export const assignMembers = asyncHandler(async (req, res, next) => {
  const { members } = req.body; // [{ user: id, role: 'Developer' }, ...]
  if (!members || !Array.isArray(members)) {
    return next(new AppError('Please provide an array of members to assign.', 400));
  }

  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found.', 404));

  // Add members, skip duplicates
  for (const m of members) {
    const alreadyMember = project.members.some(
      (pm) => pm.user.toString() === m.user
    );
    if (!alreadyMember) {
      project.members.push({ user: m.user, role: m.role || 'Developer' });
    }
  }

  await project.save();

  res.status(200).json({
    success: true,
    message: 'Members assigned.',
    data:    project,
  });
});

// ── @desc   Remove member from project
// ── @route  DELETE /api/projects/:id/members/:userId
// ── @access Admin, HR
export const removeMember = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found.', 404));

  project.members = project.members.filter(
    (m) => m.user.toString() !== req.params.userId
  );

  await project.save();

  res.status(200).json({ success: true, message: 'Member removed.', data: project });
});

// ── @desc   Delete (soft) project
// ── @route  DELETE /api/projects/:id
// ── @access Admin
export const deleteProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { isActive: false, status: 'Cancelled' },
    { new: true }
  );

  if (!project) return next(new AppError('Project not found.', 404));

  res.status(200).json({ success: true, message: 'Project archived.' });
});
