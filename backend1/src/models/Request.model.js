// src/models/Request.model.js
import mongoose from 'mongoose';
const s = new mongoose.Schema({
  type:          { type: String, enum: ['Increment','Appraisal'], required: true },
  requestedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  actionedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status:        { type: String, enum: ['Pending','Under Review','Approved','Rejected'], default: 'Pending', index: true },
  requestNotes:  { type: String, required: true, trim: true },
  decisionNotes: { type: String, trim: true },
  decidedAt:     { type: Date },
  increment: {
    currentSalary:       { type: Number },
    requestedSalary:     { type: Number },
    requestedPercentage: { type: Number },
    approvedSalary:      { type: Number },
  },
  appraisal: {
    reviewPeriod: { from: Date, to: Date },
    overallRating: { type: Number, min: 1, max: 5 },
    performanceCategory: { type: String, enum: ['Exceptional','Exceeds Expectations','Meets Expectations','Needs Improvement','Unsatisfactory'] },
    comments: { type: String },
  },
}, { timestamps: true });
export default mongoose.model('Request', s);
