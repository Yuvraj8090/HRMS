/**
 * src/models/User.model.js
 *
 * Core authentication model.
 * Roles: 'Admin' | 'HR' | 'Employee'
 * Password is hashed via bcrypt pre-save hook.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
  {
    // ── Identity ───────────────────────────────────────────────────────────────
    firstName: {
      type: String,
      required: [true, 'First name is required.'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters.'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required.'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address.'],
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [8, 'Password must be at least 8 characters.'],
      select: false, // Never return password in queries by default
    },

    // ── RBAC ───────────────────────────────────────────────────────────────────
    role: {
      type: String,
      enum: {
        values: ['Admin', 'HR', 'Employee'],
        message: 'Role must be Admin, HR, or Employee.',
      },
      default: 'Employee',
    },

    // ── Status ─────────────────────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },

    // ── Password Reset ─────────────────────────────────────────────────────────
    passwordResetToken: String,
    passwordResetExpire: Date,
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtuals ───────────────────────────────────────────────────────────────────

/** Full name virtual */
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

/** Reverse-populate the employee profile */
userSchema.virtual('profile', {
  ref:          'EmployeeProfile',
  localField:   '_id',
  foreignField: 'user',
  justOne:      true,
});

// ── Pre-save Hook: Hash Password ───────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if the password field was modified
  if (!this.isModified('password')) return next();

  const salt    = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance Methods ───────────────────────────────────────────────────────────

/**
 * Compares a plain-text password against the stored hash.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.matchPassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Generates a signed JWT for this user.
 * @returns {string} Signed JWT token
 */
userSchema.methods.getSignedJWT = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const User = mongoose.model('User', userSchema);
export default User;
