import asyncHandler from '../utils/asyncHandler.js';
import LeaveRequest from '../models/LeaveRequest.model.js';
import LeaveBalance from '../models/LeaveBalance.model.js';
import { processLeaveApproval } from '../services/leave.service.js';
import AppError from '../utils/AppError.js';

// 1. Employee applies for leave
export const applyForLeave = asyncHandler(async (req, res, next) => {
  const { leaveCategoryId, fromDate, toDate, numberOfDays, reason, stationLeavePermission, contactDetailsWhileOnLeave } = req.body;
  const employeeId = req.user.employeeProfileId; // Assuming auth middleware sets this

  // In a real app, you'd upload req.file.buffer to S3 and get the URL
  const leaveLetterUrl = req.file ? `uploaded_path/${req.file.originalname}` : null;

  const newRequest = await LeaveRequest.create({
    employee: employeeId,
    leaveCategory: leaveCategoryId,
    fromDate,
    toDate,
    numberOfDays,
    reason,
    stationLeavePermission: stationLeavePermission === 'true',
    contactDetailsWhileOnLeave,
    leaveLetterUrl
  });

  res.status(201).json({ success: true, data: newRequest });
});

// 2. HR Processes Leave (Approve/Reject)
export const processLeave = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { decision, remarks } = req.body; // 'Approved' or 'Rejected'
  
  const leaveRequest = await LeaveRequest.findById(id);
  if (!leaveRequest) return next(new AppError('Leave request not found', 404));
  
  if (leaveRequest.status !== 'Pending') {
    return next(new AppError('Leave request is already processed', 400));
  }

  const currentYear = new Date().getFullYear();
  const leaveBalance = await LeaveBalance.findOne({ 
    employee: leaveRequest.employee, 
    leaveCategory: leaveRequest.leaveCategory,
    year: currentYear
  });

  if (!leaveBalance) return next(new AppError('Leave balance record not found', 404));

  // Call our pure Domain logic
  const { updatedBalance, status } = await processLeaveApproval(leaveRequest, leaveBalance, decision);

  // Apply DB Updates transactionally (Mocked transaction flow for brevity)
  leaveRequest.status = status;
  leaveRequest.remarks = remarks;
  leaveRequest.approvedBy = req.user._id;
  
  if (req.file) {
    leaveRequest.approvalDocumentUrl = `uploaded_path/${req.file.originalname}`;
  }

  await updatedBalance.save();
  await leaveRequest.save();

  res.status(200).json({ success: true, message: `Leave ${status} successfully.` });
});