// src/utils/seeder.js
import mongoose from 'mongoose';
import dotenv   from 'dotenv';
import User         from '../models/User.model.js';
import Department   from '../models/Department.model.js';
import Designation  from '../models/Designation.model.js';
import Contract     from '../models/Contract.model.js';
import LeaveCategory from '../models/LeaveCategory.model.js';
import LeaveBalance  from '../models/LeaveBalance.model.js';
import Project       from '../models/Project.model.js';

dotenv.config({ path: new URL('../../.env', import.meta.url) });
await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hrms_db');
console.log('📦 Connected for seeding…');

if (process.argv[2] === '--wipe') {
  await Promise.all([User, Department, Designation, Contract, LeaveCategory, LeaveBalance, Project].map(M => M.deleteMany()));
  console.log('🗑  All data wiped.'); process.exit(0);
}

const YEAR = new Date().getFullYear();

// ── 1. Departments ─────────────────────────────────────────────────────────
const depts = await Department.insertMany([
  { name: 'Engineering',     code: 'ENG',   description: 'Software development & architecture' },
  { name: 'Human Resources', code: 'HR',    description: 'People operations & culture' },
  { name: 'Finance',         code: 'FIN',   description: 'Financial planning & compliance' },
  { name: 'PREP Unit',       code: 'PREP',  description: 'Preparedness & Response' },
  { name: 'Administration',  code: 'ADMIN', description: 'Admin & Operations' },
]);
const [eng, hrDept, , prepDept, adminDept] = depts;
console.log(`✅ ${depts.length} departments`);

// ── 2. Designations ────────────────────────────────────────────────────────
const desigs = await Designation.insertMany([
  { title: 'Software Engineer',    department: eng._id,      level: 'Mid',     salaryRange: { min: 700000,  max: 1400000 } },
  { title: 'Senior Engineer',      department: eng._id,      level: 'Senior',  salaryRange: { min: 1400000, max: 2200000 } },
  { title: 'HR Manager',           department: hrDept._id,   level: 'Manager', salaryRange: { min: 900000,  max: 1600000 } },
  { title: 'HR Executive',         department: hrDept._id,   level: 'Mid',     salaryRange: { min: 450000,  max: 800000  } },
  { title: 'Consultant',           department: prepDept._id, level: 'Mid',     salaryRange: { min: 600000,  max: 1200000 } },
  { title: 'Senior Consultant',    department: prepDept._id, level: 'Senior',  salaryRange: { min: 1000000, max: 2000000 } },
  { title: 'System Administrator', department: adminDept._id,level: 'Lead',    salaryRange: { min: 2000000, max: 4000000 } },
]);
console.log(`✅ ${desigs.length} designations`);

// ── 3. Leave Categories ────────────────────────────────────────────────────
const leaveCats = await LeaveCategory.insertMany([
  { code: 'CL',  name: 'Casual Leave',      isPaid: true,  isCarryForward: false, defaultDays: 12, sortOrder: 1, description: 'For personal or family needs' },
  { code: 'ML',  name: 'Medical Leave',     isPaid: true,  isCarryForward: false, defaultDays: 10, sortOrder: 2, requiresMedical: true, description: 'For illness requiring medical attention' },
  { code: 'EL',  name: 'Earned Leave',      isPaid: true,  isCarryForward: true,  defaultDays: 20, maxCarryForward: 60, sortOrder: 3, description: 'Accrued based on service' },
  { code: 'PL',  name: 'Privilege Leave',   isPaid: true,  isCarryForward: true,  defaultDays: 15, maxCarryForward: 30, sortOrder: 4, description: 'Annual privilege leave' },
  { code: 'LWP', name: 'Leave Without Pay', isPaid: false, isCarryForward: false, defaultDays: 0,  sortOrder: 5, description: 'Unpaid leave when balance exhausted' },
  { code: 'MAT', name: 'Maternity Leave',   isPaid: true,  isCarryForward: false, defaultDays: 180,sortOrder: 6, gender: 'Female', description: '26 weeks statutory maternity leave' },
  { code: 'PAT', name: 'Paternity Leave',   isPaid: true,  isCarryForward: false, defaultDays: 15, sortOrder: 7, gender: 'Male',   description: 'For new fathers' },
  { code: 'RL',  name: 'Restricted Leave',  isPaid: true,  isCarryForward: false, defaultDays: 2,  sortOrder: 8, description: 'For gazetted holidays of choice' },
  { code: 'CMP', name: 'Compensatory Leave',isPaid: true,  isCarryForward: false, defaultDays: 0,  sortOrder: 9, description: 'For working on holidays/weekends' },
]);
const catMap = Object.fromEntries(leaveCats.map(c => [c.code, c._id]));
console.log(`✅ ${leaveCats.length} leave categories`);

// ── 4. Users ───────────────────────────────────────────────────────────────
const admin = await User.create({
  firstName: 'System', lastName: 'Admin', email: 'admin@hrms.local',
  password: 'Admin@123456', role: 'Admin',
  employeeNumber: 'ADM001', office: 'HQ', unit: 'Administration', position: 'System Administrator',
  department: adminDept._id, designation: desigs[6]._id,
  currentSalary: 3000000, joiningDate: new Date('2020-01-01'), employmentType: 'Full-Time',
  phone: '9800000001', gender: 'Male',
  dateOfBirth: new Date('1980-05-15'), yearsOfExperience: 20,
  education: [{ degree: 'M.Tech CS', institution: 'IIT Delhi', yearOfPassing: 2003, percentage: 88 }],
});

const hr1 = await User.create({
  firstName: 'Priya', lastName: 'Sharma', email: 'hr@hrms.local',
  password: 'Hr@123456', role: 'HR',
  employeeNumber: 'HR001', payCode: 'HR001', cardNo: 'HR001',
  office: 'HQ', unit: 'HR', position: 'HR Manager',
  department: hrDept._id, designation: desigs[2]._id,
  currentSalary: 1100000, joiningDate: new Date('2021-03-15'), employmentType: 'Full-Time',
  phone: '9800000002', gender: 'Female',
  dateOfBirth: new Date('1990-03-15'), yearsOfExperience: 8,
  education: [{ degree: 'MBA HR', institution: 'Delhi University', yearOfPassing: 2015, percentage: 78 }],
});

const hr2 = await User.create({
  firstName: 'Rajesh', lastName: 'Verma', email: 'hr2@hrms.local',
  password: 'Hr@123456', role: 'HR',
  employeeNumber: 'HR002', payCode: 'HR002', cardNo: 'HR002',
  office: 'HQ', unit: 'HR', position: 'HR Executive',
  department: hrDept._id, designation: desigs[3]._id,
  currentSalary: 650000, joiningDate: new Date('2022-07-01'), employmentType: 'Full-Time',
  phone: '9800000003', gender: 'Male',
  dateOfBirth: new Date('1993-08-20'), yearsOfExperience: 4,
});

const emp1 = await User.create({
  firstName: 'Ashok', lastName: 'Kumar Chaturvedi', email: 'ashok@hrms.local',
  password: 'Emp@123456', role: 'Employee',
  employeeNumber: 'EMP001', payCode: 'U-PREP75', cardNo: 'U-PREP75',
  office: 'HQ', unit: 'PREP', project: 'USDMA-PREP', position: 'Consultant',
  department: prepDept._id, designation: desigs[4]._id, reportingTo: hr1._id,
  currentSalary: 950000, joiningDate: new Date('2022-06-01'), employmentType: 'Contractual',
  phone: '9800000004', gender: 'Male',
  dateOfBirth: new Date('1985-07-22'), yearsOfExperience: 12,
  education: [{ degree: 'B.Tech', institution: 'IIT Roorkee', yearOfPassing: 2008, percentage: 75 }],
});

const emp2 = await User.create({
  firstName: 'Sandeep', lastName: 'Pandey', email: 'sandeep@hrms.local',
  password: 'Emp@123456', role: 'Employee',
  employeeNumber: 'EMP002', payCode: 'U-PREP76', cardNo: 'U-PREP76',
  office: 'HQ', unit: 'PREP', project: 'USDMA-PREP', position: 'Senior Consultant',
  department: prepDept._id, designation: desigs[5]._id, reportingTo: hr1._id,
  currentSalary: 1200000, joiningDate: new Date('2021-09-01'), employmentType: 'Contractual',
  phone: '9800000005', gender: 'Male',
  dateOfBirth: new Date('1988-11-05'), yearsOfExperience: 9,
});

const emp3 = await User.create({
  firstName: 'Anjali', lastName: 'Singh', email: 'anjali@hrms.local',
  password: 'Emp@123456', role: 'Employee',
  employeeNumber: 'EMP003', payCode: 'U-PREP77', cardNo: 'U-PREP77',
  office: 'HQ', unit: 'Engineering', position: 'Software Engineer',
  department: eng._id, designation: desigs[0]._id, reportingTo: admin._id,
  currentSalary: 900000, joiningDate: new Date('2023-01-15'), employmentType: 'Full-Time',
  phone: '9800000006', gender: 'Female',
  dateOfBirth: new Date('1995-04-12'), yearsOfExperience: 4,
});

console.log(`✅ 6 users (1 Admin, 2 HR, 3 Employee)`);

// ── 5. Contracts ───────────────────────────────────────────────────────────
const in90 = new Date(); in90.setDate(in90.getDate() + 90);
const in15 = new Date(); in15.setDate(in15.getDate() + 15);
const yest = new Date(); yest.setDate(yest.getDate() - 1);
const in180= new Date(); in180.setDate(in180.getDate() + 180);

await Contract.insertMany([
  { employee: admin._id,  contractDate: new Date('2020-01-01'), startDate: new Date('2020-01-01'), endDate: in180, contractType: 'Full-Time',    notes: 'Permanent admin',       createdBy: admin._id },
  { employee: hr1._id,    contractDate: new Date('2021-03-15'), startDate: new Date('2021-03-15'), endDate: in180, contractType: 'Full-Time',    notes: 'Permanent HR staff',    createdBy: admin._id },
  { employee: emp1._id,   contractDate: new Date('2024-04-01'), startDate: new Date('2024-04-01'), endDate: in90,  contractType: 'Contractual',  notes: 'Annual PREP contract',  createdBy: admin._id },
  { employee: emp2._id,   contractDate: new Date('2023-04-01'), startDate: new Date('2023-04-01'), endDate: in15,  contractType: 'Contractual',  notes: 'Expiring soon!',        createdBy: admin._id },
  { employee: emp3._id,   contractDate: new Date('2023-01-15'), startDate: new Date('2023-01-15'), endDate: yest,  contractType: 'Full-Time',    notes: 'Contract has expired',  createdBy: admin._id },
  { employee: hr2._id,    contractDate: new Date('2022-07-01'), startDate: new Date('2022-07-01'), endDate: in90,  contractType: 'Contractual',  notes: 'HR Executive contract', createdBy: admin._id },
]);
console.log('✅ 6 contracts (2 permanent, 2 active, 1 expiring, 1 expired)');

// ── 6. Leave Balances ──────────────────────────────────────────────────────
const paidCodes = ['CL', 'ML', 'EL', 'PL', 'RL'];
const allUsers  = [admin, hr1, hr2, emp1, emp2, emp3];

for (const user of allUsers) {
  for (const code of paidCodes) {
    const catId = catMap[code];
    const cat   = leaveCats.find(c => c.code === code);
    if (!catId || !cat) continue;
    await LeaveBalance.create({
      user: user._id, leaveCategory: catId, categoryCode: code,
      year: YEAR, openingBalance: 0, allocatedDays: cat.defaultDays,
      totalBalance: cat.defaultDays, usedDays: 0, pendingDays: 0, currentBalance: cat.defaultDays,
    });
  }
}
console.log(`✅ Leave balances initialised for ${allUsers.length} users`);

// ── 7. Project ─────────────────────────────────────────────────────────────
await Project.create({
  name: 'USDMA PREP Project', code: 'USDMA-001',
  description: 'Uttarakhand State Disaster Management Authority Preparedness initiative',
  projectManager: admin._id, department: prepDept._id,
  members: [
    { user: emp1._id, role: 'Consultant' },
    { user: emp2._id, role: 'Senior Consultant' },
    { user: hr2._id,  role: 'HR Support' },
  ],
  startDate: new Date('2024-01-01'), deadline: new Date('2025-12-31'),
  status: 'Active', priority: 'High', completionPercentage: 45,
});
console.log('✅ 1 project with 3 members');

console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                   HRMS — Seed Complete!                         ║
╠══════════════════════════════════════════════════════════════════╣
║  Role     Email                     Password                    ║
║  ──────   ───────────────────────   ────────────                ║
║  Admin    admin@hrms.local           Admin@123456               ║
║  HR       hr@hrms.local              Hr@123456                  ║
║  HR       hr2@hrms.local             Hr@123456                  ║
║  Employee ashok@hrms.local           Emp@123456  (U-PREP75)     ║
║  Employee sandeep@hrms.local         Emp@123456  (U-PREP76)     ║
║  Employee anjali@hrms.local          Emp@123456  (U-PREP77)     ║
╠══════════════════════════════════════════════════════════════════╣
║  Leave Types: CL(12) ML(10) EL(20) PL(15) LWP MAT PAT RL CMP  ║
║  Contracts:   2 Active | 2 Permanent | 1 Expiring | 1 Expired   ║
╚══════════════════════════════════════════════════════════════════╝
`);
process.exit(0);
