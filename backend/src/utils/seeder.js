/**
 * src/utils/seeder.js
 *
 * Seeds the database with initial Admin user, departments, designations,
 * and a sample HR user for testing.
 *
 * Usage:
 *   node src/utils/seeder.js         ← import data
 *   node src/utils/seeder.js --wipe  ← destroy all data
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import Department from '../models/Department.model.js';
import Designation from '../models/Designation.model.js';
import EmployeeProfile from '../models/EmployeeProfile.model.js';

dotenv.config({ path: new URL('../../.env', import.meta.url) });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hrms_db';

const departments = [
  { name: 'Engineering',        code: 'ENG',  description: 'Software development and architecture' },
  { name: 'Human Resources',    code: 'HR',   description: 'People management and culture' },
  { name: 'Finance',            code: 'FIN',  description: 'Financial planning and accounting' },
  { name: 'Product',            code: 'PROD', description: 'Product strategy and management' },
  { name: 'Design',             code: 'DES',  description: 'UX/UI and brand design' },
];

const importData = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('📦 Connected to MongoDB for seeding...');

  try {
    // Create departments
    const createdDepts = await Department.insertMany(departments);
    console.log(`✅ ${createdDepts.length} departments created.`);

    const engDept = createdDepts.find((d) => d.code === 'ENG');
    const hrDept  = createdDepts.find((d) => d.code === 'HR');

    // Create designations
    const designations = [
      { title: 'Junior Software Engineer', department: engDept._id, level: 'Junior', salaryRange: { min: 300000, max: 600000 } },
      { title: 'Software Engineer',        department: engDept._id, level: 'Mid',    salaryRange: { min: 600000, max: 1200000 } },
      { title: 'Senior Software Engineer', department: engDept._id, level: 'Senior', salaryRange: { min: 1200000, max: 2000000 } },
      { title: 'Engineering Manager',      department: engDept._id, level: 'Manager',salaryRange: { min: 2000000, max: 3500000 } },
      { title: 'HR Executive',             department: hrDept._id,  level: 'Junior', salaryRange: { min: 300000, max: 600000 } },
      { title: 'HR Manager',               department: hrDept._id,  level: 'Manager',salaryRange: { min: 800000, max: 1500000 } },
    ];
    const createdDesigs = await Designation.insertMany(designations);
    console.log(`✅ ${createdDesigs.length} designations created.`);

    // Create Admin user
    const adminUser = await User.create({
      firstName: 'System',
      lastName:  'Admin',
      email:     'admin@hrms.local',
      password:  'Admin@123456',
      role:      'Admin',
    });

    // Create HR user
    const hrUser = await User.create({
      firstName: 'Priya',
      lastName:  'Sharma',
      email:     'hr@hrms.local',
      password:  'Hr@123456',
      role:      'HR',
    });

    // Create sample Employee user
    const empUser = await User.create({
      firstName: 'Rahul',
      lastName:  'Kumar',
      email:     'employee@hrms.local',
      password:  'Emp@123456',
      role:      'Employee',
    });

    // Create profiles
    const hrDesig  = createdDesigs.find((d) => d.title === 'HR Manager');
    const empDesig = createdDesigs.find((d) => d.title === 'Software Engineer');

    await EmployeeProfile.create({
      user:        hrUser._id,
      employeeId:  'EMP001',
      department:  hrDept._id,
      designation: hrDesig._id,
      joiningDate: new Date('2022-01-15'),
      currentSalary: 900000,
    });

    await EmployeeProfile.create({
      user:        empUser._id,
      employeeId:  'EMP002',
      department:  engDept._id,
      designation: empDesig._id,
      joiningDate: new Date('2023-06-01'),
      currentSalary: 800000,
      reportingTo: hrUser._id,
    });

    console.log(`\n✅ Seeding complete!\n`);
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
  await mongoose.connect(MONGO_URI);
  console.log('🗑️  Wiping database...');

  try {
    await Promise.all([
      User.deleteMany(),
      EmployeeProfile.deleteMany(),
      Department.deleteMany(),
      Designation.deleteMany(),
    ]);
    console.log('✅ All data wiped.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Wipe error:', error.message);
    process.exit(1);
  }
};

if (process.argv[2] === '--wipe') {
  destroyData();
} else {
  importData();
}
