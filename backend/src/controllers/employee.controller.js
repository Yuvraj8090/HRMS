import mongoose from 'mongoose';
import User from '../models/User.model.js';
import EmployeeProfile from '../models/EmployeeProfile.model.js';
import Department from '../models/Department.model.js';
import Designation from '../models/Designation.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { parseExcelToJSON } from '../utils/excelParser.js';

export const importAllEmployeesExcel = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file uploaded', 400));

  const data = parseExcelToJSON(req.file.buffer);
  if (!data || data.length === 0) return next(new AppError('Excel sheet is empty', 400));

  let importedCount = 0;
  let updatedCount = 0;
  const importLog = [];
  const CHUNK_SIZE = 10;

  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);

    await Promise.all(chunk.map(async (row) => {
      const sl = row['Sl.'];
      const name = row['Name'];
      if (!name || !sl) return;

      try {
        const email = String(row['email'] || `emp${sl}.uprepare@hrms.local`).trim().toLowerCase();
        const phone = String(row['Mobile No.'] || '').trim();
        const deptName = String(row['PMU/PIU'] || 'General').trim();
        const desigName = String(row['Designation'] || 'Staff').trim();
        const salaryRaw = row['Present Salary'];

        // --- 1. Robust Department Logic (Fixes the "PIU-" Error) ---
        // We generate a code based on the full name to ensure uniqueness
        const generatedCode = deptName
          .replace(/[^a-zA-Z0-9]/g, '') // Remove dashes and spaces
          .substring(0, 6)
          .toUpperCase();

        const dept = await Department.findOneAndUpdate(
          { name: deptName },
          { name: deptName, code: generatedCode },
          { upsert: true, new: true, lean: true }
        );

        // --- 2. Resolve Designation ---
        const designation = await Designation.findOneAndUpdate(
          { title: desigName, department: dept._id },
          { title: desigName, department: dept._id },
          { upsert: true, new: true, lean: true }
        );

        // --- 3. UPSERT User (Update if exists, Create if new) ---
        const userData = {
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' ') || 'Employee',
          role: 'Employee'
        };

        // If it's a new user, we set a default password
        const user = await User.findOneAndUpdate(
          { email },
          { $set: userData, $setOnInsert: { password: 'ChangeMe@123' } },
          { upsert: true, new: true }
        );

        // --- 4. UPSERT Profile ---
        const cleanSalary = typeof salaryRaw === 'number' 
          ? salaryRaw 
          : parseFloat(String(salaryRaw || '0').replace(/[^0-9.]/g, '')) || 0;

        const profileData = {
          user: user._id,
          employeeId: `UP-${sl}`,
          department: dept._id,
          designation: designation._id,
          currentSalary: cleanSalary,
          phone: phone || undefined,
          joiningDate: row['Date of Joining'] ? new Date(row['Date of Joining']) : new Date(),
          dateOfBirth: row['Date of Birth'] ? new Date(row['Date of Birth']) : null,
          address: { street: row['Address'] || '-' },
          project: 'U-Prepare',
          status: 'Active'
        };

        const existingProfile = await EmployeeProfile.findOne({ user: user._id });
        
        await EmployeeProfile.findOneAndUpdate(
          { user: user._id },
          { $set: profileData },
          { upsert: true }
        );

        if (existingProfile) {
          updatedCount++;
          importLog.push({ sl, name, status: 'Updated', details: `Refreshed UP-${sl}` });
        } else {
          importedCount++;
          importLog.push({ sl, name, status: 'Success', details: `Created UP-${sl}` });
        }

      } catch (err) {
        importLog.push({ sl, name: name || 'Unknown', status: 'Error', reason: err.message });
      }
    }));
  }

  const lastImported = importLog.length > 0 ? importLog[importLog.length - 1].name : 'N/A';

  res.status(200).json({
    success: true,
    message: `U-Prepare Data Sync Complete.`,
    stats: {
      totalInSheet: data.length,
      newlyImported: importedCount,
      updatedExisting: updatedCount,
      lastPerson: lastImported
    },
    log: importLog
  });
});
// ── GET all employees ────────────────────────────────────────────────────────
export const getAllEmployees = asyncHandler(async (req, res) => {
  const { search, department, status, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const profileFilter = {};
  if (department) profileFilter.department = department;
  if (status) profileFilter.status = status;

  if (search) {
    const regex = new RegExp(search, 'i');
    const matchingUsers = await User.find({
      $or: [{ firstName: regex }, { lastName: regex }, { email: regex }]
    }).select('_id').lean();
    
    profileFilter.user = { $in: matchingUsers.map(u => u._id) };
  }

  const total = await EmployeeProfile.countDocuments(profileFilter);
  const profiles = await EmployeeProfile.find(profileFilter)
    .populate('user', 'firstName lastName email role lastLogin')
    .populate('department', 'name code')
    .populate('designation', 'title level')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: profiles,
  });
});

// ── Get single employee ──────────────────────────────────────────────────────
export const getEmployee = asyncHandler(async (req, res, next) => {
  const profile = await EmployeeProfile.findOne({ user: req.params.id })
    .populate('user', '-password')
    .populate('department', 'name code')
    .populate('designation', 'title level salaryRange')
    .lean();

  if (!profile) return next(new AppError('Employee not found.', 404));
  res.status(200).json({ success: true, data: profile });
});

// ── Create Employee (Single) ─────────────────────────────────────────────────
export const createEmployee = asyncHandler(async (req, res, next) => {
  const { email, employeeId } = req.body;
  if (await User.exists({ email })) return next(new AppError('Email already exists.', 409));

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const [user] = await User.create([{
      ...req.body,
      password: req.body.password || `Hrms@${Math.random().toString(36).slice(-8)}`,
    }], { session });

    await EmployeeProfile.create([{ ...req.body, user: user._id }], { session });
    await session.commitTransaction();
    res.status(201).json({ success: true, message: 'Employee created.' });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// ── Update Employee ─────────────────────────────────────────────────────────
export const updateEmployee = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (req.body.firstName || req.body.lastName) {
      await User.findByIdAndUpdate(req.params.id, {
        firstName: req.body.firstName,
        lastName: req.body.lastName
      }, { session });
    }
    const profile = await EmployeeProfile.findOneAndUpdate({ user: req.params.id }, { $set: req.body }, { session, new: true });
    if (!profile) throw new AppError('Profile not found', 404);

    await session.commitTransaction();
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// ── Deactivate Employee ──────────────────────────────────────────────────────
export const deactivateEmployee = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false }, { session });
    await EmployeeProfile.findOneAndUpdate({ user: req.params.id }, { status: 'Terminated' }, { session });
    await session.commitTransaction();
    res.status(200).json({ success: true, message: 'Deactivated.' });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});