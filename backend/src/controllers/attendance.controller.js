/**
 * src/controllers/attendance.controller.js
 *
 * Clock-in / Clock-out, HR reporting, and Bulk Excel Import.
 */

import Attendance from '../models/Attendance.model.js';
import EmployeeProfile from '../models/EmployeeProfile.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { parseExcelToJSON } from '../utils/excelParser.js';

// ── Helper: midnight of today ──────────────────────────────────────────────────
const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
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
    date: { $gte: getStartOfDay() },
  });

  if (existing) {
    return next(new AppError('You have already clocked in today.', 409));
  }

  const record = await Attendance.create({
    employee: req.user._id,
    date: new Date(),
    clockIn: new Date(),
    workMode: workMode ?? 'Office',
    status: 'Present',
    notes,
  });

  res.status(201).json({
    success: true,
    message: 'Clocked in successfully.',
    data: record,
  });
});

// ── @desc   Clock Out
// ── @route  PUT /api/attendance/clock-out
// ── @access Employee
export const clockOut = asyncHandler(async (req, res, next) => {
  const record = await Attendance.findOne({
    employee: req.user._id,
    date: { $gte: getStartOfDay() },
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
    data: record,
  });
});

// ── @desc   Get today's status for the current user
// ── @route  GET /api/attendance/today
// ── @access Employee
export const getTodayStatus = asyncHandler(async (req, res) => {
  const record = await Attendance.findOne({
    employee: req.user._id,
    date: { $gte: getStartOfDay() },
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
    if (to) filter.date.$lte = new Date(to);
  }

  const skip = (Number(page) - 1) * Number(limit);
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
  const records = await Attendance.find({ date: { $gte: getStartOfDay() } })
    .populate('employee', 'firstName lastName email');

  res.status(200).json({ success: true, count: records.length, data: records });
});

// ── @desc   Import Attendance from Excel
// ── @route  POST /api/attendance/import
// ── @access HR, Admin
export const importAttendanceExcel = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload an Excel file', 400));
  }

  // Parse Excel to JSON array using utility
  const attendanceData = parseExcelToJSON(req.file.buffer);

  if (!attendanceData || attendanceData.length === 0) {
    return next(new AppError('Excel file is empty or invalid format', 400));
  }

  const bulkOps = [];

  for (const row of attendanceData) {
    // Expected Headers: EmpNo, Date, Status, CheckIn, CheckOut
    if (!row.EmpNo || !row.Date) continue;

    const profile = await EmployeeProfile.findOne({ employeeId: row.EmpNo });

    if (profile && profile.user) {
      const recordDate = getStartOfDay(row.Date);
      
      // Parse CheckIn / CheckOut safely if they exist in the Excel sheet
      const clockInTime = row.CheckIn ? new Date(row.CheckIn) : null;
      const clockOutTime = row.CheckOut ? new Date(row.CheckOut) : null;

      // Use upsert to prevent duplicate records if imported multiple times
      bulkOps.push({
        updateOne: {
          filter: { employee: profile.user, date: recordDate },
          update: {
            $set: {
              clockIn: clockInTime,
              clockOut: clockOutTime,
              status: row.Status || 'Present',
              workMode: 'Office', // Assuming default for physical imports
            }
          },
          upsert: true
        }
      });
    }
  }

  if (bulkOps.length > 0) {
    await Attendance.bulkWrite(bulkOps);
  }

  res.status(200).json({
    success: true,
    message: `Successfully processed ${bulkOps.length} attendance records.`
  });
});