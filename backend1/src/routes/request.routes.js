// src/routes/request.routes.js
import { Router } from 'express';
import { submitIncrement, getPending, getMy, updateStatus, createAppraisal } from '../controllers/request.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
const r = Router(); r.use(protect);
r.post('/increment', submitIncrement);
r.post('/appraisal', authorize('Admin', 'HR'), createAppraisal);
r.get('/pending', authorize('Admin', 'HR'), getPending);
r.get('/my', getMy);
r.put('/:id/status', authorize('Admin', 'HR'), updateStatus);
export default r;
