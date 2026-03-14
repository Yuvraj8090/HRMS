/**
 * src/models/Attendance.model.js
 *
 * Tracks daily clock-in / clock-out records per employee.
 * Calculates total hours worked automatically via a virtual.
 */

import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    // ── Relations ──────────────────────────────────────────────────────────────
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee reference is required.'],
      index: true,
    },

    // ── Time Tracking ──────────────────────────────────────────────────────────
    date: {
      type: Date,
      required: [true, 'Attendance date is required.'],
    },
    clockIn: {
      type: Date,
      required: [true, 'Clock-in time is required.'],
    },
    clockOut: {
      type: Date,
      default: null,
    },

    // ── Status & Notes ─────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Half-Day', 'Late', 'On Leave', 'Holiday'],
      default: 'Present',
    },
    workMode: {
      type: String,
      enum: ['Office', 'Remote', 'Hybrid'],
      default: 'Office',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, 'Notes cannot exceed 300 characters.'],
    },

    // ── Location (optional, for geo-attendance) ────────────────────────────────
    clockInLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
// Compound: one attendance record per employee per date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ clockInLocation: '2dsphere' });

// ── Virtuals ───────────────────────────────────────────────────────────────────

/** Total hours worked (decimal) */
attendanceSchema.virtual('hoursWorked').get(function () {
  if (!this.clockIn || !this.clockOut) return null;
  const diffMs = new Date(this.clockOut) - new Date(this.clockIn);
  return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
});

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
