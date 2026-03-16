// src/services/api.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: Inject JWT ─────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hrms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// ── Response: Centralized Error Handling ────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hrms_token');
      localStorage.removeItem('hrms_user');
      window.dispatchEvent(new CustomEvent('hrms:auth-expired'));
    }
    const message = err.response?.data?.message || err.message || 'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

// ── API Contracts (Domain Segregation) ──────────────────────────────────────

export const authAPI = {
  login:          (data) => api.post('/auth/login', data),
  register:       (data) => api.post('/auth/register', data),
  getMe:          ()     => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const employeeAPI = {
  getAll:     (params)    => api.get('/employees', { params }),
  getOne:     (id)        => api.get(`/employees/${id}`),
  create:     (data)      => api.post('/employees', data),
  update:     (id, data)  => api.put(`/employees/${id}`, data),
  deactivate: (id)        => api.delete(`/employees/${id}`),
  // ── NEW: Bulk Employee Import ──
  importAll:  (formData) => api.post('/employees/import-all', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const attendanceAPI = {
  clockIn:         (data)   => api.post('/attendance/clock-in', data),
  clockOut:        ()       => api.put('/attendance/clock-out'),
  getToday:        ()       => api.get('/attendance/today'),
  getHistory:      (params) => api.get('/attendance/history', { params }),
  getDailyOverview:()       => api.get('/attendance/overview'),
  importExcel:     (formData) => api.post('/attendance/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const leaveAPI = {
  apply: (formData) => api.post('/leaves/apply', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  process: (id, formData) => api.put(`/leaves/${id}/process`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAllPending: () => api.get('/leaves/pending'),
};

export const contractAPI = {
  getExpiring: () => api.get('/contracts/expiring'),
  renew: (id, formData) => api.post(`/contracts/${id}/renew`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const departmentAPI = {
  getAll:  ()         => api.get('/departments'),
  getOne:  (id)       => api.get(`/departments/${id}`),
  create:  (data)     => api.post('/departments', data),
  update:  (id, data) => api.put(`/departments/${id}`, data),
  delete:  (id)       => api.delete(`/departments/${id}`),
};

export const designationAPI = {
  getAll:  (params)   => api.get('/designations', { params }),
  create:  (data)     => api.post('/designations', data),
  update:  (id, data) => api.put(`/designations/${id}`, data),
  delete:  (id)       => api.delete(`/designations/${id}`),
};

export const projectAPI = {
  getAll:        (params)          => api.get('/projects', { params }),
  getOne:        (id)              => api.get(`/projects/${id}`),
  create:        (data)            => api.post('/projects', data),
  update:        (id, data)        => api.put(`/projects/${id}`, data),
  assignMembers: (id, data)        => api.post(`/projects/${id}/members`, data),
  removeMember:  (id, userId)      => api.delete(`/projects/${id}/members/${userId}`),
  delete:        (id)              => api.delete(`/projects/${id}`),
};

export const requestAPI = {
  submitIncrement:  (data)             => api.post('/requests/increment', data),
  createAppraisal:  (data)             => api.post('/requests/appraisal', data),
  getPending:       (params)           => api.get('/requests/pending', { params }),
  getMy:            (params)           => api.get('/requests/my', { params }),
  getOne:           (id)               => api.get(`/requests/${id}`),
  updateStatus:     (id, data)         => api.put(`/requests/${id}/status`, data),
  updateStage:      (id, stageId, data)=> api.put(`/requests/${id}/stage/${stageId}`, data),
};

export default api;