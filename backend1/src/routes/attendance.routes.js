// src/routes/attendance.routes.js
import { Router } from 'express';
import { clockIn, clockOut, getToday, getMyHistory, getUserHistory, getDailyOverview, getMonthlyReport, importExcel } from '../controllers/attendance.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { uploadAttendance } from '../middleware/upload.middleware.js';
const r = Router(); r.use(protect);
r.post('/clock-in', clockIn);
r.put('/clock-out', clockOut);
r.get('/today', getToday);
r.get('/my-history', getMyHistory);
r.get('/overview', authorize('Admin','HR'), getDailyOverview);
r.get('/monthly', authorize('Admin','HR'), getMonthlyReport);
r.get('/user/:userId', authorize('Admin','HR'), getUserHistory);
r.post('/import', authorize('Admin','HR'), uploadAttendance.single('file'), importExcel);
export default r;
