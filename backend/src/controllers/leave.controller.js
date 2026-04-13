import mongoose from 'mongoose';
import LeaveRequest from '../models/LeaveRequest.model.js';
import LeaveBalance from '../models/LeaveBalance.model.js';
import LeaveCategory from '../models/LeaveCategory.model.js';
import EmployeeProfile from '../models/EmployeeProfile.model.js';
import User from '../models/User.model.js'; // <-- NEW: Import User model
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

const getCurrentYear = () => new Date().getFullYear();

// ── 1. Apply for Leave (Employee) ──────────────────────────────────────────
export const applyForLeave = asyncHandler(async (req, res, next) => {
  const { leaveCategoryId, fromDate, toDate, numberOfDays, reason, stationLeavePermission, contactDetailsWhileOnLeave } = req.body;

  // 1. Securely resolve the Employee Profile
  const profile = await EmployeeProfile.findOne({ user: req.user._id });
  if (!profile) return next(new AppError('Employee profile not found.', 404));

  // 2. Prevent applying for past dates (Basic domain validation)
  if (new Date(fromDate) < new Date().setHours(0,0,0,0)) {
    return next(new AppError('Cannot apply for leave in the past.', 400));
  }

  const leaveLetterUrl = req.file ? `uploaded_path/leaves/requests/${req.file.filename}` : null;

  const newRequest = await LeaveRequest.create({
    employee: profile._id,
    leaveCategory: leaveCategoryId,
    fromDate,
    toDate,
    numberOfDays: Number(numberOfDays),
    reason,
    stationLeavePermission: stationLeavePermission === 'true',
    contactDetailsWhileOnLeave,
    leaveLetterUrl,
    status: 'Pending'
  });

  res.status(201).json({ success: true, data: newRequest });
});

export const processLeave = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { decision, remarks } = req.body;

  if (!['Approved', 'Rejected'].includes(decision)) {
    return next(new AppError('Decision must be Approved or Rejected.', 400));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // We must deeply populate user to check the role for Authorization
    const leaveRequest = await LeaveRequest.findById(id)
      .populate('leaveCategory')
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'role' } 
      })
      .session(session);

    if (!leaveRequest) throw new AppError('Leave request not found', 404);
    if (leaveRequest.status !== 'Pending') throw new AppError(`Leave request is already ${leaveRequest.status}`, 400);

    // SECURITY ISOLATION: HR cannot process leaves for other HRs or Admins
    if (req.user.role === 'HR' && leaveRequest.employee.user.role !== 'Employee') {
      throw new AppError('Unauthorized: HR leaves can only be processed by an Admin.', 403);
    }

    // ... (Keep the rest of the deduction and save logic exactly the same) ...
    if (decision === 'Approved' && leaveRequest.leaveCategory.code !== 'LWP') {
      const currentYear = getCurrentYear();
      const leaveBalance = await LeaveBalance.findOne({ 
        employee: leaveRequest.employee._id, 
        leaveCategory: leaveRequest.leaveCategory._id,
        year: currentYear
      }).session(session);

      if (!leaveBalance) throw new AppError('Leave balance record not found for this year.', 404);
      if (leaveBalance.currentBalance < leaveRequest.numberOfDays) {
        throw new AppError(`Insufficient balance. Only ${leaveBalance.currentBalance} days remaining.`, 400);
      }

      leaveBalance.currentBalance -= leaveRequest.numberOfDays;
      leaveBalance.totalApplied += leaveRequest.numberOfDays;
      await leaveBalance.save({ session });
    }

    leaveRequest.status = decision;
    leaveRequest.remarks = remarks;
    leaveRequest.approvedBy = req.user._id;
    
    if (req.file) {
      leaveRequest.approvalDocumentUrl = `uploaded_path/leaves/approvals/${req.file.filename}`;
    }

    await leaveRequest.save({ session });
    await session.commitTransaction();
    
    res.status(200).json({ success: true, message: `Leave ${decision} successfully.` });

  } catch (error) {
    await session.abortTransaction();
    throw error; 
  } finally {
    session.endSession();
  }
});

// ── 3. Read Operations ─────────────────────────────────────────────────────

export const getPendingLeaves = asyncHandler(async (req, res) => {
  let matchStage = { status: 'Pending' };

  // SCALABILITY: Database-level filtering for RBAC instead of array.filter()
  if (req.user.role === 'HR') {
    // 1. Find all users who are strictly 'Employee'
    const employeeUsers = await User.find({ role: 'Employee' }).select('_id');
    // 2. Find their corresponding profiles
    const employeeProfiles = await EmployeeProfile.find({ user: { $in: employeeUsers } }).select('_id');
    
    // 3. Restrict leave requests to only those profiles
    matchStage.employee = { $in: employeeProfiles };
  }

  const pending = await LeaveRequest.find(matchStage)
    .populate({
      path: 'employee',
      select: 'employeeId user',
      populate: { path: 'user', select: 'firstName lastName email role' }
    })
    .populate('leaveCategory', 'name code')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: pending.length, data: pending });
});

export const getMyBalances = asyncHandler(async (req, res, next) => {
  const profile = await EmployeeProfile.findOne({ user: req.user._id });
  if (!profile) return next(new AppError('Profile not found', 404));

  const balances = await LeaveBalance.find({ employee: profile._id, year: getCurrentYear() })
    .populate('leaveCategory', 'name code defaultAnnualCount');

  res.status(200).json({ success: true, data: balances });
});

export const getMyRequests = asyncHandler(async (req, res, next) => {
  const profile = await EmployeeProfile.findOne({ user: req.user._id });
  if (!profile) return next(new AppError('Profile not found', 404));

  const requests = await LeaveRequest.find({ employee: profile._id })
    .populate('leaveCategory', 'name code')
    .populate('approvedBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: requests });
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await LeaveCategory.find({}).sort({ name: 1 });
  res.status(200).json({ success: true, data: categories });
});