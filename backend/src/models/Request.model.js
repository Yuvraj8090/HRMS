/**
 * src/models/Request.model.js
 *
 * Unified Request model handling two workflow types:
 *   1. 'Increment'  — Employee requests a salary increase.
 *   2. 'Appraisal'  — Multi-stage performance appraisal review.
 *
 * Status lifecycle:
 *   Pending → Under Review → Approved | Rejected
 *
 * For Appraisal, the `reviewStages` sub-document tracks each stage separately.
 */

import mongoose from 'mongoose';

// ── Review Stage Sub-Schema (Appraisal only) ───────────────────────────────────
const reviewStageSchema = new mongoose.Schema(
  {
    stage: {
      type: String,
      enum: ['Self Review', 'Peer Review', 'Manager Review', 'HR Review', 'Final Decision'],
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    comments: {
      type: String,
      trim: true,
      maxlength: [1000, 'Stage comments cannot exceed 1000 characters.'],
    },
    completedAt: {
      type: Date,
      default: null,
    },
    isComplete: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

// ── Main Request Schema ────────────────────────────────────────────────────────
const requestSchema = new mongoose.Schema(
  {
    // ── Type ───────────────────────────────────────────────────────────────────
    type: {
      type: String,
      enum: {
        values: ['Increment', 'Appraisal'],
        message: 'Request type must be Increment or Appraisal.',
      },
      required: [true, 'Request type is required.'],
      index: true,
    },

    // ── Relations ──────────────────────────────────────────────────────────────
    /** The employee submitting the request */
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requesting employee is required.'],
      index: true,
    },
    /** HR or Admin who last actioned this request */
    actionedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ── Status ─────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['Pending', 'Under Review', 'Approved', 'Rejected'],
      default: 'Pending',
      index: true,
    },

    // ── Increment-Specific Fields ──────────────────────────────────────────────
    increment: {
      currentSalary: {
        type: Number,
        default: null,
      },
      requestedSalary: {
        type: Number,
        default: null,
      },
      /** Percentage increase requested */
      requestedPercentage: {
        type: Number,
        min: [1, 'Increment percentage must be at least 1%.'],
        max: [100, 'Increment percentage cannot exceed 100%.'],
        default: null,
      },
      /** Final approved salary (filled on approval) */
      approvedSalary: {
        type: Number,
        default: null,
      },
    },

    // ── Appraisal-Specific Fields ──────────────────────────────────────────────
    appraisal: {
      reviewPeriod: {
        from: { type: Date, default: null },
        to:   { type: Date, default: null },
      },
      /** Ordered list of review stages */
      reviewStages: [reviewStageSchema],
      /** Overall score (average across stages) */
      overallRating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      /** Performance category assigned at the end */
      performanceCategory: {
        type: String,
        enum: ['Exceptional', 'Exceeds Expectations', 'Meets Expectations', 'Needs Improvement', 'Unsatisfactory'],
        default: null,
      },
    },

    // ── Common Notes ───────────────────────────────────────────────────────────
    /** Employee's justification / self-assessment */
    requestNotes: {
      type: String,
      trim: true,
      required: [true, 'Request notes or justification are required.'],
      maxlength: [2000, 'Notes cannot exceed 2000 characters.'],
    },
    /** HR/Admin decision notes */
    decisionNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Decision notes cannot exceed 2000 characters.'],
    },

    /** Timestamp when the final decision was made */
    decidedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtuals ───────────────────────────────────────────────────────────────────

/** For Increment: computed percentage if not explicitly provided */
requestSchema.virtual('computedIncrementPct').get(function () {
  const { currentSalary, requestedSalary } = this.increment ?? {};
  if (!currentSalary || !requestedSalary) return null;
  return parseFloat((((requestedSalary - currentSalary) / currentSalary) * 100).toFixed(2));
});

/** For Appraisal: how many stages are complete */
requestSchema.virtual('completedStages').get(function () {
  return this.appraisal?.reviewStages?.filter((s) => s.isComplete).length ?? 0;
});

const Request = mongoose.model('Request', requestSchema);
export default Request;
