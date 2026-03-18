/**
 * src/controllers/attendance.controller.js
 *
 * Handles both Daily Portal Attendance (Clock-in/out) 
 * AND Monthly Bulk Excel Imports (Summaries).
 */

import Attendance from '../models/Attendance.model.js';
import AttendanceSummary from '../models/Attendance.model.js'; // MUST CREATE THIS FILE!
import User from '../models/User.model.js';
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

// ══════════════════════════════════════════════════════════════════════════
// 1. DAILY ATTENDANCE LOGIC (Portal Clock-in / Clock-out)
// ══════════════════════════════════════════════════════════════════════════

// ── @desc   Clock In
// ── @route  POST /api/attendance/clock-in
export const clockIn = asyncHandler(async (req, res, next) => {
  const { workMode, notes } = req.body;

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

  res.status(201).json({ success: true, message: 'Clocked in successfully.', data: record });
});

// ── @desc   Clock Out
// ── @route  PUT /api/attendance/clock-out
export const clockOut = asyncHandler(async (req, res, next) => {
  const record = await Attendance.findOne({
    employee: req.user._id,
    date: { $gte: getStartOfDay() },
  });

  if (!record) return next(new AppError('No clock-in record found for today.', 404));
  if (record.clockOut) return next(new AppError('You have already clocked out today.', 409));

  record.clockOut = new Date();
  await record.save();

  res.status(200).json({ success: true, message: 'Clocked out successfully.', data: record });
});

// ── @desc   Get today's status for the current user
// ── @route  GET /api/attendance/today
export const getTodayStatus = asyncHandler(async (req, res) => {
  const record = await Attendance.findOne({
    employee: req.user._id,
    date: { $gte: getStartOfDay() },
  });
  res.status(200).json({ success: true, data: record ?? null });
});

// ── @desc   Get attendance history (own or by ID for HR/Admin)
// ── @route  GET /api/attendance/history/:userId?
export const getAttendanceHistory = asyncHandler(async (req, res, next) => {
  const targetUserId = req.params.userId && req.user.role !== 'Employee' 
    ? req.params.userId 
    : req.user._id;

  if (req.params.userId && req.user.role === 'Employee' && req.params.userId !== req.user._id.toString()) {
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
  const records = await Attendance.find(filter).sort({ date: -1 }).skip(skip).limit(Number(limit));

  res.status(200).json({ success: true, total, data: records });
});

// ── @desc   Admin/HR overview — all employees today
// ── @route  GET /api/attendance/overview
export const getDailyOverview = asyncHandler(async (_req, res) => {
  const records = await Attendance.find({ date: { $gte: getStartOfDay() } })
    .populate('employee', 'firstName lastName email');
  res.status(200).json({ success: true, count: records.length, data: records });
});


// ══════════════════════════════════════════════════════════════════════════
// 2. MONTHLY SUMMARY LOGIC (Excel Uploads & Payroll Views)
// ══════════════════════════════════════════════════════════════════════════

// ── @desc   Import Monthly Attendance Summary from Excel
// ── @route  POST /api/attendance/import
export const importAttendanceExcel = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('Please upload an Excel file.', 400));

  // Note: We provide default dates if the frontend hasn't sent them yet, 
  // but ideally you pass startDate/endDate in the FormData from React.
  const startDate = req.body.startDate ? new Date(req.body.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = req.body.endDate ? new Date(req.body.endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

  const rawData = parseExcelToJSON(req.file.buffer);
  if (!rawData || rawData.length === 0) return next(new AppError('The uploaded Excel file is empty.', 400));

  const bulkOps = [];
  const notFoundUsers = [];

  // Fetch all users once for fast in-memory matching
  const allUsers = await User.find({}).select('_id firstName lastName').lean();

  for (const row of rawData) {
    if (!row.Name) continue; 

    // Normalize name for matching
    const excelName = row.Name.toString().trim().toLowerCase();

    // Match Excel name to DB name
    const matchedUser = allUsers.find(u => {
      const dbName = `${u.firstName || ''} ${u.lastName || ''}`.trim().toLowerCase();
      return dbName === excelName;
    });

    if (!matchedUser) {
      notFoundUsers.push(row.Name);
      continue;
    }

    bulkOps.push({
      updateOne: {
        filter: { employee: matchedUser._id, startDate, endDate },
        update: {
          $set: {
            presentDays: Number(row.Present) || 0,
            absentDays: Number(row.Absent) || 0,
            weeklyOffs: Number(row['Weekly Off']) || 0,
            holidays: Number(row.Holiday) || 0,
            leaveDays: Number(row.Leave) || 0,
            overtimeHours: row.OT?.toString() || '0:00',
            overtimeAmount: Number(row['OT Amount']) || 0,
          }
        },
        upsert: true
      }
    });
  }

  if (bulkOps.length > 0) {
    await AttendanceSummary.bulkWrite(bulkOps);
  }

  res.status(200).json({
    success: true,
    message: `Successfully processed ${bulkOps.length} employee records.`,
    errors: notFoundUsers.length > 0 ? `Could not find system profiles for: ${notFoundUsers.join(', ')}` : null
  });
});

// ── @desc   Get All Monthly Summaries
// ── @route  GET /api/attendance/summaries
// ── @desc   Get All Monthly Summaries with Filtering
// ── @route  GET /api/attendance/summaries
export const getAllSummaries = asyncHandler(async (req, res) => {
  // 1. Extract pagination and filter params from the request
  const { month, year, page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  
  // 2. Build the dynamic filter object
  const filter = {};
  
  if (year) {
    if (month) {
      // Both Month and Year are provided
      // Note: JS Date months are 0-indexed, so we subtract 1 from the incoming month.
      // The "0" in the day parameter of the end date automatically gets the last day of that month.
      const startOfMonth = new Date(year, Number(month) - 1, 1);
      const endOfMonth = new Date(year, Number(month), 0, 23, 59, 59, 999);
      
      filter.startDate = { $gte: startOfMonth, $lte: endOfMonth };
    } else {
      // Only Year is provided (e.g., "All Months" is selected)
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
      
      filter.startDate = { $gte: startOfYear, $lte: endOfYear };
    }
  }

  // 3. Execute queries with the filter applied
  const total = await AttendanceSummary.countDocuments(filter);
  const summaries = await AttendanceSummary.find(filter)
    .populate('employee', 'firstName lastName email')
    .sort({ startDate: -1 }) // Show newest records first
    .skip(skip)
    .limit(Number(limit))
    .lean();

  // 4. Return the paginated & filtered payload
  res.status(200).json({
    success: true, 
    total, 
    page: Number(page), 
    pages: Math.ceil(total / Number(limit)), 
    data: summaries,
  });
});

// ── @desc   Get My Monthly Summaries
// ── @route  GET /api/attendance/my-summaries
export const getMySummaries = asyncHandler(async (req, res) => {
  const summaries = await AttendanceSummary.find({ employee: req.user._id })
    .sort({ startDate: -1 })
    .lean();

  res.status(200).json({ success: true, data: summaries });
});