// src/routes/leave.routes.js
import { Router } from 'express';
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  getMyBalance, getUserBalance, getAllBalances, setAllocation, bulkSetAllocation,
  apply, uploadLeaveLetter, getMyLeaves, cancel,
  getAllLeaves, getLeaveById, recommend, action, uploadApprovedDoc, getStats,
} from '../controllers/leave.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { uploadLeaveLetter as multerLetter, uploadLeaveApproval } from '../middleware/upload.middleware.js';

const r = Router(); r.use(protect);

// ── Categories (Admin/HR manage) ─────────────────────────────────────────────
r.get('/categories', getCategories);
r.post('/categories', authorize('Admin', 'HR'), createCategory);
r.put('/categories/:id', authorize('Admin', 'HR'), updateCategory);
r.delete('/categories/:id', authorize('Admin'), deleteCategory);

// ── Balances ─────────────────────────────────────────────────────────────────
r.get('/balance/all', authorize('Admin', 'HR'), getAllBalances);
r.get('/balance/me', getMyBalance);
r.get('/balance/:userId', authorize('Admin', 'HR'), getUserBalance);
r.post('/balance/set', authorize('Admin', 'HR'), setAllocation);
r.post('/balance/bulk', authorize('Admin', 'HR'), bulkSetAllocation);

// ── Stats ─────────────────────────────────────────────────────────────────────
r.get('/stats', authorize('Admin', 'HR'), getStats);

// ── Applications ─────────────────────────────────────────────────────────────
// ALL roles can apply (Employee, HR, Admin)
r.post('/', multerLetter.single('leaveLetter'), apply);
r.get('/my', getMyLeaves);
r.put('/:id/cancel', cancel);
r.put('/:id/upload-letter', multerLetter.single('leaveLetter'), uploadLeaveLetter);

// HR/Admin view all
r.get('/', authorize('Admin', 'HR'), getAllLeaves);
r.get('/:id', getLeaveById);

// HR recommends (Employee leaves only)
r.put('/:id/recommend', authorize('HR'), recommend);

// Admin final decision (all leaves — HR, Admin, and recommended Employee)
r.put('/:id/action', authorize('Admin'), uploadLeaveApproval.single('approvedDocument'), action);
r.put('/:id/upload-approved', authorize('Admin', 'HR'), uploadLeaveApproval.single('approvedDocument'), uploadApprovedDoc);

export default r;
