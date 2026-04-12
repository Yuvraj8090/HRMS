// src/models/Contract.model.js
import mongoose from 'mongoose';
const s = new mongoose.Schema({
  employee:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  contractDate: { type: Date, required: true },
  startDate:    { type: Date, required: true },
  endDate:      { type: Date, required: true },
  renewalDate:  { type: Date, default: null },
  contractDocumentUrl:        { type: String, default: null },
  renewedContractDocumentUrl: { type: String, default: null },
  status:       { type: String, enum: ['Active','Expiring','Expired','Renewed'], default: 'Active', index: true },
  isRenewed:    { type: Boolean, default: false },
  renewedFrom:  { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', default: null },
  renewalCount: { type: Number, default: 0 },
  contractType: { type: String, enum: ['Full-Time','Part-Time','Contractual','Deputation','Adhoc'], default: 'Contractual' },
  notes:        { type: String, trim: true, maxlength: 1000 },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true, toJSON: { virtuals: true } });
s.virtual('daysUntilExpiry').get(function () {
  if (!this.endDate) return null;
  return Math.floor((new Date(this.endDate) - new Date()) / (1000 * 60 * 60 * 24));
});
s.pre('save', function (next) {
  if (!this.endDate) { this.status = 'Active'; return next(); }
  const d = Math.floor((new Date(this.endDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (d < 0) this.status = 'Expired';
  else if (d <= (parseInt(process.env.CONTRACT_EXPIRY_WARNING_DAYS) || 30)) this.status = 'Expiring';
  else if (this.isRenewed) this.status = 'Renewed';
  else this.status = 'Active';
  next();
});
export default mongoose.model('Contract', s);
