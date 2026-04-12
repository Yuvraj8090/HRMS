// src/models/LeaveCategory.model.js
import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  code:             { type: String, required: true, unique: true, uppercase: true, trim: true },
  name:             { type: String, required: true, trim: true },
  description:      { type: String, trim: true },
  isPaid:           { type: Boolean, default: true },
  isCarryForward:   { type: Boolean, default: false },
  maxCarryForward:  { type: Number, default: 0 },
  requiresMedical:  { type: Boolean, default: false },
  requiresDocument: { type: Boolean, default: false },
  defaultDays:      { type: Number, default: 0 },
  gender:           { type: String, enum: ['All','Male','Female'], default: 'All' },
  // Who can apply: All = everyone, HRAdmin = only HR & Admin
  applicableTo:     { type: String, enum: ['All','Employee','HR','Admin'], default: 'All' },
  isActive:         { type: Boolean, default: true },
  sortOrder:        { type: Number, default: 0 },
}, { timestamps: true });
export default mongoose.model('LeaveCategory', schema);
