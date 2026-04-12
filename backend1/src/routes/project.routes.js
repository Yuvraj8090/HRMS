// src/routes/project.routes.js
import { Router } from 'express';
import { getAll, getOne, create, update, addMembers, removeMember, archive } from '../controllers/project.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
const r = Router(); r.use(protect);
r.get('/', getAll);
r.post('/', authorize('Admin', 'HR'), create);
r.get('/:id', getOne);
r.put('/:id', authorize('Admin', 'HR'), update);
r.post('/:id/members', authorize('Admin', 'HR'), addMembers);
r.delete('/:id/members/:userId', authorize('Admin', 'HR'), removeMember);
r.delete('/:id', authorize('Admin'), archive);
export default r;
