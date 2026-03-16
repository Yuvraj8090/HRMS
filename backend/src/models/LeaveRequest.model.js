import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'EmployeeProfile', required: true },
  leaveCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveCategory', required: true },
  
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  numberOfDays: { type: Number, required: true, min: 0.5 }, // Allows half-days
  reason: { type: String, required: true, trim: true },
  
  stationLeavePermission: { type: Boolean, default: false },
  contactDetailsWhileOnLeave: { type: String, trim: true },
  
  leaveLetterUrl: { type: String }, // Document uploaded by employee
  approvalDocumentUrl: { type: String }, // Document uploaded by HR on approval
  
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks: { type: String, trim: true }
}, { timestamps: true });

export default mongoose.model('LeaveRequest', leaveRequestSchema);