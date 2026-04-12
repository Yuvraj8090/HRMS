// src/routes/auth.routes.js
import { Router } from 'express';
import { register, login, getMe, updateMe, changePassword } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
const r = Router();
r.post('/register', register);
r.post('/login', login);
r.get('/me', protect, getMe);
r.put('/me', protect, updateMe);
r.put('/change-password', protect, changePassword);
export default r;
