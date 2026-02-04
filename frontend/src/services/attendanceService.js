import api from './api';

export const attendanceService = {
  async clockIn(data) {
    const response = await api.post('/attendance/clock-in', data);
    return response.data;
  },

  async clockOut(data) {
    const response = await api.post('/attendance/clock-out', data);
    return response.data;
  },

  async getAttendance(params = {}) {
    const response = await api.get('/attendance', { params });
    return response.data;
  },

  async getAttendanceById(id) {
    const response = await api.get(`/attendance/${id}`);
    return response.data;
  },
};
