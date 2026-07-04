import { api } from './client';

export const getEmployeeDashboard = () => api.get('/dashboard/employee');
export const getAdminDashboard = () => api.get('/dashboard/admin');
