// src/models/Department.model.js
import mongoose from 'mongoose';
const deptSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true, trim: true },
  code:        { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, trim: true },
  headOf:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });
export default mongoose.model('Department', deptSchema);

// src/models/Designation.model.js — exported below
