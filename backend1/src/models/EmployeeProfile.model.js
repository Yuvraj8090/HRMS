// src/models/EmployeeProfile.model.js
// Extended HR data linked to User
import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  employeeId:     { type: String, required: true, unique: true, uppercase: true, trim: true },
  department:     { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  designation:    { type: mongoose.Schema.Types.ObjectId, ref: 'Designation', required: true },
  reportingTo:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  joiningDate:    { type: Date, required: true },
  currentSalary:  { type: Number, required: true, min: 0 },
  employmentType: { type: String, enum: ['Full-Time','Part-Time','Contract','Intern','Deputation'], default: 'Full-Time' },
  status:         { type: String, enum: ['Active','On Leave','Resigned','Terminated'], default: 'Active' },
  bankDetails:    { accountNumber: { type: String, select: false }, bankName: String, ifscCode: String },
  emergencyContact: { name: String, relationship: String, phone: String },
}, { timestamps: true, toJSON: { virtuals: true } });
schema.virtual('yearsOfService').get(function () {
  if (!this.joiningDate) return 0;
  return +((Date.now() - new Date(this.joiningDate)) / (365.25*24*60*60*1000)).toFixed(1);
});
export default mongoose.model('EmployeeProfile', schema);
