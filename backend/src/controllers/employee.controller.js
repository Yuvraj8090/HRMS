/**
 * src/controllers/employee.controller.js
 */

import mongoose from 'mongoose';
import User from '../models/User.model.js';
import EmployeeProfile from '../models/EmployeeProfile.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

// ── @desc   Get all employees (Optimized)
// ── @route  GET /api/employees
export const getAllEmployees = asyncHandler(async (req, res) => {
  const { search, department, status, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  // 1. Build Profile filters
  const profileFilter = {};
  if (department) profileFilter.department = department;
  if (status) profileFilter.status = status;

  // 2. Handle Cross-Collection Search safely
  if (search) {
    const regex = new RegExp(search, 'i');
    const matchingUsers = await User.find({
      isActive: true,
      $or: [{ firstName: regex }, { lastName: regex }, { email: regex }]
    })
    .select('_id')
    .limit(1000) // Guard against memory exhaustion
    .lean();
    
    profileFilter.user = { $in: matchingUsers.map(u => u._id) };
  }

  const total = await EmployeeProfile.countDocuments(profileFilter);

  const profiles = await EmployeeProfile.find(profileFilter)
    .populate('user', 'firstName lastName email role lastLogin')
    .populate('department', 'name code')
    .populate('designation', 'title level')
    .populate('reportingTo', 'firstName lastName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean(); // Faster execution for read-only data

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: profiles,
  });
});

// ── @desc   Get single employee profile
// ── @route  GET /api/employees/:id
export const getEmployee = asyncHandler(async (req, res, next) => {
  const profile = await EmployeeProfile.findOne({ user: req.params.id })
    .populate('user', '-password')
    .populate('department', 'name code')
    .populate('designation', 'title level salaryRange')
    .populate('reportingTo', 'firstName lastName email')
    .lean();

  if (!profile) return next(new AppError('Employee not found.', 404));

  res.status(200).json({ success: true, data: profile });
});

// ── @desc   Create employee (Atomic Transaction)
// ── @route  POST /api/employees
export const createEmployee = asyncHandler(async (req, res, next) => {
  const {
    firstName, lastName, email, password, role,
    employeeId, department, designation, joiningDate,
    currentSalary, employmentType, reportingTo,
    phone, dateOfBirth, gender,
  } = req.body;

  // Pre-flight checks to fail fast
  if (await User.exists({ email })) {
    return next(new AppError('An account with this email already exists.', 409));
  }
  if (await EmployeeProfile.exists({ employeeId })) {
    return next(new AppError('An employee with this ID already exists.', 409));
  }

  // INIT TRANSACTION: Prevent partial DB writes
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [user] = await User.create([{
      firstName, lastName, email,
      password: password || `Hrms@${Math.random().toString(36).slice(-8)}`,
      role: role || 'Employee',
    }], { session });

    const [profile] = await EmployeeProfile.create([{
      user: user._id,
      employeeId,
      department,
      designation,
      joiningDate,
      currentSalary,
      employmentType,
      reportingTo: reportingTo || null,
      phone,
      dateOfBirth,
      gender,
    }], { session });

    await session.commitTransaction();
    
    res.status(201).json({
      success: true,
      message: 'Employee created successfully.',
      data: { user, profile },
    });
  } catch (error) {
    await session.abortTransaction();
    throw error; // Let the global error handler format the mongoose error
  } finally {
    session.endSession();
  }
});

// ── @desc   Update employee profile (Atomic Transaction)
// ── @route  PUT /api/employees/:id
export const updateEmployee = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;
  const isSelf = userId === req.user._id.toString();
  
  // DTO: Strict field picking to prevent mass-assignment
  const { 
    firstName, lastName, phone, address, emergencyContact, // Personal (Self/HR)
    department, designation, currentSalary, status         // HR/Admin only
  } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Update User Identity (if provided)
    if (firstName || lastName) {
      const userUpdate = {};
      if (firstName) userUpdate.firstName = firstName;
      if (lastName) userUpdate.lastName = lastName;
      
      await User.findByIdAndUpdate(userId, userUpdate, { session, runValidators: true });
    }

    // 2. Update Profile
    const profileUpdate = {};
    if (phone) profileUpdate.phone = phone;
    if (address) profileUpdate.address = address;
    if (emergencyContact) profileUpdate.emergencyContact = emergencyContact;

    // RBAC: Only allow HR/Admin to update professional fields
    if (!isSelf || req.user.role !== 'Employee') {
      if (department) profileUpdate.department = department;
      if (designation) profileUpdate.designation = designation;
      if (currentSalary !== undefined) profileUpdate.currentSalary = currentSalary;
      if (status) profileUpdate.status = status;
    }

    const updatedProfile = await EmployeeProfile.findOneAndUpdate(
      { user: userId },
      { $set: profileUpdate },
      { new: true, runValidators: true, session }
    ).populate('department designation user');

    if (!updatedProfile) {
      throw new AppError('Employee profile not found.', 404);
    }

    await session.commitTransaction();
    res.status(200).json({ success: true, data: updatedProfile });

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// ── @desc   Deactivate employee
// ── @route  DELETE /api/employees/:id
export const deactivateEmployee = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { isActive: false }, 
      { session, new: true }
    );
    
    if (!user) throw new AppError('User not found.', 404);

    await EmployeeProfile.findOneAndUpdate(
      { user: req.params.id },
      { status: 'Terminated' }, // Or Resigned based on payload, defaulting to Terminated
      { session }
    );

    await session.commitTransaction();
    res.status(200).json({ success: true, message: 'Employee deactivated successfully.' });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});