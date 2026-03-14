/**
 * src/controllers/request.controller.js
 *
 * Handles the Increment Approval workflow (Phase 1 focus) + Appraisal creation.
 *
 * Endpoints:
 *  POST   /api/requests/increment          — Employee submits an increment request
 *  POST   /api/requests/appraisal          — HR/Admin creates an appraisal request
 *  GET    /api/requests/pending            — HR/Admin views all pending requests
 *  GET    /api/requests/my                 — Employee views own requests
 *  GET    /api/requests/:id                — Get single request detail
 *  PUT    /api/requests/:id/status         — HR/Admin approves or rejects
 *  PUT    /api/requests/:id/stage/:stageId — HR/Admin updates an appraisal stage
 */

import Request         from '../models/Request.model.js';
import EmployeeProfile from '../models/EmployeeProfile.model.js';
import asyncHandler    from '../utils/asyncHandler.js';
import AppError        from '../utils/AppError.js';

// ── 1. Submit an Increment Request ────────────────────────────────────────────
// @route   POST /api/requests/increment
// @access  Employee
export const submitIncrementRequest = asyncHandler(async (req, res, next) => {
  const { requestedSalary, requestedPercentage, requestNotes } = req.body;

  // Validate: at least one of salary or percentage must be provided
  if (!requestedSalary && !requestedPercentage) {
    return next(new AppError('Please provide either a requested salary or percentage increase.', 400));
  }

  // Fetch current salary from the employee's profile
  const profile = await EmployeeProfile.findOne({ user: req.user._id });
  if (!profile) {
    return next(new AppError('Employee profile not found. Please contact HR.', 404));
  }

  // Guard: don't allow a second pending request
  const existingPending = await Request.findOne({
    requestedBy: req.user._id,
    type:        'Increment',
    status:      { $in: ['Pending', 'Under Review'] },
  });

  if (existingPending) {
    return next(
      new AppError('You already have a pending increment request. Please wait for a decision.', 409)
    );
  }

  // Compute requestedSalary from percentage if not explicitly given
  const computedRequestedSalary =
    requestedSalary ??
    Math.round(profile.currentSalary * (1 + requestedPercentage / 100));

  const request = await Request.create({
    type:         'Increment',
    requestedBy:  req.user._id,
    status:       'Pending',
    requestNotes,
    increment: {
      currentSalary:       profile.currentSalary,
      requestedSalary:     computedRequestedSalary,
      requestedPercentage: requestedPercentage ?? null,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Increment request submitted successfully.',
    data:    request,
  });
});

// ── 2. Get All Pending Requests ────────────────────────────────────────────────
// @route   GET /api/requests/pending
// @access  HR, Admin
export const getPendingRequests = asyncHandler(async (req, res) => {
  const { type, page = 1, limit = 20 } = req.query;

  const filter = { status: { $in: ['Pending', 'Under Review'] } };
  if (type && ['Increment', 'Appraisal'].includes(type)) {
    filter.type = type;
  }

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Request.countDocuments(filter);

  const requests = await Request.find(filter)
    .populate({
      path:   'requestedBy',
      select: 'firstName lastName email role',
      populate: {
        path:   'profile',
        select: 'employeeId department designation currentSalary',
        populate: [
          { path: 'department',  select: 'name' },
          { path: 'designation', select: 'title' },
        ],
      },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    total,
    page:  Number(page),
    pages: Math.ceil(total / Number(limit)),
    data:  requests,
  });
});

// ── 3. Get My Requests (Employee) ─────────────────────────────────────────────
// @route   GET /api/requests/my
// @access  Employee (own), HR/Admin (any)
export const getMyRequests = asyncHandler(async (req, res) => {
  const { type, status } = req.query;

  const filter = { requestedBy: req.user._id };
  if (type)   filter.type   = type;
  if (status) filter.status = status;

  const requests = await Request.find(filter)
    .populate('actionedBy', 'firstName lastName role')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: requests.length, data: requests });
});

// ── 4. Get Single Request ──────────────────────────────────────────────────────
// @route   GET /api/requests/:id
// @access  Owner | HR | Admin
export const getRequestById = asyncHandler(async (req, res, next) => {
  const request = await Request.findById(req.params.id)
    .populate('requestedBy', 'firstName lastName email')
    .populate('actionedBy',  'firstName lastName role')
    .populate('appraisal.reviewStages.reviewer', 'firstName lastName');

  if (!request) {
    return next(new AppError('Request not found.', 404));
  }

  // Employees can only see their own requests
  const isOwner = request.requestedBy._id.toString() === req.user._id.toString();
  if (req.user.role === 'Employee' && !isOwner) {
    return next(new AppError('Access denied.', 403));
  }

  res.status(200).json({ success: true, data: request });
});

// ── 5. Approve or Reject a Request ────────────────────────────────────────────
// @route   PUT /api/requests/:id/status
// @access  HR, Admin
export const updateRequestStatus = asyncHandler(async (req, res, next) => {
  const { status, decisionNotes, approvedSalary } = req.body;

  // Validate status transition
  const allowedTransitions = ['Approved', 'Rejected', 'Under Review'];
  if (!allowedTransitions.includes(status)) {
    return next(new AppError(`Status must be one of: ${allowedTransitions.join(', ')}.`, 400));
  }

  const request = await Request.findById(req.params.id);
  if (!request) {
    return next(new AppError('Request not found.', 404));
  }

  // Guard: cannot re-action a finalised request
  if (['Approved', 'Rejected'].includes(request.status)) {
    return next(new AppError(`This request has already been ${request.status.toLowerCase()}.`, 409));
  }

  // Apply changes
  request.status        = status;
  request.actionedBy    = req.user._id;
  request.decisionNotes = decisionNotes ?? request.decisionNotes;

  if (status === 'Approved' || status === 'Rejected') {
    request.decidedAt = new Date();
  }

  // ── Increment: update employee salary on approval ──────────────────────────
  if (request.type === 'Increment' && status === 'Approved') {
    const finalSalary = approvedSalary ?? request.increment.requestedSalary;

    if (!finalSalary) {
      return next(new AppError('Please provide the approved salary amount.', 400));
    }

    request.increment.approvedSalary = finalSalary;

    // Update the employee's current salary in their profile
    await EmployeeProfile.findOneAndUpdate(
      { user: request.requestedBy },
      { currentSalary: finalSalary },
      { new: true }
    );
  }

  await request.save();

  res.status(200).json({
    success: true,
    message: `Request has been ${status.toLowerCase()}.`,
    data:    request,
  });
});

// ── 6. Create an Appraisal Request ────────────────────────────────────────────
// @route   POST /api/requests/appraisal
// @access  HR, Admin
export const createAppraisalRequest = asyncHandler(async (req, res, next) => {
  const { employeeId, reviewFrom, reviewTo, requestNotes } = req.body;

  // Check for existing open appraisal for this employee
  const existing = await Request.findOne({
    requestedBy: employeeId,
    type:        'Appraisal',
    status:      { $in: ['Pending', 'Under Review'] },
  });

  if (existing) {
    return next(new AppError('This employee already has an active appraisal in progress.', 409));
  }

  const appraisalStages = [
    'Self Review',
    'Peer Review',
    'Manager Review',
    'HR Review',
    'Final Decision',
  ].map((stage) => ({ stage, isComplete: false }));

  const request = await Request.create({
    type:        'Appraisal',
    requestedBy: employeeId,
    status:      'Pending',
    requestNotes,
    appraisal: {
      reviewPeriod:  { from: reviewFrom, to: reviewTo },
      reviewStages:  appraisalStages,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Appraisal request created.',
    data:    request,
  });
});

// ── 7. Update an Appraisal Stage ──────────────────────────────────────────────
// @route   PUT /api/requests/:id/stage/:stageId
// @access  HR, Admin (or assigned reviewer)
export const updateAppraisalStage = asyncHandler(async (req, res, next) => {
  const { rating, comments } = req.body;

  const request = await Request.findById(req.params.id);
  if (!request || request.type !== 'Appraisal') {
    return next(new AppError('Appraisal request not found.', 404));
  }

  const stage = request.appraisal.reviewStages.id(req.params.stageId);
  if (!stage) {
    return next(new AppError('Review stage not found.', 404));
  }

  stage.rating      = rating ?? stage.rating;
  stage.comments    = comments ?? stage.comments;
  stage.reviewer    = req.user._id;
  stage.isComplete  = true;
  stage.completedAt = new Date();

  // Calculate overall rating when all stages are complete
  const allComplete = request.appraisal.reviewStages.every((s) => s.isComplete);
  if (allComplete) {
    const ratings  = request.appraisal.reviewStages
      .filter((s) => s.rating)
      .map((s) => s.rating);
    const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    request.appraisal.overallRating = parseFloat(avgRating.toFixed(2));
    request.status = 'Under Review';
  }

  await request.save();

  res.status(200).json({
    success: true,
    message: 'Appraisal stage updated.',
    data:    request,
  });
});
