import { api } from './client';

export const getMyPayroll = () => api.get('/payroll/me');
export const getEmployeePayroll = (employeeId) => api.get(`/payroll/${employeeId}`);
export const updateEmployeePayroll = (employeeId, data) => api.put(`/payroll/${employeeId}`, data);
