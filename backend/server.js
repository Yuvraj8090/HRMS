/**
 * HRMS Backend — Main Server Entry Point
 * Production-ready Express + MongoDB server
 */

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectDB } from './src/config/db.js';

// ── Route Imports ──────────────────────────────────────────────────────────────
import authRoutes        from './src/routes/auth.routes.js';
import employeeRoutes    from './src/routes/employee.routes.js';
import departmentRoutes  from './src/routes/department.routes.js';
import designationRoutes from './src/routes/designation.routes.js';
import attendanceRoutes  from './src/routes/attendance.routes.js';
import projectRoutes     from './src/routes/project.routes.js';
import requestRoutes     from './src/routes/request.routes.js';

// Fixed import paths for the new modules
import contractRoutes    from './src/routes/contract.routes.js';
import leaveRoutes       from './src/routes/leave.routes.js';

// ── Config ─────────────────────────────────────────────────────────────────────
dotenv.config();
const app = express();
connectDB();

// ── Global Middleware ──────────────────────────────────────────────────────────

// Security headers
app.use(helmet());

// CORS — allow our React frontend
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logger (dev only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Global rate limiter — 100 requests per 15 minutes
const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS), // Fallback added to prevent NaN errors
  max: Number(process.env.RATE_LIMIT_MAX),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', globalLimiter);

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/employees',    employeeRoutes);
app.use('/api/departments',  departmentRoutes);
app.use('/api/designations', designationRoutes);
app.use('/api/attendance',   attendanceRoutes);
app.use('/api/projects',     projectRoutes);
app.use('/api/requests',     requestRoutes);

// Mounted the new route handlers
app.use('/api/contracts',    contractRoutes);
app.use('/api/leaves',       leaveRoutes);

// ── Health Check ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'HRMS API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── 404 Handler ────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ── Global Error Handler ───────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message    = err.message    || 'Internal Server Error';

  // Mongoose CastError (bad ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid resource ID format.' });
  }

  // Mongoose Duplicate Key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ success: false, message: `Duplicate value for field: ${field}.` });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: errors.join(', ') });
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error Stack:', err.stack);
  }

  res.status(statusCode).json({ success: false, message });
});

// ── Boot ───────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 HRMS Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

export default app;