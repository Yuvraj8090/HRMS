// src/routes/employee.routes.js
import { Router } from 'express';
import { getAll, getOne, getStats, create, update, deactivate, reactivate } from '../controllers/employee.controller.js';
import { protect, authorize, selfOrAuthorize } from '../middleware/auth.middleware.js';
const r = Router(); r.use(protect);
r.get('/stats', authorize('Admin', 'HR'), getStats);
r.get('/', authorize('Admin', 'HR'), getAll);
r.post('/', authorize('Admin', 'HR'), create);
r.get('/:id', selfOrAuthorize('Admin', 'HR'), getOne);
r.put('/:id', selfOrAuthorize('Admin', 'HR'), update);
r.put('/:id/deactivate', authorize('Admin'), deactivate);
r.put('/:id/reactivate', authorize('Admin'), reactivate);
export default r;
