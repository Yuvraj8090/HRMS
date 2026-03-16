import mongoose from 'mongoose';

const leaveCategorySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true }, // CL, RL, PL, LWP
  name: { type: String, required: true },
  defaultAnnualCount: { type: Number, required: true, min: 0 },
  requiresDocument: { type: Boolean, default: false } // E.g., Medical leaves might require proof
}, { timestamps: true });

export default mongoose.model('LeaveCategory', leaveCategorySchema);