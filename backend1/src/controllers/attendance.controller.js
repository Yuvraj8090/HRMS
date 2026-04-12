// src/controllers/attendance.controller.js
import Attendance from '../models/Attendance.model.js';
import User       from '../models/User.model.js';
import { ExcelParser } from '../utils/excelParser.js';
import { AppError } from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

const todayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

export const clockIn = asyncHandler(async (req, res, next) => {
  if (await Attendance.findOne({ employee: req.user._id, date: { $gte: todayStart() } }))
    return next(new AppError('Already clocked in today.', 409));
  const r = await Attendance.create({
    employee: req.user._id, date: new Date(), clockIn: new Date(),
    workMode: req.body.workMode || 'Office', notes: req.body.notes,
  });
  res.status(201).json({ success: true, message: 'Clocked in successfully.', data: r });
});

export const clockOut = asyncHandler(async (req, res, next) => {
  const r = await Attendance.findOne({ employee: req.user._id, date: { $gte: todayStart() } });
  if (!r)        return next(new AppError('No clock-in found for today.', 404));
  if (r.clockOut) return next(new AppError('Already clocked out today.', 409));
  r.clockOut = new Date();
  await r.save();
  res.json({ success: true, message: 'Clocked out successfully.', data: r });
});

export const getToday = asyncHandler(async (req, res) => {
  const r = await Attendance.findOne({ employee: req.user._id, date: { $gte: todayStart() } });
  res.json({ success: true, data: r || null });
});

export const getMyHistory = asyncHandler(async (req, res) => {
  const filter = { employee: req.user._id };
  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = new Date(req.query.from);
    if (req.query.to)   filter.date.$lte = new Date(req.query.to);
  }
  const data = await Attendance.find(filter).sort({ date: -1 }).limit(100);
  res.json({ success: true, count: data.length, data });
});

export const getUserHistory = asyncHandler(async (req, res, next) => {
  const filter = { employee: req.params.userId };
  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = new Date(req.query.from);
    if (req.query.to)   filter.date.$lte = new Date(req.query.to);
  }
  const data = await Attendance.find(filter).sort({ date: -1 }).limit(200);
  res.json({ success: true, count: data.length, data });
});

export const getDailyOverview = asyncHandler(async (_req, res) => {
  const data = await Attendance.find({ date: { $gte: todayStart() } })
    .populate('employee', 'firstName lastName email payCode');
  res.json({ success: true, count: data.length, data });
});

export const getMonthlyReport = asyncHandler(async (req, res) => {
  const m = +req.query.month || new Date().getMonth() + 1;
  const y = +req.query.year  || new Date().getFullYear();
  const from = new Date(y, m - 1, 1);
  const to   = new Date(y, m, 0, 23, 59, 59);
  const filter = { date: { $gte: from, $lte: to } };
  if (req.query.employeeId) filter.employee = req.query.employeeId;
  const data    = await Attendance.find(filter).populate('employee', 'firstName lastName payCode').sort({ date: 1 });
  const summary = data.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});
  res.json({ success: true, month: m, year: y, summary, count: data.length, data });
});

// ── Excel Import ──────────────────────────────────────────────────────────
export const importExcel = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('Please upload an Excel file.', 400));
  let parsed;
  try { parsed = ExcelParser.parse(req.file.buffer); }
  catch (e) { return next(new AppError(`Failed to parse file: ${e.message}`, 422)); }

  const { meta, rows } = parsed;
  if (!rows.length) return next(new AppError('No data rows found in the file.', 422));

  let imported = 0, skipped = 0, unmatched = 0;
  const results = [];

  for (const row of rows) {
    // Match employee by payCode or cardNo
    let emp = null;
    if (row.payCode) emp = await User.findOne({ $or: [{ payCode: row.payCode }, { cardNo: row.cardNo }], isActive: true }).select('_id firstName lastName');
    if (!emp) { unmatched++; results.push({ ...row, matched: false, reason: 'Employee not found' }); continue; }

    // Create a summary attendance record for the period
    const date = meta.fromDate || new Date();
    try {
      await Attendance.findOneAndUpdate(
        { employee: emp._id, date },
        {
          employee: emp._id, date, clockIn: date, status: row.presentDays > 0 ? 'Present' : 'Absent',
          importedFrom: 'excel', payCode: row.payCode,
          presentDays: row.presentDays, absentDays: row.absentDays,
          weeklyOffDays: row.weeklyOffDays, holidayDays: row.holidayDays, leaveDays: row.leaveDays,
          otHours: row.otHours, otMinutes: row.otMinutes, otAmount: row.otAmount,
          month: meta.month, year: meta.year,
          notes: `Imported from Excel: ${meta.organisationName} ${meta.reportTitle}`,
        },
        { upsert: true, new: true }
      );
      imported++;
      results.push({ ...row, matched: true, employeeName: `${emp.firstName} ${emp.lastName}` });
    } catch (e) { skipped++; results.push({ ...row, matched: false, reason: e.message }); }
  }

  res.status(201).json({
    success: true,
    message: `Import complete. ${imported} imported, ${unmatched} unmatched, ${skipped} errors.`,
    summary: { total: rows.length, imported, unmatched, skipped, month: meta.month, year: meta.year, organisation: meta.organisationName },
    results,
  });
});
