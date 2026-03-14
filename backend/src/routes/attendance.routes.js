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
} from '../controllers/attendance.controller.js';
import { authMiddleware, checkRole } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authMiddleware);

router.post('/clock-in',          clockIn);
router.put ('/clock-out',         clockOut);
router.get ('/today',             getTodayStatus);
router.get ('/overview',          checkRole(['Admin', 'HR']), getDailyOverview);
router.get ('/history',           getAttendanceHistory);
router.get ('/history/:userId',   checkRole(['Admin', 'HR']), getAttendanceHistory);

export default router;
