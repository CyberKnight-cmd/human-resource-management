import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/ui/GlassCard';
import ProgressBar from '../../components/ui/ProgressBar';
import StatusBadge from '../../components/ui/StatusBadge';

export default function LeaveRequestsPage() {
  const [leaveType, setLeaveType] = useState('paid'); // 'paid' | 'sick' | 'unpaid'
  const [reason, setReason] = useState('');

  return (
    <DashboardLayout userRole="employee">
      {/* Page Title & Main Header */}
      <div className="mb-8 animate-fade-in">
        <h2 className="font-headline-lg text-headline-lg font-bold text-white tracking-tight">Leave Management</h2>
        <p className="text-on-surface-variant mt-1 font-body-md text-body-md">Track your daily cycle and organizational health.</p>
      </div>

      {/* Leave Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-gutter animate-enter">
        <GlassCard className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              paid
            </span>
          </div>
          <p className="font-label-sm text-label-sm text-primary mb-2 uppercase tracking-widest">Paid Time Off</p>
          <h3 className="font-display-xl text-[48px] leading-none mb-1 text-white">
            14.5<span className="text-headline-md font-body-md opacity-40 ml-2">Days</span>
          </h3>
          <div className="mt-4">
            <ProgressBar value={65} color="primary" />
          </div>
        </GlassCard>

        <GlassCard className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              medical_services
            </span>
          </div>
          <p className="font-label-sm text-label-sm text-tertiary mb-2 uppercase tracking-widest">Sick Leave</p>
          <h3 className="font-display-xl text-[48px] leading-none mb-1 text-white">
            08<span className="text-headline-md font-body-md opacity-40 ml-2">Days</span>
          </h3>
          <div className="mt-4">
            <ProgressBar value={40} color="tertiary" />
          </div>
        </GlassCard>

        <GlassCard className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              flight_takeoff
            </span>
          </div>
          <p className="font-label-sm text-label-sm text-secondary mb-2 uppercase tracking-widest">Pending Requests</p>
          <h3 className="font-display-xl text-[48px] leading-none mb-1 text-white">
            02<span className="text-headline-md font-body-md opacity-40 ml-2">Requests</span>
          </h3>
          <div className="mt-4 flex -space-x-2">
            <img className="w-6 h-6 rounded-full border border-background object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCS_po6p6HUOALUwYDMMutnRMp0g-2rq4ZEQcP44Ve379Qrln0bYT0WqkPeIvfeh4mrUlGrxbD4xqsgsvDb5t_ysRLjzerta0LeLxuvaS06lrU0jUnAEqMJBahx392jAzw7WP0CBPqjk-MpqcX9951_xRYz_kuptN9tie30Anp7u3s_7DGu_IqdUHsewWGX_9zXScQ3tFwzEIvs5JJa-NEfFdkDQ8d1tdRxoioBEJV3FrFRu1oTaWTAlvjx91tCsLFEECvGWS-LrG8" alt="Pending user 1" />
            <img className="w-6 h-6 rounded-full border border-background object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRNrdrwjSqmXFq-hgW9BUq2ID9q2b-gG5x9Iig-i0pHQ5nuAYvgei9PGZHMrK_dIP0XRMEsxaFVxWEgPBxw279DgDqPqX1MNin0dVbdn06LE4GFbji8CZm8YRXVCQLgYmQLCKtq00w-C3vdXy11yRDOrTBglHZxYyd9zFMlwJzULsW4m-1eRlDYX-0PclVx5VbMNk668w9FTlerMzB3lIFUYh1bmAN2n4gFiT6tNItFuCYaOxQSA1nxW75XLc6QZiNgCD7I7yRwRA" alt="Pending user 2" />
          </div>
        </GlassCard>
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-12 gap-gutter">
        
        {/* Apply for Leave Form (Span 7) */}
        <div className="col-span-12 lg:col-span-7 glass-panel p-8 rounded-[2rem] animate-enter" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-headline-lg text-headline-md text-white">Request Absence</h2>
            <span className="font-label-sm text-label-sm px-3 py-1 bg-white/5 rounded-full border border-white/10">Draft Saved</span>
          </div>

          <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); alert('Absence Request Submitted!'); }}>
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

              {/* Calendar mockup */}
              <div className="space-y-4">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase">Calendar Period</label>
                <div className="bg-surface-container-lowest rounded-2xl p-4 border border-white/5">
                  <div className="flex justify-between items-center mb-4 px-2">
                    <p className="font-bold text-white">October 2024</p>
                    <div className="flex gap-2">
                      <button type="button" className="material-symbols-outlined text-sm hover:text-primary bg-transparent border-none text-on-surface cursor-pointer">chevron_left</button>
                      <button type="button" className="material-symbols-outlined text-sm hover:text-primary bg-transparent border-none text-on-surface cursor-pointer">chevron_right</button>
                    </div>
                  </div>
                  <div className="calendar-grid text-center font-label-sm text-[10px] text-on-surface-variant mb-2">
                    <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                  </div>
                  <div className="calendar-grid gap-y-2 text-center text-on-surface text-sm">
                    {/* Mock Days */}
                    <span className="py-2 text-on-surface-variant opacity-20">28</span>
                    <span className="py-2 text-on-surface-variant opacity-20">29</span>
                    <span className="py-2 text-on-surface-variant opacity-20">30</span>
                    <button type="button" className="py-2 hover:bg-primary/20 rounded-lg bg-transparent border-none text-on-surface cursor-pointer">1</button>
                    <button type="button" className="py-2 hover:bg-primary/20 rounded-lg bg-transparent border-none text-on-surface cursor-pointer">2</button>
                    {/* Selected dates (3, 4, 5) */}
                    <button type="button" className="py-2 bg-primary/30 border border-primary/50 rounded-lg text-primary cursor-pointer">3</button>
                    <button type="button" className="py-2 bg-primary/30 border border-primary/50 rounded-lg text-primary cursor-pointer">4</button>
                    <button type="button" className="py-2 bg-primary/30 border border-primary/50 rounded-lg text-primary cursor-pointer">5</button>
                    <button type="button" className="py-2 hover:bg-primary/20 rounded-lg bg-transparent border-none text-on-surface cursor-pointer">6</button>
                    <button type="button" className="py-2 hover:bg-primary/20 rounded-lg bg-transparent border-none text-on-surface cursor-pointer">7</button>
                    <button type="button" className="py-2 hover:bg-primary/20 rounded-lg bg-transparent border-none text-on-surface cursor-pointer">8</button>
                    <span className="py-2 opacity-50">...</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end gap-4">
              <button type="button" className="px-8 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all font-body-md bg-transparent text-on-surface cursor-pointer">Cancel</button>
              <button type="submit" className="px-10 py-3 rounded-xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all cursor-pointer border-none">Submit Request</button>
            </div>
          </form>
        </div>

        {/* Tracker & Holidays Sidebar (Span 5) */}
        <div className="col-span-12 lg:col-span-5 space-y-gutter">
          
          {/* Tracker Card */}
          <div className="glass-panel p-8 rounded-[2rem] animate-enter" style={{ animationDelay: '200ms' }}>
            <h3 className="font-headline-md text-headline-md text-white mb-8">Active Tracker</h3>
            <div className="space-y-12">
              
              {/* Request 1 */}
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-body-md font-bold text-white">Annual Family Vacation</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Oct 12 - Oct 20 (9 Days)</p>
                  </div>
                  <StatusBadge status="Reviewing" />
                </div>

                {/* Stepper timeline */}
                <div className="relative flex items-center justify-between w-full">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-white/5 -z-10"></div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-[2px] stepper-line -z-10"></div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_0_15px_rgba(104,218,185,0.4)]">
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    </div>
                    <span className="font-label-sm text-[10px] text-primary">SUBMITTED</span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 text-primary flex items-center justify-center animate-pulse">
                      <span className="material-symbols-outlined text-[16px]">pending</span>
                    </div>
                    <span className="font-label-sm text-[10px] text-primary">HR APPROVAL</span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-on-surface-variant flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px]">done_all</span>
                    </div>
                    <span className="font-label-sm text-[10px] text-on-surface-variant opacity-40">FINALIZED</span>
                  </div>
                </div>
              </div>

              {/* Request 2 */}
              <div className="space-y-4 pt-6 border-t border-white/5">
                <div className="flex justify-between items-center opacity-60">
                  <div>
                    <p className="font-body-md font-bold text-white">Personal Workday</p>
                    <p className="font-label-sm text-label-sm">Sep 24 (1 Day)</p>
                  </div>
                  <StatusBadge status="Rejected" />
                </div>
                <p className="text-[13px] text-error bg-error-container/10 p-3 rounded-lg border border-error-container/20">
                  Overlap with crucial sprint planning meeting. Please reschedule.
                </p>
              </div>

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
