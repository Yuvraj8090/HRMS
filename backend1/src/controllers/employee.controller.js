// src/controllers/employee.controller.js
import User          from '../models/User.model.js';
import Contract      from '../models/Contract.model.js';
import LeaveBalance  from '../models/LeaveBalance.model.js';
import { LeaveService } from '../services/leave.service.js';
import { AppError } from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getAll = asyncHandler(async (req, res) => {
  const { search, department, office, unit, status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status === 'inactive') filter.isActive = false;
  else filter.isActive = true;
  if (department) filter.department = department;
  if (office)     filter.office     = new RegExp(office, 'i');
  if (unit)       filter.unit       = new RegExp(unit, 'i');
  if (search) {
    filter.$or = [
      { firstName:      new RegExp(search, 'i') }, { lastName:  new RegExp(search, 'i') },
      { email:          new RegExp(search, 'i') }, { payCode:   new RegExp(search, 'i') },
      { employeeNumber: new RegExp(search, 'i') },
    ];
  }
  const skip  = (Number(page) - 1) * Number(limit);
  const total = await User.countDocuments(filter);
  const data  = await User.find(filter)
    .populate('department', 'name code')
    .populate('designation', 'title level')
    .populate('reportingTo', 'firstName lastName')
    .sort({ firstName: 1 })
    .skip(skip).limit(+limit);
  res.json({ success: true, total, page: +page, pages: Math.ceil(total / +limit), data });
});

export const getOne = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .populate('department', 'name code').populate('designation', 'title level').populate('reportingTo', 'firstName lastName');
  if (!user) return next(new AppError('Employee not found.', 404));
  const year = new Date().getFullYear();
  const [balances, contract] = await Promise.all([
    LeaveBalance.find({ user: req.params.id, year }).populate('leaveCategory', 'code name isPaid'),
    Contract.findOne({ employee: req.params.id, status: { $in: ['Active', 'Expiring'] } }).sort({ createdAt: -1 }),
  ]);
  res.json({ success: true, data: { employee: user, leaveBalances: balances, activeContract: contract } });
});

export const getStats = asyncHandler(async (_req, res) => {
  const [total, active, byRole] = await Promise.all([
    User.countDocuments({ role: { $in: ['Employee', 'HR'] } }),
    User.countDocuments({ role: { $in: ['Employee', 'HR'] }, isActive: true }),
    User.aggregate([
      { $match: { role: { $in: ['Employee', 'HR', 'Admin'] } } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),
  ]);
  const [contracts, expiring, expired] = await Promise.all([
    Contract.countDocuments(),
    Contract.countDocuments({ status: 'Expiring' }),
    Contract.countDocuments({ status: 'Expired' }),
  ]);
  res.json({ success: true, data: { total, active, inactive: total - active, byRole, contracts, expiring, expired } });
});

export const create = asyncHandler(async (req, res, next) => {
  if (await User.findOne({ email: req.body.email })) return next(new AppError('Email already in use.', 409));
  if (req.body.employeeNumber && await User.findOne({ employeeNumber: req.body.employeeNumber }))
    return next(new AppError('Employee number already in use.', 409));
  const user = await User.create({
    ...req.body,
    password: req.body.password || `Hrms@${Math.random().toString(36).slice(-6)}`,
  });
  // Initialise leave balances
  await LeaveService.initBalances(user._id, new Date().getFullYear());
  res.status(201).json({ success: true, message: 'Employee created.', data: user });
});

export const update = asyncHandler(async (req, res, next) => {
  const isSelf = req.params.id === req.user._id.toString();
  let update = req.body;
  if (isSelf && req.user.role === 'Employee') {
    const ok = ['phone', 'dateOfBirth', 'gender', 'address', 'emergencyContact', 'education', 'yearsOfExperience'];
    update = Object.fromEntries(Object.entries(req.body).filter(([k]) => ok.includes(k)));
  }
  const user = await User.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
  if (!user) return next(new AppError('Employee not found.', 404));
  res.json({ success: true, data: user });
});

export const deactivate = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!user) return next(new AppError('Employee not found.', 404));
  res.json({ success: true, message: 'Employee deactivated.' });
});

export const reactivate = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
  if (!user) return next(new AppError('Employee not found.', 404));
  res.json({ success: true, message: 'Employee reactivated.' });
});
