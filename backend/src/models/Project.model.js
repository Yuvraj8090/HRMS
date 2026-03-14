/**
 * src/models/Project.model.js
 *
 * Project entity with multi-member assignment.
 * Employees can be added/removed from projects by Admin or HR.
 */

import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    // ── Core Info ──────────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Project name is required.'],
      trim: true,
      maxlength: [150, 'Project name cannot exceed 150 characters.'],
    },
    code: {
      type: String,
      required: [true, 'Project code is required.'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters.'],
    },

    // ── Ownership ──────────────────────────────────────────────────────────────
    /** Project manager (must be a User with appropriate role) */
    projectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project manager is required.'],
    },
    /** Department that owns the project */
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },

    // ── Team Members ───────────────────────────────────────────────────────────
    /** Array of Users assigned to this project */
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['Developer', 'Designer', 'QA', 'Analyst', 'DevOps', 'Other'],
          default: 'Developer',
        },
        assignedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ── Timeline ───────────────────────────────────────────────────────────────
    startDate: {
      type: Date,
      required: [true, 'Start date is required.'],
    },
    endDate: {
      type: Date,
      default: null,
    },
    deadline: {
      type: Date,
      default: null,
    },

    // ── Progress ───────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'],
      default: 'Planning',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // ── Budget ─────────────────────────────────────────────────────────────────
    budget: {
      allocated: { type: Number, default: 0 },
      spent:     { type: Number, default: 0 },
      currency:  { type: String, default: 'INR' },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtuals ───────────────────────────────────────────────────────────────────

/** Total number of team members */
projectSchema.virtual('teamSize').get(function () {
  return this.members?.length ?? 0;
});

/** Whether the project is overdue */
projectSchema.virtual('isOverdue').get(function () {
  if (!this.deadline || this.status === 'Completed') return false;
  return new Date() > new Date(this.deadline);
});

const Project = mongoose.model('Project', projectSchema);
export default Project;
