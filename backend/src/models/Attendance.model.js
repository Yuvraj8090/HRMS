/**
 * src/models/AttendanceSummary.model.js
 *
 * Stores aggregated monthly attendance records uploaded via CSV/Excel.
 * Used primarily for payroll processing rather than daily tracking.
 */

import mongoose from 'mongoose';

const attendanceSummarySchema = new mongoose.Schema(
  {
    // ── Relations ──────────────────────────────────────────────────────────────
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee reference is required.'],
      index: true,
    },

    // ── Report Period ──────────────────────────────────────────────────────────
    // e.g., startDate: 2026-03-01, endDate: 2026-03-31
    startDate: {
      type: Date,
      required: [true, 'Report start date is required.'],
    },
    endDate: {
      type: Date,
      required: [true, 'Report end date is required.'],
    },

    // ── Aggregated Metrics (Mapped to your CSV columns) ────────────────────────
    presentDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    absentDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    weeklyOffs: {
      type: Number,
      default: 0,
      min: 0,
    },
    holidays: {
      type: Number,
      default: 0,
      min: 0,
    },
    leaveDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── Overtime ───────────────────────────────────────────────────────────────
    overtimeHours: {
      type: String, // Stored as string because your data uses "HH:MM" format (e.g., "1:50")
      default: '0:00',
    },
    overtimeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
// Compound Unique Index: Prevents uploading the same monthly report for the same employee twice.
// If HR uploads the March report twice, it will update/fail instead of duplicating.
attendanceSummarySchema.index({ employee: 1, startDate: 1, endDate: 1 }, { unique: true });

// ── Virtuals ───────────────────────────────────────────────────────────────────
/** * Automatically calculates total payable days. 
 * Usually: Present + Weekly Offs + Holidays + Paid Leaves
 */
attendanceSummarySchema.virtual('totalPayableDays').get(function () {
  return (
    this.presentDays + 
    this.weeklyOffs + 
    this.holidays + 
    this.leaveDays
  );
});

// Ensure virtuals are included when converting to JSON
attendanceSummarySchema.set('toJSON', { virtuals: true });
attendanceSummarySchema.set('toObject', { virtuals: true });

const AttendanceSummary = mongoose.model('AttendanceSummary', attendanceSummarySchema);
export default AttendanceSummary;