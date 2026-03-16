/**
 * src/utils/seeder.js
 *
 * Unified Database Seeder Script
 * Populates master tables (Leave Categories, Departments, Designations)
 * and initial test users (Admin, HR, Employee).
 *
 * Usage:
 * node src/utils/seeder.js         ← Import/Update all data
 * node src/utils/seeder.js --wipe  ← Destroy all data
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import Department from '../models/Department.model.js';
import Designation from '../models/Designation.model.js';
import EmployeeProfile from '../models/EmployeeProfile.model.js';
import LeaveCategory from '../models/LeaveCategory.model.js';

// Ensure .env is loaded correctly relative to this file
dotenv.config({ path: new URL('../../.env', import.meta.url) });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hrms_db';

// ── Master Data Definitions ────────────────────────────────────────────────────
const leaveCategories = [
  { code: 'CL', name: 'Casual Leave', defaultAnnualCount: 12, requiresDocument: false },
  { code: 'RL', name: 'Restricted Leave', defaultAnnualCount: 2, requiresDocument: false },
  { code: 'PL', name: 'Privilege Leave', defaultAnnualCount: 15, requiresDocument: false },
  { code: 'LWP', name: 'Leave Without Pay', defaultAnnualCount: 0, requiresDocument: false },
  { code: 'MEDICAL', name: 'Medical Leave', defaultAnnualCount: 12, requiresDocument: true },
];

const departments = [
  { name: 'Engineering', code: 'ENG', description: 'Software development and architecture' },
  { name: 'Human Resources', code: 'HR', description: 'People management and culture' },
  { name: 'Finance', code: 'FIN', description: 'Financial planning and accounting' },
  { name: 'Product', code: 'PROD', description: 'Product strategy and management' },
  { name: 'Design', code: 'DES', description: 'UX/UI and brand design' },
];

// ── Connection & Execution ─────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('📦 Connected to MongoDB for seeding...');
  } catch (error) {
    console.error(`❌ Error connecting to DB: ${error.message}`);
    process.exit(1);
  }
};

const importData = async () => {
  await connectDB();
  console.log('⏳ Starting Data Seed...');

  try {
    // 1. Seed Leave Categories (Idempotent: Safe to run multiple times)
    const leaveBulkOps = leaveCategories.map((category) => ({
      updateOne: {
        filter: { code: category.code },
        update: { $set: category },
        upsert: true,
      },
    }));
    await LeaveCategory.bulkWrite(leaveBulkOps);
    console.log('✅ Leave Categories seeded successfully.');

    // Note: To prevent duplicate key errors on Users/Depts if run multiple times,
    // we clear the volatile test data first before re-inserting.
    await Promise.all([
      User.deleteMany(),
      EmployeeProfile.deleteMany(),
      Department.deleteMany(),
      Designation.deleteMany(),
    ]);

    // 2. Create Departments
    const createdDepts = await Department.insertMany(departments);
    console.log(`✅ ${createdDepts.length} Departments created.`);

    const engDept = createdDepts.find((d) => d.code === 'ENG');
    const hrDept = createdDepts.find((d) => d.code === 'HR');

    // 3. Create Designations
    const designations = [
      { title: 'Junior Software Engineer', department: engDept._id, level: 'Junior', salaryRange: { min: 300000, max: 600000 } },
      { title: 'Software Engineer', department: engDept._id, level: 'Mid', salaryRange: { min: 600000, max: 1200000 } },
      { title: 'Senior Software Engineer', department: engDept._id, level: 'Senior', salaryRange: { min: 1200000, max: 2000000 } },
      { title: 'Engineering Manager', department: engDept._id, level: 'Manager', salaryRange: { min: 2000000, max: 3500000 } },
      { title: 'HR Executive', department: hrDept._id, level: 'Junior', salaryRange: { min: 300000, max: 600000 } },
      { title: 'HR Manager', department: hrDept._id, level: 'Manager', salaryRange: { min: 800000, max: 1500000 } },
    ];
    const createdDesigs = await Designation.insertMany(designations);
    console.log(`✅ ${createdDesigs.length} Designations created.`);

    // 4. Create Users
    const adminUser = await User.create({
      firstName: 'System', lastName: 'Admin', email: 'admin@hrms.local', password: 'Admin@123456', role: 'Admin',
    });
    const hrUser = await User.create({
      firstName: 'Priya', lastName: 'Sharma', email: 'hr@hrms.local', password: 'Hr@123456', role: 'HR',
    });
    const empUser = await User.create({
      firstName: 'Rahul', lastName: 'Kumar', email: 'employee@hrms.local', password: 'Emp@123456', role: 'Employee',
    });

    // 5. Create Employee Profiles
    const hrDesig = createdDesigs.find((d) => d.title === 'HR Manager');
    const empDesig = createdDesigs.find((d) => d.title === 'Software Engineer');

    await EmployeeProfile.create({
      user: hrUser._id,
      employeeId: 'EMP001',
      department: hrDept._id,
      designation: hrDesig._id,
      joiningDate: new Date('2022-01-15'),
      currentSalary: 900000,
      education: 'MBA in HR',
      yearsOfExperience: 5,
    });

    await EmployeeProfile.create({
      user: empUser._id,
      employeeId: 'EMP002',
      department: engDept._id,
      designation: empDesig._id,
      joiningDate: new Date('2023-06-01'),
      currentSalary: 800000,
      reportingTo: hrUser._id,
      education: 'B.Tech Computer Science',
      yearsOfExperience: 3,
      project: 'U-Prepare', // Added your specific project requirement
    });

    console.log(`\n✅ All Data Seeding Complete!\n`);
    console.log('─────────────────────────────────');
    console.log('  Admin    → admin@hrms.local   | Admin@123456');
    console.log('  HR       → hr@hrms.local      | Hr@123456');
    console.log('  Employee → employee@hrms.local | Emp@123456');
    console.log('─────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

const destroyData = async () => {
  await connectDB();
  console.log('🗑️  Wiping all database collections...');

  try {
    await Promise.all([
      User.deleteMany(),
      EmployeeProfile.deleteMany(),
      Department.deleteMany(),
      Designation.deleteMany(),
      LeaveCategory.deleteMany(), // Added Leave Categories to the wipe
    ]);
    console.log('✅ All data wiped successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Wipe error:', error.message);
    process.exit(1);
  }
};

// ── Script Router ──────────────────────────────────────────────────────────────
if (process.argv[2] === '--wipe' || process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}