import { Router } from 'express';
import {
  getAllEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  importAllEmployeesExcel,
} from '../controllers/employee.controller.js';
import { authMiddleware, checkRole, checkSelfOrRole } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';


const router = Router();
router.use(authMiddleware);

// 1. STATIC ROUTES FIRST
router.get('/', checkRole(['Admin', 'HR']), getAllEmployees);

// THIS MUST BE ABOVE /:id
router.post('/import-all', 
  checkRole(['Admin', 'HR']), 
  upload.single('file'), 
  importAllEmployeesExcel
);

router.post('/', checkRole(['Admin', 'HR']), createEmployee);

// 2. DYNAMIC ROUTES LAST
router.get('/:id', checkSelfOrRole(['Admin', 'HR']), getEmployee);
router.put('/:id', checkSelfOrRole(['Admin', 'HR']), updateEmployee);
router.delete('/:id', checkRole(['Admin']), deactivateEmployee);

export default router;