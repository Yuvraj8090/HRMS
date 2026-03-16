/**
 * src/routes/attendance.routes.js
 */
import { Router } from 'express';
import {
  clockIn,
  clockOut,
  getTodayStatus,
  getAttendanceHistory,
  getDailyOverview,
  importAttendanceExcel, // <-- New controller imported
} from '../controllers/attendance.controller.js';
import { authMiddleware, checkRole } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js'; // <-- Multer middleware for file parsing

const router = Router();

// Secure all attendance routes
router.use(authMiddleware);

// Employee Routes
router.post('/clock-in', clockIn);
router.put('/clock-out', clockOut);
router.get('/today', getTodayStatus);
router.get('/history', getAttendanceHistory);

// Admin / HR Routes
router.get('/overview', checkRole(['Admin', 'HR']), getDailyOverview);
router.get('/history/:userId', checkRole(['Admin', 'HR']), getAttendanceHistory);

// New Excel Import Route
// We enforce HR/Admin roles and use Multer to process the single 'file' upload in memory
router.post('/import', checkRole(['Admin', 'HR']), upload.single('file'), importAttendanceExcel);

export default router;