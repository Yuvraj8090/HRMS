import api from './api';

export const companyService = {
  // --- COMPANY ENDPOINTS ---
  async getCompanies() {
    const response = await api.get('/companies');
    return response.data;
  },

  async getCompany(id) {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  async createCompany(data) {
    const response = await api.post('/companies', data);
    return response.data;
  },

  async updateCompany(id, data) {
    const response = await api.put(`/companies/${id}`, data);
    return response.data;
  },

  // --- BRANCH ENDPOINTS ---
  async getBranches(companyId) {
    const response = await api.get(`/companies/${companyId}/branches`);
    return response.data;
  },

  async createBranch(companyId, data) {
    const response = await api.post(`/companies/${companyId}/branches`, data);
    return response.data;
  },

  // --- DEPARTMENT ENDPOINTS ---
  async getDepartments(companyId) {
    const response = await api.get(`/companies/${companyId}/departments`);
    return response.data;
  },

  async createDepartment(companyId, data) {
    const response = await api.post(`/companies/${companyId}/departments`, data);
    return response.data;
  },

  async updateDepartment(companyId, deptId, data) {
    const response = await api.put(`/companies/${companyId}/departments/${deptId}`, data);
    return response.data;
  },

  async deleteDepartment(companyId, deptId) {
    const response = await api.delete(`/companies/${companyId}/departments/${deptId}`);
    return response.data;
  },

  // --- TEAM ENDPOINTS ---
  async getTeams(companyId) {
    const response = await api.get(`/companies/${companyId}/teams`);
    return response.data;
  },

  async createTeam(companyId, data) {
    const response = await api.post(`/companies/${companyId}/teams`, data);
    return response.data;
  },
};