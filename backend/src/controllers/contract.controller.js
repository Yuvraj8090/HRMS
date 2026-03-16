import asyncHandler from '../utils/asyncHandler.js';
import Contract from '../models/Contract.model.js';
import AppError from '../utils/AppError.js';

// 1. Get Flagged/Expiring Contracts
export const getExpiringContracts = asyncHandler(async (req, res, next) => {
  // Find contracts expiring in the next 30 days
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiringContracts = await Contract.find({
    endDate: { $lte: thirtyDaysFromNow },
    status: 'Active'
  }).populate('employee', 'employeeId user');

  res.status(200).json({ success: true, count: expiringContracts.length, data: expiringContracts });
});

// 2. Renew Contract
export const renewContract = asyncHandler(async (req, res, next) => {
  const { id } = req.params; // Old contract ID
  const { newStartDate, newEndDate, renewalDate } = req.body;

  const oldContract = await Contract.findById(id);
  if (!oldContract) return next(new AppError('Contract not found', 404));

  // Mark old as Expired/Renewed
  oldContract.status = 'Expired';
  await oldContract.save();

  // Handle uploaded contract document
  const documentUrl = req.file ? `uploaded_path/contracts/${req.file.originalname}` : null;

  // Create new active contract
  const newContract = await Contract.create({
    employee: oldContract.employee,
    contractDate: new Date(),
    startDate: newStartDate,
    endDate: newEndDate,
    renewalDate: renewalDate,
    documentUrl,
    status: 'Active'
  });

  res.status(201).json({ success: true, data: newContract });
});