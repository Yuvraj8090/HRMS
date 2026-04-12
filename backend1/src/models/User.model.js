// src/models/User.model.js
import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';
import jwt      from 'jsonwebtoken';

const educationSchema = new mongoose.Schema({
  degree: String, institution: String, yearOfPassing: Number, percentage: Number
}, { _id: false });

const schema = new mongoose.Schema({
  firstName:  { type: String, required: [true,'First name required.'], trim: true },
  lastName:   { type: String, required: [true,'Last name required.'],  trim: true },
  email:      { type: String, required: [true,'Email required.'], unique: true, lowercase: true, trim: true },
  password:   { type: String, required: [true,'Password required.'], minlength: 6, select: false },
  role:       { type: String, enum: ['Admin','HR','Employee'], default: 'Employee' },
  isActive:   { type: Boolean, default: true },
  lastLogin:  { type: Date },

  // Extended profile
  employeeNumber:    { type: String, trim: true, sparse: true },
  dateOfBirth:       { type: Date },
  gender:            { type: String, enum: ['Male','Female','Non-Binary','Prefer not to say'] },
  phone:             { type: String, trim: true },
  education:         [educationSchema],
  yearsOfExperience: { type: Number, default: 0 },
  office:            { type: String, trim: true },
  position:          { type: String, trim: true },
  unit:              { type: String, trim: true },
  project:           { type: String, trim: true },
  payCode:           { type: String, trim: true, uppercase: true },
  cardNo:            { type: String, trim: true },
  department:        { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  designation:       { type: mongoose.Schema.Types.ObjectId, ref: 'Designation' },
  reportingTo:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  joiningDate:       { type: Date },
  currentSalary:     { type: Number, default: 0 },
  employmentType:    { type: String, enum: ['Full-Time','Part-Time','Contractual','Intern','Deputation'], default: 'Full-Time' },
  avatar:            { type: String, default: null },
  address: {
    street: String, city: String, state: String,
    country: { type: String, default: 'India' }, pincode: String,
  },
  emergencyContact: { name: String, relationship: String, phone: String },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

schema.virtual('fullName').get(function () { return `${this.firstName} ${this.lastName}`; });
schema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  return Math.floor((Date.now() - new Date(this.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
});

schema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
schema.methods.matchPassword = function (pw) { return bcrypt.compare(pw, this.password); };
schema.methods.getJWT = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

schema.index({ payCode: 1 }); schema.index({ cardNo: 1 }); schema.index({ employeeNumber: 1 });
export default mongoose.model('User', schema);
