import api from './api';

export const leaveService = {
  async getLeaves(params = {}) {
    const response = await api.get('/leaves', { params });
    return response.data;
  },

  async getLeave(id) {
    const response = await api.get(`/leaves/${id}`);
    return response.data;
  },

  async createLeave(data) {
    const response = await api.post('/leaves', data);
    return response.data;
  },

  async updateLeave(id, data) {
    const response = await api.put(`/leaves/${id}`, data);
    return response.data;
  },

  async getLeaveBalance(employeeId, year) {
    const response = await api.get(`/leaves/balance/${employeeId}`, {
      params: { year },
    });
    return response.data;
  },
};
