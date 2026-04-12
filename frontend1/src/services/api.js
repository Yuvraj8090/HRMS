// src/services/api.js
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: BASE, timeout: 20000 });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('hrms_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('hrms_token');
      localStorage.removeItem('hrms_user');
      window.location.href = '/login';
    }
    return Promise.reject(new Error(err.response?.data?.message || err.message || 'Something went wrong.'));
  }
);

export default api;

export const authAPI = {
  login:          d  => api.post('/auth/login', d),
  register:       d  => api.post('/auth/register', d),
  getMe:          () => api.get('/auth/me'),
  updateMe:       d  => api.put('/auth/me', d),
  changePassword: d  => api.put('/auth/change-password', d),
};

export const empAPI = {
  getAll:     p      => api.get('/employees', { params: p }),
  getOne:     id     => api.get(`/employees/${id}`),
  getStats:   ()     => api.get('/employees/stats'),
  create:     d      => api.post('/employees', d),
  update:     (id,d) => api.put(`/employees/${id}`, d),
  deactivate: id     => api.put(`/employees/${id}/deactivate`),
  reactivate: id     => api.put(`/employees/${id}/reactivate`),
};

export const deptAPI = {
  getAll:  ()      => api.get('/departments'),
  create:  d       => api.post('/departments', d),
  update:  (id,d)  => api.put(`/departments/${id}`, d),
  remove:  id      => api.delete(`/departments/${id}`),
};

export const desigAPI = {
  getAll:  p       => api.get('/designations', { params: p }),
  create:  d       => api.post('/designations', d),
  update:  (id,d)  => api.put(`/designations/${id}`, d),
  remove:  id      => api.delete(`/designations/${id}`),
};

export const attendAPI = {
  clockIn:      d    => api.post('/attendance/clock-in', d),
  clockOut:     ()   => api.put('/attendance/clock-out'),
  getToday:     ()   => api.get('/attendance/today'),
  getMyHistory: p    => api.get('/attendance/my-history', { params: p }),
  getUserHistory:(id,p)=>api.get(`/attendance/user/${id}`,{params:p}),
  getOverview:  ()   => api.get('/attendance/overview'),
  getMonthly:   p    => api.get('/attendance/monthly', { params: p }),
  importExcel:  fd   => api.post('/attendance/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const leaveAPI = {
  // Categories
  getCategories:  ()      => api.get('/leaves/categories'),
  createCategory: d       => api.post('/leaves/categories', d),
  updateCategory: (id,d)  => api.put(`/leaves/categories/${id}`, d),
  deleteCategory: id      => api.delete(`/leaves/categories/${id}`),
  // Balance
  getMyBalance:   p       => api.get('/leaves/balance/me', { params: p }),
  getUserBalance: (id,p)  => api.get(`/leaves/balance/${id}`, { params: p }),
  getAllBalances:  p       => api.get('/leaves/balance/all', { params: p }),
  setAllocation:  d       => api.post('/leaves/balance/set', d),
  bulkAllocation: d       => api.post('/leaves/balance/bulk', d),
  // Applications
  apply:          fd      => api.post('/leaves', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  applyJson:      d       => api.post('/leaves', d),
  getMyLeaves:    p       => api.get('/leaves/my', { params: p }),
  cancel:         id      => api.put(`/leaves/${id}/cancel`),
  uploadLetter:   (id,fd) => api.put(`/leaves/${id}/upload-letter`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  // HR/Admin
  getAll:         p       => api.get('/leaves', { params: p }),
  getOne:         id      => api.get(`/leaves/${id}`),
  recommend:      (id,d)  => api.put(`/leaves/${id}/recommend`, d),
  action:         (id,fd) => api.put(`/leaves/${id}/action`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  actionJson:     (id,d)  => api.put(`/leaves/${id}/action`, d),
  uploadApproved: (id,fd) => api.put(`/leaves/${id}/upload-approved`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getStats:       ()      => api.get('/leaves/stats'),
};

export const contractAPI = {
  getAll:         p       => api.get('/contracts', { params: p }),
  getFlagged:     ()      => api.get('/contracts/flagged'),
  getByEmployee:  id      => api.get(`/contracts/employee/${id}`),
  getOne:         id      => api.get(`/contracts/${id}`),
  create:         fd      => api.post('/contracts', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  createJson:     d       => api.post('/contracts', d),
  update:         (id,d)  => api.put(`/contracts/${id}`, d),
  renew:          (id,fd) => api.post(`/contracts/${id}/renew`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  renewJson:      (id,d)  => api.post(`/contracts/${id}/renew`, d),
  uploadDoc:      (id,fd) => api.put(`/contracts/${id}/upload-doc`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const projectAPI = {
  getAll:        p        => api.get('/projects', { params: p }),
  getOne:        id       => api.get(`/projects/${id}`),
  create:        d        => api.post('/projects', d),
  update:        (id,d)   => api.put(`/projects/${id}`, d),
  addMembers:    (id,d)   => api.post(`/projects/${id}/members`, d),
  removeMember:  (id,uid) => api.delete(`/projects/${id}/members/${uid}`),
  archive:       id       => api.delete(`/projects/${id}`),
};

export const requestAPI = {
  submitIncrement: d      => api.post('/requests/increment', d),
  createAppraisal: d      => api.post('/requests/appraisal', d),
  getPending:      p      => api.get('/requests/pending', { params: p }),
  getMy:           p      => api.get('/requests/my', { params: p }),
  updateStatus:    (id,d) => api.put(`/requests/${id}/status`, d),
};
