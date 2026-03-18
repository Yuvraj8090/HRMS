/**
 * src/routes/attendance.routes.js
 */
import { Router } from 'express';
import {
  // ── Daily Attendance Logic ──
  clockIn,
  clockOut,
  getTodayStatus,
  getAttendanceHistory,
  getDailyOverview,
  
  // ── Monthly Summary Logic (New) ──
  importAttendanceExcel,
  getAllSummaries,
  getMySummaries
} from '../controllers/attendance.controller.js';

import { authMiddleware, checkRole } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js'; // Multer middleware for file parsing

const router = Router();

// Secure all attendance routes
router.use(authMiddleware);

// ══════════════════════════════════════════════════════════════════════════
// 1. MONTHLY SUMMARY ROUTES (For Payroll & Excel Uploads)
// ══════════════════════════════════════════════════════════════════════════

// HR/Admin: Import the monthly Excel sheet (Uses Multer to process single 'file' upload)
router.post('/import', checkRole(['Admin', 'HR']), upload.single('file'), importAttendanceExcel);

// HR/Admin: View all aggregated monthly summaries
router.get('/summaries', checkRole(['Admin', 'HR']), getAllSummaries);

// Employee: View their own past monthly summaries
router.get('/my-summaries', getMySummaries);


// ══════════════════════════════════════════════════════════════════════════
// 2. DAILY ATTENDANCE ROUTES (For Portal Clock-in/out)
// ══════════════════════════════════════════════════════════════════════════

// Employee Routes
router.post('/clock-in', clockIn);
router.put('/clock-out', clockOut);
router.get('/today', getTodayStatus);
router.get('/history', getAttendanceHistory);

// Admin / HR Routes
router.get('/overview', checkRole(['Admin', 'HR']), getDailyOverview);
router.get('/history/:userId', checkRole(['Admin', 'HR']), getAttendanceHistory);

export default router;