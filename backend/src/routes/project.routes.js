/**
 * src/routes/project.routes.js
 */
import { Router } from 'express';
import {
  getAllProjects,
  getProject,
  createProject,
  updateProject,
  assignMembers,
  removeMember,
  deleteProject,
} from '../controllers/project.controller.js';
import { authMiddleware, checkRole } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authMiddleware);

router.get  ('/',    getAllProjects);
router.post ('/',    checkRole(['Admin', 'HR']), createProject);
router.get  ('/:id', getProject);
router.put  ('/:id', checkRole(['Admin', 'HR']), updateProject);
router.post ('/:id/members',          checkRole(['Admin', 'HR']), assignMembers);
router.delete('/:id/members/:userId', checkRole(['Admin', 'HR']), removeMember);
router.delete('/:id',                 checkRole(['Admin']),        deleteProject);

export default router;
