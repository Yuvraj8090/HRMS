// src/services/leave.service.js
import LeaveBalance   from '../models/LeaveBalance.model.js';
import LeaveCategory  from '../models/LeaveCategory.model.js';
import { AppError }   from '../utils/AppError.js';

export class LeaveService {
  /**
   * Check overlap: any Pending/Recommended/Approved leave for user in date range
   */
  static async checkOverlap(userId, fromDate, toDate, excludeId = null) {
    const LeaveRequest = (await import('../models/LeaveRequest.model.js')).default;
    const filter = {
      applicant: userId,
      status: { $in: ['Pending', 'Recommended', 'Approved'] },
      fromDate: { $lte: toDate },
      toDate:   { $gte: fromDate },
    };
    if (excludeId) filter._id = { $ne: excludeId };
    return LeaveRequest.findOne(filter);
  }

  /**
   * Check and return balance. Throws if insufficient (for paid leaves).
   */
  static async checkBalance(userId, leaveCategoryId, days, year) {
    const cat = await LeaveCategory.findById(leaveCategoryId);
    if (!cat) throw new AppError('Leave category not found.', 404);
    // LWP / Unpaid — no balance check
    if (!cat.isPaid) return null;
    const bal = await LeaveBalance.findOne({ user: userId, leaveCategory: leaveCategoryId, year });
    if (!bal) throw new AppError(`No ${cat.code} leave allocation found for ${year}. Contact HR.`, 400);
    if (bal.currentBalance < days)
      throw new AppError(`Insufficient ${cat.code} balance. Available: ${bal.currentBalance} day(s), Requested: ${days} day(s).`, 400);
    return bal;
  }

  /** Reserve pending days */
  static async reservePending(userId, leaveCategoryId, days, year) {
    await LeaveBalance.findOneAndUpdate(
      { user: userId, leaveCategory: leaveCategoryId, year },
      { $inc: { pendingDays: days } }
    );
  }

  /** On approval: move pending → used */
  static async consumeLeave(userId, leaveCategoryId, days, year) {
    await LeaveBalance.findOneAndUpdate(
      { user: userId, leaveCategory: leaveCategoryId, year },
      { $inc: { usedDays: days, pendingDays: -days } }
    );
  }

  /** On rejection/cancellation: restore pending */
  static async restorePending(userId, leaveCategoryId, days, year) {
    await LeaveBalance.findOneAndUpdate(
      { user: userId, leaveCategory: leaveCategoryId, year },
      { $inc: { pendingDays: -days } }
    );
  }

  /** On cancellation of approved leave: restore used */
  static async restoreUsed(userId, leaveCategoryId, days, year) {
    await LeaveBalance.findOneAndUpdate(
      { user: userId, leaveCategory: leaveCategoryId, year },
      { $inc: { usedDays: -days } }
    );
  }

  /**
   * Init leave balances for a user from category defaults
   */
  static async initBalances(userId, year) {
    const cats = await LeaveCategory.find({ isActive: true });
    for (const cat of cats) {
      await LeaveBalance.findOneAndUpdate(
        { user: userId, leaveCategory: cat._id, year },
        {
          $setOnInsert: {
            user: userId, leaveCategory: cat._id, categoryCode: cat.code,
            year, openingBalance: 0, allocatedDays: cat.defaultDays,
            totalBalance: cat.defaultDays, usedDays: 0, pendingDays: 0,
            currentBalance: cat.defaultDays,
          },
        },
        { upsert: true, new: true }
      );
    }
  }
}
