import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/ui/GlassCard';
import ProgressBar from '../../components/ui/ProgressBar';
import StatusBadge from '../../components/ui/StatusBadge';
import { getMyBalance, applyLeave, getMyRequests } from '../../api/leave';

function formatDateShort(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function leaveTitle(request) {
  const typeLabel = request.leave_type.charAt(0).toUpperCase() + request.leave_type.slice(1);
  return `${typeLabel} Leave`;
}

export default function LeaveRequestsPage() {
  const [leaveType, setLeaveType] = useState('paid'); // 'paid' | 'sick' | 'unpaid'
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    const year = new Date().getFullYear();
    const [balanceRows, requestPage] = await Promise.all([getMyBalance(year), getMyRequests(20, 0)]);
    setBalances(balanceRows);
    setRequests(requestPage.items);
  }, []);

  useEffect(() => {
    loadData().catch(() => {});
  }, [loadData]);

  const paidBalance = balances.find((b) => b.leave_type === 'paid');
  const sickBalance = balances.find((b) => b.leave_type === 'sick');
  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const remaining = (balance) => (balance ? Math.max(Number(balance.total_allocated) - Number(balance.used), 0) : 0);
  const percentRemaining = (balance) =>
    balance && Number(balance.total_allocated) > 0
      ? (remaining(balance) / Number(balance.total_allocated)) * 100
      : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess(false);
    if (!startDate || !endDate) {
      setSubmitError('Please choose a start and end date');
      return;
    }
    setIsSubmitting(true);
    try {
      await applyLeave({ leave_type: leaveType, start_date: startDate, end_date: endDate, remarks: reason || null });
      setSubmitSuccess(true);
      setReason('');
      setStartDate('');
      setEndDate('');
      await loadData();
    } catch (err) {
      setSubmitError(err.message || 'Could not submit this request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout userRole="employee">
      {/* Leave Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-gutter animate-enter">
        <GlassCard rounded="rounded-2xl" className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              paid
            </span>
          </div>
          <p className="font-label-sm text-label-sm text-primary mb-2 uppercase tracking-widest">Paid Time Off</p>
          <h3 className="font-display-xl text-[48px] leading-none mb-1 text-white">
            {remaining(paidBalance)}<span className="text-headline-md font-body-md opacity-40 ml-2">Days</span>
          </h3>
          <div className="mt-4">
            <ProgressBar value={percentRemaining(paidBalance)} color="primary" height="h-1" trackClass="bg-white/10" />
          </div>
        </GlassCard>

        <GlassCard rounded="rounded-2xl" className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              medical_services
            </span>
          </div>
          <p className="font-label-sm text-label-sm text-tertiary mb-2 uppercase tracking-widest">Sick Leave</p>
          <h3 className="font-display-xl text-[48px] leading-none mb-1 text-white">
            {remaining(sickBalance)}<span className="text-headline-md font-body-md opacity-40 ml-2">Days</span>
          </h3>
          <div className="mt-4">
            <ProgressBar value={percentRemaining(sickBalance)} color="tertiary" height="h-1" trackClass="bg-white/10" />
          </div>
        </GlassCard>

        <GlassCard rounded="rounded-2xl" className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              flight_takeoff
            </span>
          </div>
          <p className="font-label-sm text-label-sm text-secondary mb-2 uppercase tracking-widest">Pending Requests</p>
          <h3 className="font-display-xl text-[48px] leading-none mb-1 text-white">
            {String(pendingCount).padStart(2, '0')}<span className="text-headline-md font-body-md opacity-40 ml-2">Requests</span>
          </h3>
          <p className="mt-4 font-label-sm text-label-sm text-on-surface-variant opacity-60">
            {pendingCount > 0 ? 'Awaiting HR review' : 'All caught up'}
          </p>
        </GlassCard>
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-12 gap-gutter">

        {/* Apply for Leave Form (Span 7) */}
        <div className="col-span-12 lg:col-span-7 glass-panel p-8 rounded-[2rem] animate-enter" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-headline-lg text-headline-md text-white">Request Absence</h2>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Segmented Control */}
            <div className="space-y-4">
              <label className="font-label-sm text-label-sm text-on-surface-variant uppercase">Select Leave Type</label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-surface-container-lowest rounded-2xl border border-white/5">
                <button
                  type="button"
                  className={`py-3 px-4 rounded-xl font-body-md transition-all cursor-pointer border-none ${
                    leaveType === 'paid' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-on-surface-variant hover:bg-white/5 bg-transparent'
                  }`}
                  onClick={() => setLeaveType('paid')}
                >
                  Paid
                </button>
                <button
                  type="button"
                  className={`py-3 px-4 rounded-xl font-body-md transition-all cursor-pointer border-none ${
                    leaveType === 'sick' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-on-surface-variant hover:bg-white/5 bg-transparent'
                  }`}
                  onClick={() => setLeaveType('sick')}
                >
                  Sick
                </button>
                <button
                  type="button"
                  className={`py-3 px-4 rounded-xl font-body-md transition-all cursor-pointer border-none ${
                    leaveType === 'unpaid' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-on-surface-variant hover:bg-white/5 bg-transparent'
                  }`}
                  onClick={() => setLeaveType('unpaid')}
                >
                  Unpaid
                </button>
              </div>
            </div>

            {/* Date selection & details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant uppercase">Reason</label>
                  <textarea
                    className="w-full bg-surface-container-low border-b border-white/10 focus:border-primary transition-all p-4 rounded-xl text-body-md outline-none text-on-surface"
                    placeholder="Brief explanation..."
                    rows="3"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant uppercase">Attachments</label>
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:border-primary/40 cursor-pointer transition-all">
                    <span className="material-symbols-outlined text-on-surface-variant">upload_file</span>
                    <span className="font-label-sm text-label-sm text-on-surface">Drop medical certificate or PDF</span>
                  </div>
                </div>
              </div>

              {/* Date range */}
              <div className="space-y-4">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase">Leave Period</label>
                <div className="bg-surface-container-lowest rounded-2xl p-4 border border-white/5 space-y-4">
                  <div className="space-y-2">
                    <label className="font-label-sm text-[11px] text-on-surface-variant/70 uppercase">Start Date</label>
                    <input
                      type="date"
                      className="w-full bg-transparent border-b border-white/10 focus:border-primary transition-all py-2 text-body-md outline-none text-on-surface"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-sm text-[11px] text-on-surface-variant/70 uppercase">End Date</label>
                    <input
                      type="date"
                      min={startDate || undefined}
                      className="w-full bg-transparent border-b border-white/10 focus:border-primary transition-all py-2 text-body-md outline-none text-on-surface"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {submitError && <p className="text-error font-body-md text-sm">{submitError}</p>}
            {submitSuccess && <p className="text-primary font-body-md text-sm">Request submitted — awaiting HR review.</p>}

            <div className="pt-6 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => { setReason(''); setStartDate(''); setEndDate(''); setSubmitError(''); setSubmitSuccess(false); }}
                className="px-8 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all font-body-md bg-transparent text-on-surface cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-10 py-3 rounded-xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>

        {/* Tracker & Holidays Sidebar (Span 5) */}
        <div className="col-span-12 lg:col-span-5 space-y-gutter">

          {/* Tracker Card */}
          <div className="glass-panel p-8 rounded-[2rem] animate-enter" style={{ animationDelay: '200ms' }}>
            <h3 className="font-headline-md text-headline-md text-white mb-8">Active Tracker</h3>
            {requests.length === 0 && (
              <p className="text-on-surface-variant font-body-md text-sm">No leave requests yet.</p>
            )}
            <div className="space-y-12">
              {requests.slice(0, 3).map((request, index) => {
                const dateRange = `${formatDateShort(request.start_date)} - ${formatDateShort(request.end_date)} (${request.days_count} Day${request.days_count === 1 ? '' : 's'})`;

                if (request.status === 'rejected') {
                  return (
                    <div key={request.id} className={`space-y-4 ${index > 0 ? 'pt-6 border-t border-white/5' : ''}`}>
                      <div className="flex justify-between items-center opacity-60">
                        <div>
                          <p className="font-body-md font-bold text-white">{leaveTitle(request)}</p>
                          <p className="font-label-sm text-label-sm">{dateRange}</p>
                        </div>
                        <StatusBadge status="Rejected" />
                      </div>
                      {request.reviewer_comment && (
                        <p className="text-[13px] text-error bg-error-container/10 p-3 rounded-lg border border-error-container/20">
                          {request.reviewer_comment}
                        </p>
                      )}
                    </div>
                  );
                }

                const isApproved = request.status === 'approved';
                return (
                  <div key={request.id} className={`space-y-6 ${index > 0 ? 'pt-6 border-t border-white/5' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-body-md font-bold text-white">{leaveTitle(request)}</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">{dateRange}</p>
                      </div>
                      <StatusBadge status={isApproved ? 'Verified' : 'Reviewing'} />
                    </div>

                    {/* Stepper timeline */}
                    <div className="relative flex items-center justify-between w-full">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-white/5 -z-10"></div>
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] stepper-line -z-10"
                        style={{ width: isApproved ? '100%' : '50%' }}
                      ></div>

                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_0_15px_rgba(104,218,185,0.4)]">
                          <span className="material-symbols-outlined text-[16px]">check</span>
                        </div>
                        <span className="font-label-sm text-[10px] text-primary">SUBMITTED</span>
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isApproved ? 'bg-primary text-on-primary' : 'bg-primary/20 border border-primary/50 text-primary animate-pulse'}`}>
                          <span className="material-symbols-outlined text-[16px]">{isApproved ? 'check' : 'pending'}</span>
                        </div>
                        <span className="font-label-sm text-[10px] text-primary">HR APPROVAL</span>
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isApproved ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(104,218,185,0.4)]' : 'bg-white/5 border border-white/10 text-on-surface-variant'}`}>
                          <span className="material-symbols-outlined text-[16px]">done_all</span>
                        </div>
                        <span className={`font-label-sm text-[10px] ${isApproved ? 'text-primary' : 'text-on-surface-variant opacity-40'}`}>FINALIZED</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Company Holidays */}
          <div className="glass-panel p-6 rounded-2xl animate-enter" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-body-md font-bold text-white">Company Holidays</h4>
              <button className="text-primary text-label-sm font-label-sm hover:underline bg-transparent border-none cursor-pointer">Full Calendar</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-12 h-12 rounded-lg bg-surface-container flex flex-col items-center justify-center leading-none">
                  <span className="text-headline-md font-bold text-white">25</span>
                  <span className="text-[10px] uppercase opacity-40">Dec</span>
                </div>
                <div>
                  <p className="font-body-md text-sm font-semibold text-white">Christmas Break</p>
                  <p className="text-[12px] text-on-surface-variant">Global Office Closure</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-12 h-12 rounded-lg bg-surface-container flex flex-col items-center justify-center leading-none">
                  <span className="text-headline-md font-bold text-white">01</span>
                  <span className="text-[10px] uppercase opacity-40">Jan</span>
                </div>
                <div>
                  <p className="font-body-md text-sm font-semibold text-white">New Year's Eve</p>
                  <p className="text-[12px] text-on-surface-variant">Regional Holiday</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* FAB for quick actions */}
      <button className="fixed bottom-10 right-10 w-16 h-16 rounded-full bg-primary text-on-primary shadow-2xl flex items-center justify-center group hover:scale-110 active:scale-95 transition-all z-[100] border-none cursor-pointer">
        <span className="material-symbols-outlined text-[32px] group-hover:rotate-90 transition-transform">add</span>
      </button>
    </DashboardLayout>
  );
}
