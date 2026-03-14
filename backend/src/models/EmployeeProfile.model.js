/**
 * src/models/EmployeeProfile.model.js
 *
 * Extended HR profile for an employee.
 * One-to-one relationship with User (via `user` field).
 * Links to Department and Designation.
 */

import mongoose from 'mongoose';

const employeeProfileSchema = new mongoose.Schema(
  {
    // ── Core Link ──────────────────────────────────────────────────────────────
    /** The auth user this profile belongs to */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // ── Org Structure ──────────────────────────────────────────────────────────
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required.'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required.'],
    },
    designation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Designation',
      required: [true, 'Designation is required.'],
    },
    /** Direct line manager */
    reportingTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ── Personal Info ──────────────────────────────────────────────────────────
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-().]{7,20}$/, 'Invalid phone number format.'],
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Non-Binary', 'Prefer not to say'],
    },
    address: {
      street:  { type: String, trim: true },
      city:    { type: String, trim: true },
      state:   { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
      pincode: { type: String, trim: true },
    },
    profilePhoto: {
      type: String, // URL / path to uploaded image
      default: null,
    },

    // ── Employment Details ─────────────────────────────────────────────────────
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required.'],
    },
    employmentType: {
      type: String,
      enum: ['Full-Time', 'Part-Time', 'Contract', 'Intern'],
      default: 'Full-Time',
    },
    currentSalary: {
      type: Number,
      required: [true, 'Current salary is required.'],
      min: [0, 'Salary cannot be negative.'],
    },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Resigned', 'Terminated'],
      default: 'Active',
    },

    // ── Emergency Contact ──────────────────────────────────────────────────────
    emergencyContact: {
      name:         { type: String, trim: true },
      relationship: { type: String, trim: true },
      phone:        { type: String, trim: true },
    },

    // ── Bank Details (sensitive) ───────────────────────────────────────────────
    bankDetails: {
      accountNumber: { type: String, select: false },
      bankName:      { type: String },
      ifscCode:      { type: String },
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtuals ───────────────────────────────────────────────────────────────────

/** Years of service */
employeeProfileSchema.virtual('yearsOfService').get(function () {
  if (!this.joiningDate) return 0;
  const diffMs = Date.now() - new Date(this.joiningDate).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
});

const EmployeeProfile = mongoose.model('EmployeeProfile', employeeProfileSchema);
export default EmployeeProfile;
