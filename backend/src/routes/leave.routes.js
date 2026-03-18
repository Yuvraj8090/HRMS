/**
 * src/routes/leave.routes.js
 */
import { Router } from 'express';
import { 
  applyForLeave, 
  processLeave,
  getPendingLeaves,
  getMyBalances,
  getMyRequests,
  getCategories
} from '../controllers/leave.controller.js';
import { authMiddleware, checkRole } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

// Secure all leave routes
router.use(authMiddleware);

// ── Shared Routes ──────────────────────────────────────────────────────────
router.get('/categories', getCategories);

// ── Employee Routes ────────────────────────────────────────────────────────
router.get('/my-balances', getMyBalances);
router.get('/my-requests', getMyRequests);
router.post('/apply', upload.single('leaveLetter'), applyForLeave);

// ── HR / Admin Routes ──────────────────────────────────────────────────────
router.get('/pending', checkRole(['Admin', 'HR']), getPendingLeaves);

// HR processes the leave (Approve/Reject) and uploads the signed approval doc
router.put(
  '/:id/process', 
  checkRole(['Admin', 'HR']), 
  upload.single('approvalDoc'), 
  processLeave
);

export default router;