// src/models/LeaveBalance.model.js
import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  leaveCategory:  { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveCategory', required: true },
  categoryCode:   { type: String, uppercase: true, trim: true },
  year:           { type: Number, required: true },
  openingBalance: { type: Number, default: 0 },
  allocatedDays:  { type: Number, default: 0 },
  totalBalance:   { type: Number, default: 0 },
  usedDays:       { type: Number, default: 0 },
  pendingDays:    { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
}, { timestamps: true });
schema.index({ user: 1, leaveCategory: 1, year: 1 }, { unique: true });
schema.pre('save', function (next) {
  this.totalBalance   = this.openingBalance + this.allocatedDays;
  this.currentBalance = Math.max(0, this.totalBalance - this.usedDays);
  next();
});
export default mongoose.model('LeaveBalance', schema);
