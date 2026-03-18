import { Router } from 'express';
import { getExpiringContracts, renewContract, createNewContract } from '../controllers/contract.controller.js';
import { authMiddleware, checkRole } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

router.use(authMiddleware);
router.use(checkRole(['Admin', 'HR']));

router.get('/expiring', getExpiringContracts);

// Create a brand new contract for a fresh employee
router.post('/', upload.single('contractDoc'), createNewContract);

// Renew an existing contract
router.post('/:id/renew', upload.single('contractDoc'), renewContract);

export default router;