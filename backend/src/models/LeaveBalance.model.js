import mongoose from 'mongoose';

const leaveBalanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'EmployeeProfile', required: true },
  leaveCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveCategory', required: true },
  year: { type: Number, required: true },
  openingBalance: { type: Number, required: true, min: 0 },
  totalApplied: { type: Number, default: 0, min: 0 },
  currentBalance: { type: Number, required: true, min: 0 }
}, { timestamps: true });

// Prevent duplicate balance entries for the same employee/category/year
leaveBalanceSchema.index({ employee: 1, leaveCategory: 1, year: 1 }, { unique: true });

export default mongoose.model('LeaveBalance', leaveBalanceSchema);