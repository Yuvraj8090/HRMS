import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'EmployeeProfile', required: true },
  contractDate: { type: Date, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  renewalDate: { type: Date },
  documentUrl: { type: String }, // Path to S3 or local uploads
  status: { type: String, enum: ['Active', 'Expired', 'Pending Renewal'], default: 'Active' }
}, { timestamps: true });

export default mongoose.model('Contract', contractSchema);