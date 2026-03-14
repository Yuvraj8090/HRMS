/**
 * src/routes/employee.routes.js
 */
import { Router } from 'express';
import {
  getAllEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
} from '../controllers/employee.controller.js';
import { authMiddleware, checkRole, checkSelfOrRole } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authMiddleware);

router.get  ('/',    checkRole(['Admin', 'HR']),   getAllEmployees);
router.post ('/',    checkRole(['Admin', 'HR']),   createEmployee);
router.get  ('/:id', checkSelfOrRole(['Admin', 'HR']), getEmployee);
router.put  ('/:id', checkSelfOrRole(['Admin', 'HR']), updateEmployee);
router.delete('/:id', checkRole(['Admin']),           deactivateEmployee);

export default router;
