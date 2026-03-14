/**
 * src/models/Designation.model.js
 *
 * Job title / designation (e.g. Software Engineer, Senior Manager).
 * Belongs to a Department.
 */

import mongoose from 'mongoose';

const designationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Designation title is required.'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters.'],
    },
    // Which department this designation belongs to
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required for a designation.'],
    },
    // Seniority level for salary band / approval logic
    level: {
      type: String,
      enum: ['Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'VP', 'C-Level'],
      default: 'Junior',
    },
    // Base salary range
    salaryRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound unique: same title cannot exist in the same department
designationSchema.index({ title: 1, department: 1 }, { unique: true });

const Designation = mongoose.model('Designation', designationSchema);
export default Designation;
