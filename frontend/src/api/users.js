import { api } from './client';

export const getMyProfile = () => api.get('/users/me');
export const updateMyProfile = (data) => api.patch('/users/me', data);
export const listEmployees = (limit = 20, offset = 0) => api.get(`/users?limit=${limit}&offset=${offset}`);
export const getEmployee = (employeeId) => api.get(`/users/${employeeId}`);
export const updateEmployee = (employeeId, data) => api.patch(`/users/${employeeId}`, data);
