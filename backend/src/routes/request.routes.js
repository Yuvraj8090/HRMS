/**
 * src/routes/request.routes.js
 *
 * All request-related endpoints with proper RBAC middleware guards.
 */

import { Router } from 'express';
import {
  submitIncrementRequest,
  createAppraisalRequest,
  getPendingRequests,
  getMyRequests,
  getRequestById,
  updateRequestStatus,
  updateAppraisalStage,
} from '../controllers/request.controller.js';
import { authMiddleware, checkRole } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require a valid JWT
router.use(authMiddleware);

// ── Increment ──────────────────────────────────────────────────────────────────
// POST   /api/requests/increment    — Employee submits increment request
router.post('/increment', checkRole(['Employee']), submitIncrementRequest);

// ── Appraisal ─────────────────────────────────────────────────────────────────
// POST   /api/requests/appraisal    — HR/Admin initiates appraisal
router.post('/appraisal', checkRole(['Admin', 'HR']), createAppraisalRequest);

// ── Views ──────────────────────────────────────────────────────────────────────
// GET    /api/requests/pending      — HR/Admin sees all pending requests
router.get('/pending',  checkRole(['Admin', 'HR']),  getPendingRequests);

// GET    /api/requests/my           — Employee sees own requests
router.get('/my',       checkRole(['Employee', 'HR', 'Admin']), getMyRequests);

// GET    /api/requests/:id          — Owner | HR | Admin views single request
router.get('/:id',      getRequestById);

// ── Actions ────────────────────────────────────────────────────────────────────
// PUT    /api/requests/:id/status   — HR/Admin approves or rejects
router.put('/:id/status', checkRole(['Admin', 'HR']), updateRequestStatus);

// PUT    /api/requests/:id/stage/:stageId  — Update appraisal review stage
router.put('/:id/stage/:stageId', checkRole(['Admin', 'HR']), updateAppraisalStage);

export default router;
