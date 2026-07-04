import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/ui/GlassCard';
import ProgressBar from '../../components/ui/ProgressBar';
import { getEmployeeDashboard } from '../../api/dashboard';
import { checkIn, checkOut } from '../../api/attendance';
import { getMyPayroll } from '../../api/payroll';

const inr = (value) => `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const PROFILE_FIELDS = ['phone', 'address', 'profile_picture_url', 'department', 'designation', 'date_of_joining'];

export default function EmployeeDashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboard, setDashboard] = useState(null);
  const [payroll, setPayroll] = useState(null);
  const [clockError, setClockError] = useState('');
  const [isClockBusy, setIsClockBusy] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboard = useCallback(() => {
    getEmployeeDashboard().then(setDashboard).catch(() => {});
  }, []);

  useEffect(() => {
    loadDashboard();
    getMyPayroll().then(setPayroll).catch(() => {});
  }, [loadDashboard]);

  const timeString = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateString = currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const isCheckedIn = !!dashboard?.checked_in_at;
  const isCheckedOut = !!dashboard?.checked_out_at;

  const handleClockAction = async () => {
    setClockError('');
    setIsClockBusy(true);
    try {
      if (!isCheckedIn) await checkIn();
      else if (!isCheckedOut) await checkOut();
      loadDashboard();
    } catch (err) {
      setClockError(err.message || 'That action could not be completed');
    } finally {
      setIsClockBusy(false);
    }
  };

  const profileCompletion = dashboard
    ? Math.round((PROFILE_FIELDS.filter((f) => !!dashboard.profile[f]).length / PROFILE_FIELDS.length) * 100)
    : 0;

  const summary = dashboard?.attendance_summary || { present: 0, absent: 0, half_day: 0, leave: 0 };
  const trackedDays = summary.present + summary.absent + summary.half_day + summary.leave;
  const presentDays = summary.present + summary.half_day;
  const maxBar = Math.max(summary.present, summary.absent, summary.half_day, summary.leave, 1);

  const totalRemaining = (dashboard?.leave_balances || []).reduce(
    (sum, b) => sum + Math.max(Number(b.total_allocated) - Number(b.used), 0),
    0
  );
  const totalUsed = (dashboard?.leave_balances || []).reduce((sum, b) => sum + Number(b.used), 0);

  return (
    <DashboardLayout userRole="employee">
      {/* Header Greeting */}
      <section className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in">
        <div>
          <h1 className="font-display-xl text-headline-lg font-bold text-on-surface tracking-tight">
            {greeting}, <span className="text-primary">{dashboard?.profile?.first_name || '...'}</span>
          </h1>
          <div className="flex items-center gap-4 mt-2 text-on-surface-variant">
            <div className="flex items-center gap-1 font-body-md">
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              <span>{dateString}</span>
            </div>
            <div className="w-1 h-1 bg-white/20 rounded-full"></div>
            <div className="flex items-center gap-1 font-body-md">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>{timeString}</span>
            </div>
          </div>
        </div>

        {/* Animated Clock In / Out Pulse Ring */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className={`font-label-sm text-label-sm uppercase tracking-widest mb-1 ${isCheckedIn && !isCheckedOut ? 'text-primary-container' : 'text-primary'}`}>
              Status: {isCheckedOut ? 'Shift Complete' : isCheckedIn ? 'Active' : 'Offline'}
            </p>
            <p className="font-body-md text-on-surface-variant">Shift: 09:00 - 18:00</p>
            {clockError && <p className="font-label-sm text-[11px] text-error">{clockError}</p>}
          </div>
          <button
            onClick={handleClockAction}
            disabled={isClockBusy || isCheckedOut}
            className={`pulse-ring w-20 h-20 rounded-full flex flex-col items-center justify-center group transition-all duration-500 shadow-[0_0_30px_rgba(104,218,185,0.1)] border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isCheckedIn
                ? 'bg-primary text-on-primary'
                : 'bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-on-primary'
            }`}
          >
            <span className="material-symbols-outlined text-3xl transition-colors">
              {isCheckedIn ? 'logout' : 'login'}
            </span>
            <span className="font-label-sm text-label-sm transition-colors">
              {isCheckedOut ? 'Done' : isCheckedIn ? 'Finish' : 'Start'}
            </span>
          </button>
        </div>
      </section>

      {/* Quick Access Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-12">
        {/* Profile Card */}
        <GlassCard className="stagger-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center border border-secondary/30">
              <span className="material-symbols-outlined text-secondary fill" style={{ fontVariationSettings: "'FILL' 1" }}>
                person_filled
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-secondary bg-secondary/10 px-2 py-1 rounded">Profile</span>
          </div>
          <h3 className="font-headline-md text-headline-md mb-1">{profileCompletion}%</h3>
          <p className="font-body-md text-on-surface-variant mb-4">Completion rate</p>
          <ProgressBar value={profileCompletion} color="secondary" />
        </GlassCard>

        {/* Attendance Card */}
        <GlassCard className="stagger-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
              <span className="material-symbols-outlined text-primary">event_available</span>
            </div>
            <span className="font-label-sm text-label-sm text-primary bg-primary/10 px-2 py-1 rounded">Attendance</span>
          </div>
          <h3 className="font-headline-md text-headline-md mb-1">{presentDays} / {trackedDays}</h3>
          <p className="font-body-md text-on-surface-variant mb-4">Days this month</p>
          <div className="flex items-end gap-1 h-8">
            <div className="flex-1 bg-primary rounded-t" style={{ height: `${(summary.present / maxBar) * 100}%` }}></div>
            <div className="flex-1 bg-tertiary rounded-t" style={{ height: `${(summary.half_day / maxBar) * 100}%` }}></div>
            <div className="flex-1 bg-error rounded-t" style={{ height: `${(summary.absent / maxBar) * 100}%` }}></div>
            <div className="flex-1 bg-secondary rounded-t" style={{ height: `${(summary.leave / maxBar) * 100}%` }}></div>
          </div>
        </GlassCard>

        {/* Leave Card */}
        <GlassCard className="stagger-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-tertiary/20 flex items-center justify-center border border-tertiary/30">
              <span className="material-symbols-outlined text-tertiary">vibration</span>
            </div>
            <span className="font-label-sm text-label-sm text-tertiary bg-tertiary/10 px-2 py-1 rounded">Leave</span>
          </div>
          <h3 className="font-headline-md text-headline-md mb-1">{totalRemaining} Days</h3>
          <p className="font-body-md text-on-surface-variant mb-4">Available balance</p>
          <div className="flex gap-2">
            <div className="flex-1 text-center bg-white/5 py-1 rounded">
              <span className="font-label-sm text-label-sm block opacity-50">Used</span>
              <span className="font-body-md text-on-surface">{totalUsed}</span>
            </div>
            <div className="flex-1 text-center bg-white/5 py-1 rounded">
              <span className="font-label-sm text-label-sm block opacity-50">Pending</span>
              <span className="font-body-md text-on-surface">{dashboard?.pending_leave_count ?? 0}</span>
            </div>
          </div>
        </GlassCard>

        {/* Payroll Card */}
        <GlassCard className="stagger-in" style={{ animationDelay: '0.5s' }}>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-on-surface-variant/20 flex items-center justify-center border border-white/10">
              <span className="material-symbols-outlined text-on-surface">payments</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface bg-white/10 px-2 py-1 rounded">Payroll</span>
          </div>
          <h3 className="font-headline-md text-headline-md mb-1">{payroll ? inr(payroll.net_pay) : '—'}</h3>
          <p className="font-body-md text-on-surface-variant mb-4">
            {payroll ? `Effective ${new Date(payroll.effective_from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No structure set up'}
          </p>
          <svg className="w-full h-8 stroke-primary stroke-2 fill-none overflow-visible" viewBox="0 0 100 20">
            <path d="M0 15 Q 10 5, 20 12 T 40 10 T 60 15 T 80 5 T 100 12"></path>
          </svg>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Recent Activity Timeline */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-8 stagger-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-headline-md text-headline-md">Recent Leave Activity</h2>
            <button className="text-primary font-label-sm text-label-sm hover:underline bg-transparent border-none cursor-pointer">
              View All
            </button>
          </div>
          {(!dashboard || dashboard.recent_leave_requests.length === 0) && (
            <p className="font-body-md text-on-surface-variant">No leave requests yet.</p>
          )}
          <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
            {dashboard?.recent_leave_requests.map((request) => {
              const borderColor = request.status === 'approved' ? 'border-primary' : request.status === 'rejected' ? 'border-error' : 'border-tertiary';
              const dotColor = request.status === 'approved' ? 'bg-primary' : request.status === 'rejected' ? 'bg-error' : 'bg-tertiary';
              const label = `${request.leave_type.charAt(0).toUpperCase() + request.leave_type.slice(1)} Leave — ${request.status.charAt(0).toUpperCase() + request.status.slice(1)}`;
              return (
                <div key={request.id} className="relative pl-10 flex items-start group">
                  <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full bg-surface-container-highest border-2 ${borderColor} flex items-center justify-center z-10 group-hover:scale-125 transition-transform`}>
                    <div className={`w-2 h-2 ${dotColor} rounded-full`}></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-body-lg font-semibold text-on-surface">{label}</h4>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        {new Date(request.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="font-body-md text-on-surface-variant">
                      {request.start_date} to {request.end_date} ({request.days_count} day{request.days_count === 1 ? '' : 's'})
                      {request.reviewer_comment ? ` — ${request.reviewer_comment}` : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team / Colleagues Status */}
        <div className="glass-panel rounded-3xl p-8 stagger-in" style={{ animationDelay: '0.7s' }}>
          <h2 className="font-headline-md text-headline-md mb-8">Team Status</h2>
          <div className="space-y-6">
            <div className="flex items-center gap-4 group">
              <div className="relative">
                <img className="w-12 h-12 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-dbV_npRg0dvBpHDL2OYj2T76YZ95ZMdiaNBHHUgEY8Qc59BLTpS40jIXej4xRmA99sGfycTUqoOp0MibVcJeAmQSns7o3wG3Fok42VLkO_snq1ddIhBjG6tvRvrWnLviXr4bSM8wf1TOLLztsk44aiSTMiV31eKR95Fd7v6POTPXXk93WITbVng3oxL7NrJRZwI-9UYJggacfYBy4XOgMJjmzufaNlcVdXoUs1Z5rMm_2M1xqkza3aBi1JxH9szQny7QYCmXeuA" alt="Marcus Chen" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-background"></div>
              </div>
              <div>
                <h4 className="font-body-md font-bold text-on-surface">Marcus Chen</h4>
                <p className="font-label-sm text-label-sm text-primary uppercase">Active</p>
              </div>
              <button className="ml-auto w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-primary/20 transition-all border-none cursor-pointer text-on-surface">
                <span className="material-symbols-outlined text-sm">chat</span>
              </button>
            </div>

            <div className="flex items-center gap-4 group opacity-60">
              <div className="relative">
                <img className="w-12 h-12 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSJcZYAqY9WOM_dHycCHachnSAM_Mwi8e28NeCUcGdZgVHSKJZxwzFNIAUL0H4sK1oytbCmZvNpl-70hfeTuk24ok3de0fgC1KR870xjoM6gbk3r3SFmJnXWLWg04tu9yRTwuH-lcd-AcLp0KjOAvVBLvuHCFYPYymm8gRDvEmy4mD_kbe6y4rQkuk1BPWDT0KNJ7qfJCmbQJ7t7Ox6Ahz-zqKNNtofbMOsctqvn-Ga1mf5Irxge1yQkbm573J8gEQFrCLuYUr8Mw" alt="Elena Rodriguez" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-amber-500 rounded-full border-2 border-background"></div>
              </div>
              <div>
                <h4 className="font-body-md font-bold text-on-surface">Elena Rodriguez</h4>
                <p className="font-label-sm text-label-sm text-amber-500 uppercase">In Meeting</p>
              </div>
              <button className="ml-auto w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-primary/20 transition-all border-none cursor-pointer text-on-surface">
                <span className="material-symbols-outlined text-sm">chat</span>
              </button>
            </div>

            <div className="flex items-center gap-4 group">
              <div className="relative">
                <img className="w-12 h-12 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUUnQSrhsCgNSQBhC8OMdS_Cc-ToDLUB30ULVHZFV8zAasS3lD-X7eU5b5E3cG71xmKK4yahUZuExW7ydR-rALjDSYYoc7u10LmVVadLGJUTOfsiamqQfbY6OudCUmLZtV8IQn6vdU41j0tgwvUheWO1pP4jeCdk_Tr0IFCi-Vn3IV4Wip5V0lPTler9sU0YS05Z4TiiHOgKSO97cMCpNZIBsBqgHKIZFb7EpP6OMFbpm8EgYVoKHgEyswIgEikDC-ZzDFoufyG9U" alt="David Smith" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-background"></div>
              </div>
              <div>
                <h4 className="font-body-md font-bold text-on-surface">David Smith</h4>
                <p className="font-label-sm text-label-sm text-primary uppercase">Active</p>
              </div>
              <button className="ml-auto w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-primary/20 transition-all border-none cursor-pointer text-on-surface">
                <span className="material-symbols-outlined text-sm">chat</span>
              </button>
            </div>
          </div>
          <button className="w-full mt-10 py-3 rounded-xl border border-white/10 font-label-sm text-label-sm hover:bg-white/5 transition-all bg-transparent text-on-surface cursor-pointer">
            Show All Team Members
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
