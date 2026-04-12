// src/controllers/request.controller.js
import Request from '../models/Request.model.js';
import User    from '../models/User.model.js';
import { AppError } from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const submitIncrement = asyncHandler(async (req, res, next) => {
  const { requestedSalary, requestedPercentage, requestNotes } = req.body;
  if (!requestedSalary && !requestedPercentage) return next(new AppError('Provide requested salary or percentage.', 400));
  if (await Request.findOne({ requestedBy: req.user._id, type: 'Increment', status: { $in: ['Pending','Under Review'] } }))
    return next(new AppError('You already have a pending increment request.', 409));
  const user = await User.findById(req.user._id).select('currentSalary');
  const sal  = requestedSalary ?? Math.round((user.currentSalary || 0) * (1 + requestedPercentage / 100));
  const r    = await Request.create({ type:'Increment', requestedBy:req.user._id, requestNotes, increment:{ currentSalary:user.currentSalary||0, requestedSalary:sal, requestedPercentage:requestedPercentage||null } });
  res.status(201).json({ success:true, message:'Increment request submitted.', data:r });
});

export const getPending = asyncHandler(async (req, res) => {
  const f = { status: { $in: ['Pending','Under Review'] } };
  if (req.query.type) f.type = req.query.type;
  const skip=(+(req.query.page||1)-1)*+(req.query.limit||20);
  const total = await Request.countDocuments(f);
  const data  = await Request.find(f)
    .populate('requestedBy','firstName lastName email role currentSalary employeeNumber')
    .sort({ createdAt: -1 }).skip(skip).limit(+(req.query.limit||20));
  res.json({ success:true, total, data });
});

export const getMy = asyncHandler(async (req, res) => {
  const f = { requestedBy: req.user._id };
  if (req.query.type)   f.type   = req.query.type;
  if (req.query.status) f.status = req.query.status;
  const data = await Request.find(f).populate('actionedBy','firstName lastName').sort({ createdAt:-1 });
  res.json({ success:true, count:data.length, data });
});

export const updateStatus = asyncHandler(async (req, res, next) => {
  const { status, decisionNotes, approvedSalary } = req.body;
  if (!['Approved','Rejected','Under Review'].includes(status)) return next(new AppError('Invalid status.',400));
  const r = await Request.findById(req.params.id);
  if (!r) return next(new AppError('Request not found.',404));
  if (['Approved','Rejected'].includes(r.status)) return next(new AppError(`Already ${r.status}.`,409));
  r.status = status; r.actionedBy = req.user._id; r.decisionNotes = decisionNotes || r.decisionNotes;
  if (['Approved','Rejected'].includes(status)) r.decidedAt = new Date();
  if (r.type==='Increment' && status==='Approved') {
    const fin = approvedSalary ?? r.increment.requestedSalary;
    r.increment.approvedSalary = fin;
    await User.findByIdAndUpdate(r.requestedBy, { currentSalary: fin });
  }
  await r.save();
  res.json({ success:true, message:`Request ${status.toLowerCase()}.`, data:r });
});

export const createAppraisal = asyncHandler(async (req, res, next) => {
  const { employeeId, reviewFrom, reviewTo, requestNotes } = req.body;
  if (await Request.findOne({ requestedBy:employeeId, type:'Appraisal', status:{$in:['Pending','Under Review']} }))
    return next(new AppError('Employee already has an active appraisal.',409));
  const r = await Request.create({ type:'Appraisal', requestedBy:employeeId, requestNotes, appraisal:{ reviewPeriod:{from:reviewFrom,to:reviewTo} } });
  res.status(201).json({ success:true, data:r });
});
