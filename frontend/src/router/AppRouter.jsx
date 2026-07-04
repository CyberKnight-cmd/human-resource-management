import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from '../pages/Auth/AuthPage';
import AdminDashboardPage from '../pages/AdminDashboard/AdminDashboardPage';
import EmployeeDashboardPage from '../pages/EmployeeDashboard/EmployeeDashboardPage';
import AttendancePage from '../pages/AttendanceHistory/AttendancePage';
import LeaveRequestsPage from '../pages/LeaveRequests/LeaveRequestsPage';
import PayrollPage from '../pages/Payroll/PayrollPage';
import ProfilePage from '../pages/Profile/ProfilePage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/employee" element={<EmployeeDashboardPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/leave" element={<LeaveRequestsPage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        {/* Fallback to sign in */}
        <Route path="*" element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  );
}
