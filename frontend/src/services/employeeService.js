import api from './api';

export const employeeService = {
  async getEmployees(params = {}) {
    const response = await api.get('/employees', { params });
    return response.data;
  },

  async getEmployee(id) {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  async createEmployee(data) {
    const response = await api.post('/employees', data);
    return response.data;
  },

  async updateEmployee(id, data) {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },

  async deleteEmployee(id) {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },
};
