/**
 * src/routes/leave.routes.js
 */
import { Router } from 'express';
import { applyForLeave, processLeave } from '../controllers/leave.controller.js';
import { authMiddleware, checkRole } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

// Secure all leave routes
router.use(authMiddleware);

// ── Employee Routes ────────────────────────────────────────────────────────
// Employee applies for leave (uploads leave letter/form)
router.post('/apply', upload.single('leaveLetter'), applyForLeave);

// ── HR / Admin Routes ──────────────────────────────────────────────────────
// HR processes the leave (Approve/Reject) and uploads the signed approval doc
router.put(
  '/:id/process', 
  checkRole(['Admin', 'HR']), 
  upload.single('approvalDoc'), 
  processLeave
);

export default router;