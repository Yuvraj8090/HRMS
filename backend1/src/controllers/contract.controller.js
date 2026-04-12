// src/controllers/contract.controller.js
import Contract from '../models/Contract.model.js';
import User     from '../models/User.model.js';
import { AppError } from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getAll = asyncHandler(async (req, res) => {
  const { status, flag, page = 1, limit = 20 } = req.query;
  const f = {};
  if (status) f.status = status;
  if (flag === 'expiring') f.status = 'Expiring';
  if (flag === 'expired')  f.status = 'Expired';
  const skip = (+page-1)*+limit, total = await Contract.countDocuments(f);
  const data = await Contract.find(f)
    .populate('employee', 'firstName lastName email employeeNumber payCode office unit')
    .sort({ endDate: 1 }).skip(skip).limit(+limit);
  res.json({ success: true, total, page: +page, data });
});

export const getFlagged = asyncHandler(async (_req, res) => {
  const [expired, expiring, withContracts] = await Promise.all([
    Contract.countDocuments({ status: 'Expired' }),
    Contract.countDocuments({ status: 'Expiring' }),
    Contract.distinct('employee'),
  ]);
  const allEmp = await User.countDocuments({ isActive: true });
  res.json({ success: true, data: { expired, expiring, noContract: Math.max(0, allEmp - withContracts.length), total: expired + expiring } });
});

export const getByEmployee = asyncHandler(async (req, res) => {
  const data = await Contract.find({ employee: req.params.employeeId }).sort({ createdAt: -1 });
  res.json({ success: true, count: data.length, data });
});

export const getOne = asyncHandler(async (req, res, next) => {
  const c = await Contract.findById(req.params.id).populate('employee', 'firstName lastName email employeeNumber').populate('renewedFrom');
  if (!c) return next(new AppError('Contract not found.', 404));
  res.json({ success: true, data: c });
});

export const create = asyncHandler(async (req, res, next) => {
  if (!await User.findById(req.body.employee)) return next(new AppError('Employee not found.', 404));
  const payload = { ...req.body, createdBy: req.user._id };
  if (req.file) payload.contractDocumentUrl = `/uploads/contracts/${req.file.filename}`;
  const c = await Contract.create(payload);
  res.status(201).json({ success: true, message: 'Contract created.', data: c });
});

export const update = asyncHandler(async (req, res, next) => {
  const c = await Contract.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!c) return next(new AppError('Contract not found.', 404));
  res.json({ success: true, data: c });
});

export const renew = asyncHandler(async (req, res, next) => {
  const old = await Contract.findById(req.params.id);
  if (!old) return next(new AppError('Contract not found.', 404));
  old.isRenewed = true; old.status = 'Renewed'; await old.save();
  const payload = {
    employee: old.employee, contractDate: req.body.contractDate || new Date(),
    startDate: req.body.startDate, endDate: req.body.endDate,
    renewalDate: req.body.renewalDate, contractType: req.body.contractType || old.contractType,
    notes: req.body.notes, renewedFrom: old._id, renewalCount: (old.renewalCount || 0) + 1,
    createdBy: req.user._id,
  };
  if (req.file) payload.renewedContractDocumentUrl = `/uploads/contracts/${req.file.filename}`;
  const c = await Contract.create(payload);
  res.status(201).json({ success: true, message: 'Contract renewed.', data: c });
});

export const uploadDoc = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file uploaded.', 400));
  const c = await Contract.findByIdAndUpdate(req.params.id, { contractDocumentUrl: `/uploads/contracts/${req.file.filename}` }, { new: true });
  if (!c) return next(new AppError('Not found.', 404));
  res.json({ success: true, data: c });
});

export const uploadRenewedDoc = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file uploaded.', 400));
  const c = await Contract.findByIdAndUpdate(req.params.id, { renewedContractDocumentUrl: `/uploads/contracts/${req.file.filename}` }, { new: true });
  if (!c) return next(new AppError('Not found.', 404));
  res.json({ success: true, data: c });
});
