import { Router } from 'express';
import {
  getAllEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus, // <-- NEW: Imported the smart toggle function
  importAllEmployeesExcel,
} from '../controllers/employee.controller.js';
import { authMiddleware, checkRole, checkSelfOrRole } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

// Apply authentication middleware to all routes in this file
router.use(authMiddleware);

// ── 1. STATIC ROUTES FIRST ───────────────────────────────────────────────────
router.get('/', checkRole(['Admin', 'HR']), getAllEmployees);

// THIS MUST BE ABOVE /:id to prevent Express from treating "import-all" as an ID
router.post(
  '/import-all', 
  checkRole(['Admin', 'HR']), 
  upload.single('file'), 
  importAllEmployeesExcel
);

router.post('/', checkRole(['Admin', 'HR']), createEmployee);


// ── 2. DYNAMIC ROUTES LAST ───────────────────────────────────────────────────
router.get('/:id', checkSelfOrRole(['Admin', 'HR']), getEmployee);
router.put('/:id', checkSelfOrRole(['Admin', 'HR']), updateEmployee);

// Wired the existing DELETE route to the new toggle logic so the frontend doesn't break
router.delete('/:id', checkRole(['Admin']), toggleEmployeeStatus);

export default router;