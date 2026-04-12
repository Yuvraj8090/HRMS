// src/models/Designation.model.js
import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  department:  { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  level:       { type: String, enum: ['Junior','Mid','Senior','Lead','Manager','Director','VP','C-Level'], default: 'Junior' },
  salaryRange: { min: { type: Number, default: 0 }, max: { type: Number, default: 0 } },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });
schema.index({ title: 1, department: 1 }, { unique: true });
export default mongoose.model('Designation', schema);
