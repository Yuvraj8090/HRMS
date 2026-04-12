// src/middleware/upload.middleware.js
import multer from 'multer';
import path   from 'path';
import { AppError } from '../utils/AppError.js';

const storage = folder => multer.diskStorage({
  destination: (_q, _f, cb) => cb(null, `uploads/${folder}`),
  filename:    (_q,  f, cb) => cb(null, `${folder}-${Date.now()}-${Math.random().toString(36).slice(2,8)}${path.extname(f.originalname).toLowerCase()}`),
});

const docFilter  = (_q, f, cb) => ['.pdf','.doc','.docx','.jpg','.jpeg','.png'].includes(path.extname(f.originalname).toLowerCase()) ? cb(null, true) : cb(new AppError('Only PDF, DOC, DOCX, JPG, PNG allowed.', 400), false);
const xlsFilter  = (_q, f, cb) => ['.xls','.xlsx','.csv'].includes(path.extname(f.originalname).toLowerCase())                        ? cb(null, true) : cb(new AppError('Only XLS, XLSX, CSV allowed.', 400),      false);

export const uploadContract     = multer({ storage: storage('contracts'),      fileFilter: docFilter, limits: { fileSize: 10 * 1024 * 1024 } });
export const uploadLeaveLetter  = multer({ storage: storage('leave-letters'),  fileFilter: docFilter, limits: { fileSize: 5  * 1024 * 1024 } });
export const uploadLeaveApproval= multer({ storage: storage('leave-approvals'),fileFilter: docFilter, limits: { fileSize: 5  * 1024 * 1024 } });
export const uploadAttendance   = multer({ storage: multer.memoryStorage(),    fileFilter: xlsFilter, limits: { fileSize: 10 * 1024 * 1024 } });
