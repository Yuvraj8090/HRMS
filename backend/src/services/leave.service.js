import AppError from '../utils/AppError.js';

/**
 * Processes the approval or rejection of a leave request.
 * Pure business logic function (Domain Layer).
 * * @param {Object} leaveRequest - The pending leave request object.
 * @param {Object} leaveBalance - The employee's current leave balance object.
 * @param {String} decision - 'Approved' or 'Rejected'.
 * @returns {Object} { updatedBalance, status }
 */
export const processLeaveApproval = async (leaveRequest, leaveBalance, decision) => {
  if (decision === 'Approved') {
    if (leaveBalance.currentBalance < leaveRequest.numberOfDays) {
      throw new AppError('Insufficient leave balance.', 400);
    }
    
    // Deduct balance and increment applied
    leaveBalance.currentBalance -= leaveRequest.numberOfDays;
    leaveBalance.totalApplied += leaveRequest.numberOfDays;
  }

  leaveRequest.status = decision;

  return { 
    updatedBalance: leaveBalance, 
    status: leaveRequest.status 
  };
};