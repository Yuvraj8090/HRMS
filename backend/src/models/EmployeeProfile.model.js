import mongoose from 'mongoose';

const employeeProfileSchema = new mongoose.Schema(
  {
    // ── Core Link & Org Structure ──────────────────────────────────────────────
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    employeeId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    designation: { type: mongoose.Schema.Types.ObjectId, ref: 'Designation', required: true },
    reportingTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // ── Personal Info ──────────────────────────────────────────────────────────
    phone: { type: String, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Non-Binary', 'Prefer not to say'] },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
      pincode: { type: String, trim: true },
    },
    profilePhoto: { type: String, default: null },

    // ── Extended HR Fields (New) ───────────────────────────────────────────────
    education: { type: String, trim: true },
    yearsOfExperience: { type: Number, min: 0, default: 0 },
    officeLocation: { type: String, trim: true },
    unit: { type: String, trim: true },
    project: { type: String, trim: true }, // e.g., 'U-Prepare'

    // ── Employment Details ─────────────────────────────────────────────────────
    joiningDate: { type: Date, required: true },
    employmentType: { type: String, enum: ['Full-Time', 'Part-Time', 'Contract', 'Intern'], default: 'Full-Time' },
    currentSalary: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Active', 'On Leave', 'Resigned', 'Terminated'], default: 'Active' },

    emergencyContact: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    bankDetails: {
      accountNumber: { type: String, select: false },
      bankName: { type: String },
      ifscCode: { type: String },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

employeeProfileSchema.virtual('yearsOfService').get(function () {
  if (!this.joiningDate) return 0;
  return Math.floor((Date.now() - new Date(this.joiningDate).getTime()) / 31557600000);
});

export default mongoose.model('EmployeeProfile', employeeProfileSchema);