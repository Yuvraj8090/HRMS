// src/routes/contract.routes.js
import { Router } from 'express';
import { getAll, getFlagged, getByEmployee, getOne, create, update, renew, uploadDoc, uploadRenewedDoc } from '../controllers/contract.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { uploadContract } from '../middleware/upload.middleware.js';
const r = Router(); r.use(protect, authorize('Admin', 'HR'));
r.get('/flagged', getFlagged);
r.get('/', getAll);
r.get('/employee/:employeeId', getByEmployee);
r.get('/:id', getOne);
r.post('/', uploadContract.single('contractDocument'), create);
r.put('/:id', update);
r.post('/:id/renew', uploadContract.single('renewedContractDocument'), renew);
r.put('/:id/upload-doc', uploadContract.single('contractDocument'), uploadDoc);
r.put('/:id/upload-renewed', uploadContract.single('renewedContractDocument'), uploadRenewedDoc);
export default r;
