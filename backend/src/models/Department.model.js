/**
 * src/models/Department.model.js
 *
 * Organisational department (e.g. Engineering, HR, Finance).
 */

import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required.'],
      unique: true,
      trim: true,
      maxlength: [100, 'Department name cannot exceed 100 characters.'],
    },
    code: {
      type: String,
      required: [true, 'Department code is required.'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [10, 'Department code cannot exceed 10 characters.'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters.'],
    },
    // Head of department — references a User
    headOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Department = mongoose.model('Department', departmentSchema);
export default Department;
