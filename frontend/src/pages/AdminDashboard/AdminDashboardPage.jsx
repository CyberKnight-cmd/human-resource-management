import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import StarRating from '../../components/ui/StarRating';
import { getAdminDashboard } from '../../api/dashboard';
import { listEmployees } from '../../api/users';
import { decideRequest } from '../../api/leave';

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [employeePage, setEmployeePage] = useState({ items: [], total: 0 });
  const [decisionError, setDecisionError] = useState('');
  const [busyRequestId, setBusyRequestId] = useState(null);

  const loadDashboard = useCallback(() => {
    getAdminDashboard().then(setDashboard).catch(() => {});
  }, []);

  useEffect(() => {
    loadDashboard();
    listEmployees(10, 0).then(setEmployeePage).catch(() => {});
  }, [loadDashboard]);

  const employeesById = useMemo(() => {
    const map = {};
    for (const emp of employeePage.items) map[emp.id] = emp;
    return map;
  }, [employeePage.items]);

  const attendanceToday = dashboard?.attendance_today || { present: 0, absent: 0, half_day: 0, leave: 0 };
  const presentPct = dashboard?.total_employees
    ? Math.round(((attendanceToday.present + attendanceToday.half_day) / dashboard.total_employees) * 100)
    : 0;

  const handleDecision = async (requestId, status) => {
    setDecisionError('');
    setBusyRequestId(requestId);
    try {
      await decideRequest(requestId, status, null);
      loadDashboard();
    } catch (err) {
      setDecisionError(err.message || 'Could not record that decision');
    } finally {
      setBusyRequestId(null);
    }
  };

  return (
    <DashboardLayout userRole="admin">
      {/* Dashboard Title */}
      <div className="mb-10 animate-fade-in">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2 tracking-tight">Organization Overview</h2>
        <p className="text-on-surface-variant max-w-2xl">Real-time organizational insights and operational metrics.</p>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-section-gap">
        <StatCard
          icon="groups"
          title="Total Employees"
          value={dashboard?.total_employees ?? 0}
          delay="0.1s"
        />
        <StatCard
          icon="how_to_reg"
          title="Present Today"
          value={attendanceToday.present + attendanceToday.half_day}
          badgeText={dashboard ? `${presentPct}%` : undefined}
          badgeType="tertiary"
          iconBgColor="bg-tertiary-container/10"
          iconColor="text-tertiary"
          delay="0.2s"
        />
        <StatCard
          icon="event_busy"
          title="Pending Leaves"
          value={dashboard?.pending_leave_count ?? 0}
          iconBgColor="bg-secondary-container/20"
          iconColor="text-secondary"
          delay="0.3s"
        />
        {/* Payroll Status StatCard — no processing-cycle data model on the backend, kept decorative */}
        <div className="glass-card p-6 rounded-3xl stagger-in overflow-hidden relative" style={{ animationDelay: '0.4s' }}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined fill" style={{ fontVariationSettings: "'FILL' 1" }}>
                payments
              </span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
          </div>
          <p className="font-label-sm text-on-surface-variant mb-1 uppercase tracking-widest">Payroll Status</p>
          <h3 className="font-headline-md text-headline-md font-bold text-primary">Processing</h3>
          <p className="font-label-sm text-on-surface-variant opacity-60 mt-2">Cycle: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          <div className="absolute bottom-0 left-0 h-1 bg-primary/30 w-full">
            <div className="h-full bg-primary" style={{ width: '65%' }}></div>
          </div>
        </div>
      </div>

      {/* Lower Layout: Directory and Approvals */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">
        {/* Employee Directory Table */}
        <div className="xl:col-span-8 glass-card rounded-3xl flex flex-col overflow-hidden stagger-in" style={{ animationDelay: '0.5s' }}>
          <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-headline-md text-headline-md">Active Directory</h3>
              <p className="font-label-sm text-on-surface-variant">Manage {employeePage.total.toLocaleString()} employees</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-on-surface-variant transition-all cursor-pointer">
                <span className="material-symbols-outlined">filter_list</span>
              </button>
              <button className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer border-none">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add Employee
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-widest text-[10px]">Employee</th>
                  <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-widest text-[10px]">Role</th>
                  <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-widest text-[10px]">Status</th>
                  <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-widest text-[10px]">Performance</th>
                  <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-widest text-[10px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {employeePage.items.map(emp => (
                  <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border border-white/10 bg-surface-container flex items-center justify-center text-on-surface-variant">
                          <span className="material-symbols-outlined text-[20px]">person</span>
                        </div>
                        <div>
                          <p className="font-label-sm text-on-surface">{emp.first_name} {emp.last_name}</p>
                          <p className="text-[12px] text-on-surface-variant">{emp.department || 'Unassigned'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant font-label-sm">{emp.designation || '—'}</td>
                    <td className="px-6 py-4">
                      {/* No employment-status field on the backend yet — shown as a decorative default */}
                      <StatusBadge status="Active" />
                    </td>
                    <td className="px-6 py-4">
                      {/* No performance-rating data model on the backend — decorative placeholder */}
                      <StarRating rating={0} />
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-on-surface-variant hover:text-primary transition-colors bg-transparent border-none cursor-pointer">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-white/5 flex justify-between items-center mt-auto">
            <p className="font-label-sm text-on-surface-variant text-[12px]">Showing {employeePage.items.length} of {employeePage.total.toLocaleString()} employees</p>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded-lg border border-white/10 font-label-sm text-label-sm hover:bg-white/5 transition-all disabled:opacity-30 cursor-pointer bg-transparent text-on-surface" disabled>Prev</button>
              <button className="px-3 py-1 rounded-lg border border-white/10 font-label-sm text-label-sm hover:bg-white/5 transition-all cursor-pointer bg-transparent text-on-surface">Next</button>
            </div>
          </div>
        </div>

        {/* Leave Approval Queue */}
        <div className="xl:col-span-4 space-y-gutter stagger-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex justify-between items-center mb-2 px-2">
            <h3 className="font-headline-md text-headline-md text-on-surface">Leave Requests</h3>
            <a className="font-label-sm text-label-sm text-primary hover:underline cursor-pointer" href="#">View All</a>
          </div>

          {decisionError && <p className="text-error font-body-md text-sm px-2">{decisionError}</p>}

          {!dashboard || dashboard.recent_leave_requests.length === 0 ? (
            <div className="glass-card p-8 rounded-3xl text-center text-on-surface-variant font-body-md">
              No pending leave requests.
            </div>
          ) : (
            dashboard.recent_leave_requests.map(req => {
              const employee = employeesById[req.employee_id];
              const name = employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee';
              const typeLabel = req.leave_type.charAt(0).toUpperCase() + req.leave_type.slice(1);
              return (
                <div key={req.id} className="glass-card p-5 rounded-3xl relative group overflow-hidden transition-all duration-300">
                  <div className="flex gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl border border-white/10 bg-surface-container flex items-center justify-center text-on-surface-variant">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <div>
                      <h4 className="font-label-sm text-on-surface">{name}</h4>
                      <p className="text-[12px] text-on-surface-variant">{typeLabel} Leave • {req.days_count} Day{req.days_count === 1 ? '' : 's'}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-[10px] text-on-surface-variant uppercase">From {req.start_date}</p>
                    </div>
                  </div>
                  <p className="text-body-md text-[14px] text-on-surface-variant mb-6 leading-relaxed">
                    {req.remarks || 'No additional remarks.'}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleDecision(req.id, 'rejected')}
                      disabled={busyRequestId === req.id}
                      className="py-2.5 rounded-xl border border-error/30 text-error font-bold font-label-sm text-label-sm hover:bg-error/10 active:scale-95 transition-all cursor-pointer bg-transparent disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleDecision(req.id, 'approved')}
                      disabled={busyRequestId === req.id}
                      className="py-2.5 rounded-xl bg-primary text-on-primary font-bold font-label-sm text-label-sm hover:shadow-[0_0_15px_rgba(104,218,185,0.4)] active:scale-95 transition-all cursor-pointer border-none disabled:opacity-50"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
