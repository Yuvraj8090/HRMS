// src/controllers/leave.controller.js
import LeaveRequest  from '../models/LeaveRequest.model.js';
import LeaveCategory from '../models/LeaveCategory.model.js';
import LeaveBalance  from '../models/LeaveBalance.model.js';
import User          from '../models/User.model.js';
import { LeaveService } from '../services/leave.service.js';
import { AppError } from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

// ═══════════════════════════════════════════════════════════════
//  LEAVE CATEGORY MANAGEMENT (Admin / HR)
// ═══════════════════════════════════════════════════════════════
export const getCategories = asyncHandler(async (_req, res) => {
  const data = await LeaveCategory.find({ isActive: true }).sort({ sortOrder: 1 });
  res.json({ success: true, data });
});

export const createCategory = asyncHandler(async (req, res, next) => {
  if (await LeaveCategory.findOne({ code: req.body.code?.toUpperCase() }))
    return next(new AppError(`Leave code '${req.body.code}' already exists.`, 409));
  const cat = await LeaveCategory.create(req.body);
  res.status(201).json({ success: true, message: 'Leave category created.', data: cat });
});

export const updateCategory = asyncHandler(async (req, res, next) => {
  const cat = await LeaveCategory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!cat) return next(new AppError('Category not found.', 404));
  res.json({ success: true, data: cat });
});

export const deleteCategory = asyncHandler(async (req, res, next) => {
  const cat = await LeaveCategory.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!cat) return next(new AppError('Category not found.', 404));
  res.json({ success: true, message: 'Category archived.' });
});

// ═══════════════════════════════════════════════════════════════
//  LEAVE BALANCE
// ═══════════════════════════════════════════════════════════════
export const getMyBalance = asyncHandler(async (req, res) => {
  const year = +req.query.year || new Date().getFullYear();
  const data = await LeaveBalance.find({ user: req.user._id, year })
    .populate('leaveCategory', 'code name isPaid isCarryForward');
  res.json({ success: true, data });
});

export const getUserBalance = asyncHandler(async (req, res) => {
  const year = +req.query.year || new Date().getFullYear();
  const data = await LeaveBalance.find({ user: req.params.userId, year })
    .populate('leaveCategory', 'code name isPaid');
  res.json({ success: true, data });
});

export const getAllBalances = asyncHandler(async (req, res) => {
  const year = +req.query.year || new Date().getFullYear();
  const data = await LeaveBalance.find({ year })
    .populate('user', 'firstName lastName employeeNumber payCode')
    .populate('leaveCategory', 'code name');
  res.json({ success: true, count: data.length, data });
});

export const setAllocation = asyncHandler(async (req, res) => {
  const { userId, categoryId, year, allocatedDays, openingBalance = 0 } = req.body;
  const cat = await LeaveCategory.findById(categoryId).select('code');
  const bal = await LeaveBalance.findOneAndUpdate(
    { user: userId, leaveCategory: categoryId, year: +year },
    { categoryCode: cat?.code, openingBalance, allocatedDays },
    { upsert: true, new: true, runValidators: true }
  );
  res.status(201).json({ success: true, message: 'Allocation saved.', data: bal });
});

export const bulkSetAllocation = asyncHandler(async (req, res) => {
  const { categoryId, year, allocatedDays, openingBalance = 0 } = req.body;
  const users = await User.find({ isActive: true }).select('_id');
  const cat   = await LeaveCategory.findById(categoryId).select('code');
  for (const u of users) {
    await LeaveBalance.findOneAndUpdate(
      { user: u._id, leaveCategory: categoryId, year: +year },
      { categoryCode: cat?.code, openingBalance, allocatedDays },
      { upsert: true, new: true }
    );
  }
  res.json({ success: true, message: `Allocation set for ${users.length} users.` });
});

// ═══════════════════════════════════════════════════════════════
//  LEAVE APPLICATION
//
//  Roles & Approval Chain:
//  Employee → Pending → HR recommends → Admin approves/rejects
//  HR       → Pending → Admin approves/rejects  (HR cannot approve own)
//  Admin    → Pending → Admin self-approves  (auto option)
// ═══════════════════════════════════════════════════════════════

export const apply = asyncHandler(async (req, res, next) => {
  const { categoryId, fromDate, toDate, isHalfDay, reason, stationLeavePermission, contactWhileOnLeave } = req.body;
  const from = new Date(fromDate), to = new Date(toDate);
  if (to < from) return next(new AppError('End date must be after start date.', 400));

  const isHalf  = Boolean(isHalfDay);
  const numDays = isHalf ? 0.5 : Math.floor((to - from) / 86400000) + 1;
  const year    = from.getFullYear();

  // Category check
  const cat = await LeaveCategory.findById(categoryId);
  if (!cat || !cat.isActive) return next(new AppError('Invalid leave category.', 404));

  // Gender check
  if (cat.gender !== 'All' && req.user.gender && cat.gender !== req.user.gender)
    return next(new AppError(`${cat.name} is only available for ${cat.gender} employees.`, 400));

  // Overlap check
  const overlap = await LeaveService.checkOverlap(req.user._id, from, to);
  if (overlap) return next(new AppError('You already have a leave request overlapping these dates.', 409));

  // Balance check (for paid leaves)
  await LeaveService.checkBalance(req.user._id, categoryId, numDays, year);

  const leave = await LeaveRequest.create({
    applicant: req.user._id,
    applicantRole: req.user.role,
    leaveCategory: categoryId,
    categoryCode: cat.code,
    fromDate: from, toDate: to,
    numberOfDays: numDays, isHalfDay: isHalf,
    reason,
    stationLeavePermission: Boolean(stationLeavePermission),
    contactWhileOnLeave: contactWhileOnLeave || {},
    leaveLetterUrl: req.file ? `/uploads/leave-letters/${req.file.filename}` : null,
    year,
  });

  // Reserve pending days in balance
  if (cat.isPaid) await LeaveService.reservePending(req.user._id, categoryId, numDays, year);

  res.status(201).json({ success: true, message: 'Leave application submitted successfully.', data: leave });
});

export const uploadLeaveLetter = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file uploaded.', 400));
  const leave = await LeaveRequest.findOneAndUpdate(
    { _id: req.params.id, applicant: req.user._id, status: { $in: ['Pending', 'Recommended'] } },
    { leaveLetterUrl: `/uploads/leave-letters/${req.file.filename}` },
    { new: true }
  );
  if (!leave) return next(new AppError('Leave request not found or cannot be updated.', 404));
  res.json({ success: true, message: 'Leave letter uploaded.', data: leave });
});

export const getMyLeaves = asyncHandler(async (req, res) => {
  const filter = { applicant: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.year)   filter.year   = +req.query.year;
  const data = await LeaveRequest.find(filter)
    .populate('leaveCategory', 'code name isPaid')
    .populate('recommendedBy', 'firstName lastName')
    .populate('actionedBy', 'firstName lastName')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: data.length, data });
});

export const cancel = asyncHandler(async (req, res, next) => {
  const leave = await LeaveRequest.findOne({ _id: req.params.id, applicant: req.user._id });
  if (!leave) return next(new AppError('Leave request not found.', 404));
  if (!['Pending', 'Recommended'].includes(leave.status))
    return next(new AppError(`Cannot cancel a leave that is ${leave.status}.`, 400));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (leave.fromDate < today) return next(new AppError('Cannot cancel a leave that has already started.', 400));

  leave.status = 'Cancelled';
  await leave.save();
  // Restore pending days
  const cat = await LeaveCategory.findById(leave.leaveCategory);
  if (cat?.isPaid) await LeaveService.restorePending(leave.applicant, leave.leaveCategory, leave.numberOfDays, leave.year);
  res.json({ success: true, message: 'Leave cancelled.' });
});

// ── HR: Get all + Recommend ─────────────────────────────────────────────
export const getAllLeaves = asyncHandler(async (req, res) => {
  const { status, categoryCode, applicantRole, page = 1, limit = 20, search } = req.query;
  const filter = {};
  if (status)        filter.status       = status;
  if (categoryCode)  filter.categoryCode = categoryCode.toUpperCase();
  if (applicantRole) filter.applicantRole= applicantRole;
  if (search) {
    const users = await User.find({ $or: [{ firstName: new RegExp(search,'i') }, { lastName: new RegExp(search,'i') }, { employeeNumber: new RegExp(search,'i') }] }).select('_id');
    filter.applicant = { $in: users.map(u => u._id) };
  }
  const skip  = (+page - 1) * +limit;
  const total = await LeaveRequest.countDocuments(filter);
  const data  = await LeaveRequest.find(filter)
    .populate('applicant', 'firstName lastName employeeNumber payCode office unit role')
    .populate('leaveCategory', 'code name isPaid')
    .populate('recommendedBy', 'firstName lastName')
    .populate('actionedBy', 'firstName lastName')
    .sort({ createdAt: -1 }).skip(skip).limit(+limit);
  res.json({ success: true, total, page: +page, pages: Math.ceil(total / +limit), data });
});

export const getLeaveById = asyncHandler(async (req, res, next) => {
  const leave = await LeaveRequest.findById(req.params.id)
    .populate('applicant', 'firstName lastName employeeNumber phone office unit gender')
    .populate('leaveCategory', 'code name isPaid requiresMedical requiresDocument')
    .populate('recommendedBy', 'firstName lastName role')
    .populate('actionedBy', 'firstName lastName role');
  if (!leave) return next(new AppError('Leave request not found.', 404));
  // Employees can only view own leaves
  if (req.user.role === 'Employee' && leave.applicant._id.toString() !== req.user._id.toString())
    return next(new AppError('Access denied.', 403));
  res.json({ success: true, data: leave });
});

// HR recommends an Employee's leave (cannot recommend own or HR's leave)
export const recommend = asyncHandler(async (req, res, next) => {
  const { note } = req.body;
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) return next(new AppError('Leave request not found.', 404));
  if (leave.applicantRole !== 'Employee')
    return next(new AppError('Only Employee leave requests can be recommended. HR/Admin leaves go directly to Admin for approval.', 400));
  if (leave.status !== 'Pending')
    return next(new AppError(`Leave is already ${leave.status}.`, 409));
  leave.status        = 'Recommended';
  leave.recommendedBy = req.user._id;
  leave.recommendedAt = new Date();
  leave.recommendNote = note;
  await leave.save();
  res.json({ success: true, message: 'Leave recommended to Admin.', data: leave });
});

// Admin final action: Approve / Reject
export const action = asyncHandler(async (req, res, next) => {
  const { decision, note } = req.body;   // decision = 'Approved' | 'Rejected'
  if (!['Approved', 'Rejected'].includes(decision))
    return next(new AppError("Decision must be 'Approved' or 'Rejected'.", 400));

  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) return next(new AppError('Leave request not found.', 404));
  if (['Approved', 'Rejected', 'Cancelled'].includes(leave.status))
    return next(new AppError(`Leave is already ${leave.status}.`, 409));

  // Validation: Employee leave must be Recommended before Admin approves (unless Admin bypasses)
  // HR / Admin leaves can be actioned directly
  if (leave.applicantRole === 'Employee' && leave.status === 'Pending' && decision === 'Approved')
    return next(new AppError('Employee leave must be recommended by HR before Admin approval.', 400));

  const prevStatus = leave.status;
  leave.status     = decision;
  leave.actionedBy = req.user._id;
  leave.actionedAt = new Date();
  leave.actionNote = note;
  if (req.file) leave.approvedDocumentUrl = `/uploads/leave-approvals/${req.file.filename}`;
  await leave.save();

  // Update leave balance
  const cat = await LeaveCategory.findById(leave.leaveCategory);
  if (cat?.isPaid) {
    if (decision === 'Approved') {
      // move pending → used
      await LeaveService.consumeLeave(leave.applicant, leave.leaveCategory, leave.numberOfDays, leave.year);
    } else if (decision === 'Rejected') {
      // restore pending
      await LeaveService.restorePending(leave.applicant, leave.leaveCategory, leave.numberOfDays, leave.year);
    }
  }

  res.json({ success: true, message: `Leave ${decision.toLowerCase()} successfully.`, data: leave });
});

export const uploadApprovedDoc = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file uploaded.', 400));
  const leave = await LeaveRequest.findByIdAndUpdate(
    req.params.id,
    { approvedDocumentUrl: `/uploads/leave-approvals/${req.file.filename}` },
    { new: true }
  );
  if (!leave) return next(new AppError('Leave request not found.', 404));
  res.json({ success: true, message: 'Approved document uploaded.', data: leave });
});

// ── Leave Statistics (dashboard) ────────────────────────────────────────
export const getStats = asyncHandler(async (_req, res) => {
  const year = new Date().getFullYear();
  const [pending, approved, byCategory] = await Promise.all([
    LeaveRequest.countDocuments({ status: { $in: ['Pending', 'Recommended'] } }),
    LeaveRequest.countDocuments({ status: 'Approved', year }),
    LeaveRequest.aggregate([
      { $match: { status: 'Approved', year } },
      { $group: { _id: '$categoryCode', count: { $sum: 1 }, totalDays: { $sum: '$numberOfDays' } } },
    ]),
  ]);
  res.json({ success: true, data: { pending, approved, byCategory } });
});
