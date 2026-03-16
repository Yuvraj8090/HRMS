/**
 * src/routes/contract.routes.js
 */
import { Router } from 'express';
import { getExpiringContracts, renewContract } from '../controllers/contract.controller.js';
import { authMiddleware, checkRole } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

// Secure all contract routes - Only HR and Admin should manage contracts
router.use(authMiddleware);
router.use(checkRole(['Admin', 'HR']));

// Get employees whose contracts are expiring soon
router.get('/expiring', getExpiringContracts);

// Renew a contract (requires the old contract ID in params, and the new PDF/Word doc upload)
router.post('/:id/renew', upload.single('contractDoc'), renewContract);

export default router;