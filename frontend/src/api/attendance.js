import { api } from './client';

export const checkIn = () => api.post('/attendance/check-in');
export const checkOut = () => api.post('/attendance/check-out');

export const getMyAttendance = (dateFrom, dateTo) =>
  api.get(`/attendance/me?date_from=${dateFrom}&date_to=${dateTo}`);

export const getMySummary = (dateFrom, dateTo) =>
  api.get(`/attendance/me/summary?date_from=${dateFrom}&date_to=${dateTo}`);

export const getEmployeeAttendance = (employeeId, dateFrom, dateTo) =>
  api.get(`/attendance/${employeeId}?date_from=${dateFrom}&date_to=${dateTo}`);

export const getEmployeeSummary = (employeeId, dateFrom, dateTo) =>
  api.get(`/attendance/${employeeId}/summary?date_from=${dateFrom}&date_to=${dateTo}`);

export const listAttendance = ({ dateFrom, dateTo, status, limit = 20, offset = 0 }) => {
  const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo, limit, offset });
  if (status) params.set('status', status);
  return api.get(`/attendance?${params}`);
};
