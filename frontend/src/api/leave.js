import { api } from './client';

export const getMyBalance = (year) => api.get(`/leave/balance?year=${year}`);

export const applyLeave = (data) => api.post('/leave/requests', data);

export const getMyRequests = (limit = 20, offset = 0) =>
  api.get(`/leave/requests/me?limit=${limit}&offset=${offset}`);

export const listAllRequests = ({ status, employeeId, limit = 20, offset = 0 } = {}) => {
  const params = new URLSearchParams({ limit, offset });
  if (status) params.set('status_filter', status);
  if (employeeId) params.set('employee_id', employeeId);
  return api.get(`/leave/requests?${params}`);
};

export const getRequest = (requestId) => api.get(`/leave/requests/${requestId}`);

export const decideRequest = (requestId, status, comment) =>
  api.patch(`/leave/requests/${requestId}/decision`, { status, comment });
