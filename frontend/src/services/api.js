// src/services/api.js
// Axios instance — JWT auto-injected, 401 auto-logout

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: inject JWT ─────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hrms_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// ── Response: normalise errors, handle 401 ──────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hrms_token');
      localStorage.removeItem('hrms_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    const message = err.response?.data?.message || err.message || 'Something went wrong.';
    return Promise.reject(new Error(message));
  }
);

export default api;

// ── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:          (data) => api.post('/auth/login', data),
  register:       (data) => api.post('/auth/register', data),
  getMe:          ()     => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ── Employees ───────────────────────────────────────────────────────────────
export const employeeAPI = {
  getAll:     (params)    => api.get('/employees', { params }),
  getOne:     (id)        => api.get(`/employees/${id}`),
  create:     (data)      => api.post('/employees', data),
  update:     (id, data)  => api.put(`/employees/${id}`, data),
  deactivate: (id)        => api.delete(`/employees/${id}`),
};

// ── Departments ─────────────────────────────────────────────────────────────
export const departmentAPI = {
  getAll:  ()         => api.get('/departments'),
  getOne:  (id)       => api.get(`/departments/${id}`),
  create:  (data)     => api.post('/departments', data),
  update:  (id, data) => api.put(`/departments/${id}`, data),
  delete:  (id)       => api.delete(`/departments/${id}`),
};

// ── Designations ────────────────────────────────────────────────────────────
export const designationAPI = {
  getAll:  (params)   => api.get('/designations', { params }),
  create:  (data)     => api.post('/designations', data),
  update:  (id, data) => api.put(`/designations/${id}`, data),
  delete:  (id)       => api.delete(`/designations/${id}`),
};

// ── Attendance ──────────────────────────────────────────────────────────────
export const attendanceAPI = {
  clockIn:         (data)   => api.post('/attendance/clock-in', data),
  clockOut:        ()       => api.put('/attendance/clock-out'),
  getToday:        ()       => api.get('/attendance/today'),
  getHistory:      (params) => api.get('/attendance/history', { params }),
  getDailyOverview:()       => api.get('/attendance/overview'),
};

// ── Projects ────────────────────────────────────────────────────────────────
export const projectAPI = {
  getAll:        (params)          => api.get('/projects', { params }),
  getOne:        (id)              => api.get(`/projects/${id}`),
  create:        (data)            => api.post('/projects', data),
  update:        (id, data)        => api.put(`/projects/${id}`, data),
  assignMembers: (id, data)        => api.post(`/projects/${id}/members`, data),
  removeMember:  (id, userId)      => api.delete(`/projects/${id}/members/${userId}`),
  delete:        (id)              => api.delete(`/projects/${id}`),
};

// ── Requests (Increment & Appraisal) ────────────────────────────────────────
export const requestAPI = {
  submitIncrement:  (data)             => api.post('/requests/increment', data),
  createAppraisal:  (data)             => api.post('/requests/appraisal', data),
  getPending:       (params)           => api.get('/requests/pending', { params }),
  getMy:            (params)           => api.get('/requests/my', { params }),
  getOne:           (id)               => api.get(`/requests/${id}`),
  updateStatus:     (id, data)         => api.put(`/requests/${id}/status`, data),
  updateStage:      (id, stageId, data)=> api.put(`/requests/${id}/stage/${stageId}`, data),
};
