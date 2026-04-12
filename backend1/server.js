import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './src/config/db.js';

import authRoutes        from './src/routes/auth.routes.js';
import employeeRoutes    from './src/routes/employee.routes.js';
import departmentRoutes  from './src/routes/department.routes.js';
import designationRoutes from './src/routes/designation.routes.js';
import attendanceRoutes  from './src/routes/attendance.routes.js';
import leaveRoutes       from './src/routes/leave.routes.js';
import contractRoutes    from './src/routes/contract.routes.js';
import projectRoutes     from './src/routes/project.routes.js';
import requestRoutes     from './src/routes/request.routes.js';

dotenv.config();
connectDB();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',         authRoutes);
app.use('/api/employees',    employeeRoutes);
app.use('/api/departments',  departmentRoutes);
app.use('/api/designations', designationRoutes);
app.use('/api/attendance',   attendanceRoutes);
app.use('/api/leaves',       leaveRoutes);
app.use('/api/contracts',    contractRoutes);
app.use('/api/projects',     projectRoutes);
app.use('/api/requests',     requestRoutes);

app.get('/api/health', (_req, res) => res.json({ success: true, message: 'HRMS API v1 running', time: new Date() }));
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

app.use((err, _req, res, _next) => {
  let { statusCode = 500, message = 'Internal Server Error' } = err;
  if (err.name === 'CastError')         { statusCode = 400; message = `Invalid ID: ${err.value}`; }
  if (err.code === 11000)               { statusCode = 400; message = `Duplicate value: ${Object.keys(err.keyValue || {}).join(', ')}`; }
  if (err.name === 'ValidationError')   { statusCode = 400; message = Object.values(err.errors || {}).map(e => e.message).join(', '); }
  if (err.name === 'JsonWebTokenError') { statusCode = 401; message = 'Invalid token.'; }
  if (err.name === 'TokenExpiredError') { statusCode = 401; message = 'Session expired. Please log in again.'; }
  if (process.env.NODE_ENV === 'development') console.error('[ERROR]', err.stack);
  res.status(statusCode).json({ success: false, message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`\n🚀 HRMS running on port ${PORT} [${process.env.NODE_ENV}]`));
export default app;
