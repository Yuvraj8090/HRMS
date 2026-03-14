/**
 * src/controllers/attendance.controller.js
 *
 * Clock-in / Clock-out + HR reporting.
 */

import Attendance   from '../models/Attendance.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError     from '../utils/AppError.js';

// ── Helper: midnight of today ──────────────────────────────────────────────────
const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// ── @desc   Clock In
// ── @route  POST /api/attendance/clock-in
// ── @access Employee
export const clockIn = asyncHandler(async (req, res, next) => {
  const { workMode, notes } = req.body;

  // Prevent double clock-in on the same day
  const existing = await Attendance.findOne({
    employee: req.user._id,
    date:     { $gte: todayStart() },
  });

  if (existing) {
    return next(new AppError('You have already clocked in today.', 409));
  }

  const record = await Attendance.create({
    employee: req.user._id,
    date:     new Date(),
    clockIn:  new Date(),
    workMode: workMode ?? 'Office',
    status:   'Present',
    notes,
  });

  res.status(201).json({
    success: true,
    message: 'Clocked in successfully.',
    data:    record,
  });
});

// ── @desc   Clock Out
// ── @route  PUT /api/attendance/clock-out
// ── @access Employee
export const clockOut = asyncHandler(async (req, res, next) => {
  const record = await Attendance.findOne({
    employee: req.user._id,
    date:     { $gte: todayStart() },
  });

  if (!record) {
    return next(new AppError('No clock-in record found for today. Please clock in first.', 404));
  }

  if (record.clockOut) {
    return next(new AppError('You have already clocked out today.', 409));
  }

  record.clockOut = new Date();
  await record.save();

  res.status(200).json({
    success: true,
    message: 'Clocked out successfully.',
    data:    record,
  });
});

// ── @desc   Get today's status for the current user
// ── @route  GET /api/attendance/today
// ── @access Employee
export const getTodayStatus = asyncHandler(async (req, res) => {
  const record = await Attendance.findOne({
    employee: req.user._id,
    date:     { $gte: todayStart() },
  });

  res.status(200).json({ success: true, data: record ?? null });
});

// ── @desc   Get attendance history (own or by ID for HR/Admin)
// ── @route  GET /api/attendance/history/:userId?
// ── @access Employee (own) | HR, Admin (any)
export const getAttendanceHistory = asyncHandler(async (req, res, next) => {
  const targetUserId =
    req.params.userId && req.user.role !== 'Employee'
      ? req.params.userId
      : req.user._id;

  // If an Employee tries to view someone else's data
  if (req.params.userId && req.user.role === 'Employee' &&
      req.params.userId !== req.user._id.toString()) {
    return next(new AppError('Access denied.', 403));
  }

  const { from, to, page = 1, limit = 30 } = req.query;

  const filter = { employee: targetUserId };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to)   filter.date.$lte = new Date(to);
  }

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Attendance.countDocuments(filter);

  const records = await Attendance.find(filter)
    .sort({ date: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    total,
    data: records,
  });
});

// ── @desc   Admin/HR overview — all employees today
// ── @route  GET /api/attendance/overview
// ── @access HR, Admin
export const getDailyOverview = asyncHandler(async (_req, res) => {
  const records = await Attendance.find({ date: { $gte: todayStart() } })
    .populate('employee', 'firstName lastName email');

  res.status(200).json({ success: true, count: records.length, data: records });
});
