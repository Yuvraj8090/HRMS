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
  }).populate({
    path: 'employee',
    select: 'employeeId user', // Select the fields you need from EmployeeProfile
    populate: {
      path: 'user', // Now populate the 'user' field INSIDE the EmployeeProfile
      select: 'firstName lastName email' // Select the name and email from the User model
    }
  });

  res.status(200).json({ 
    success: true, 
    count: expiringContracts.length, 
    data: expiringContracts 
  });
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
// 3. Create NEW Contract (For Fresh Employees)
export const createNewContract = asyncHandler(async (req, res, next) => {
  const { employeeId, startDate, endDate } = req.body;

  if (!employeeId || !startDate || !endDate) {
    return next(new AppError('Employee ID, Start Date, and End Date are required.', 400));
  }

  // Check if the employee already has an Active contract
  const existingContract = await Contract.findOne({ 
    employee: employeeId, 
    status: 'Active' 
  });

  if (existingContract) {
    return next(new AppError('This employee already has an Active contract. Please renew it instead.', 409));
  }

  // Handle uploaded contract document
  const documentUrl = req.file ? `uploaded_path/contracts/${req.file.originalname}` : null;

  const newContract = await Contract.create({
    employee: employeeId,
    contractDate: new Date(),
    startDate: startDate,
    endDate: endDate,
    documentUrl,
    status: 'Active'
  });

  res.status(201).json({ success: true, data: newContract });
});