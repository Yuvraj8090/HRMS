// src/models/LeaveRequest.model.js
import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  // Applicant — can be Employee, HR, or Admin
  applicant:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  applicantRole:  { type: String, enum: ['Admin','HR','Employee'], required: true },

  leaveCategory:  { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveCategory', required: true },
  categoryCode:   { type: String, uppercase: true, trim: true },

  // Dates
  fromDate:       { type: Date, required: true },
  toDate:         { type: Date, required: true },
  numberOfDays:   { type: Number, required: true, min: 0.5 },
  isHalfDay:      { type: Boolean, default: false },

  // Form fields (per official leave application form)
  reason:         { type: String, required: true, trim: true, minlength: 5 },
  stationLeavePermission: { type: Boolean, default: false },
  contactWhileOnLeave: {
    phone:   { type: String, trim: true },
    address: { type: String, trim: true },
    email:   { type: String, trim: true },
  },

  // Documents
  leaveLetterUrl:      { type: String, default: null },
  approvedDocumentUrl: { type: String, default: null },

  // Workflow
  // Employee → Pending → HR Recommends → Admin Approves/Rejects
  // HR       → Pending → Admin Approves/Rejects  (HR can't approve own leave)
  // Admin    → Auto-Approved (Admin approves own leave)
  status: {
    type: String,
    enum: ['Pending','Recommended','Approved','Rejected','Cancelled'],
    default: 'Pending',
    index: true,
  },

  // Level 1: Recommendation (HR recommends Employee's leave; for HR's own leave, this is skipped)
  recommendedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  recommendedAt:  { type: Date },
  recommendNote:  { type: String, trim: true },

  // Level 2: Final Approval (Admin approves/rejects all non-Admin leaves)
  actionedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  actionedAt:     { type: Date },
  actionNote:     { type: String, trim: true },

  year:           { type: Number, required: true },
}, { timestamps: true });

schema.index({ applicant: 1, fromDate: 1, toDate: 1 });
schema.index({ status: 1, createdAt: -1 });
export default mongoose.model('LeaveRequest', schema);
