// src/models/Attendance.model.js
import mongoose from 'mongoose';
const s = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date:     { type: Date, required: true },
  clockIn:  { type: Date, required: true },
  clockOut: { type: Date, default: null },
  status:   { type: String, enum: ['Present','Absent','Half-Day','Late','On Leave','Holiday'], default: 'Present' },
  workMode: { type: String, enum: ['Office','Remote','Hybrid'], default: 'Office' },
  notes:    { type: String, trim: true, maxlength: 300 },
  // Import tracking
  importedFrom: { type: String, default: null }, // 'excel' or null
  payCode:      { type: String },
  presentDays:  { type: Number },
  absentDays:   { type: Number },
  weeklyOffDays:{ type: Number },
  holidayDays:  { type: Number },
  leaveDays:    { type: Number },
  otHours:      { type: Number, default: 0 },
  otMinutes:    { type: Number, default: 0 },
  otAmount:     { type: Number, default: 0 },
  month:        { type: Number },
  year:         { type: Number },
}, { timestamps: true, toJSON: { virtuals: true } });
s.index({ employee: 1, date: 1 }, { unique: true });
s.virtual('hoursWorked').get(function () {
  if (!this.clockIn || !this.clockOut) return null;
  return +((new Date(this.clockOut) - new Date(this.clockIn)) / 3600000).toFixed(2);
});
export default mongoose.model('Attendance', s);
