import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/ui/GlassCard';

export default function AttendancePage() {
  const [liveTime, setLiveTime] = useState(new Date());
  const [offset, setOffset] = useState(251.2);
  const cardRef = useRef(null);

  // Real-time clock update for the shift timer
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Stroke-dashoffset animation
  useEffect(() => {
    const offsetTimer = setInterval(() => {
      setOffset(prev => {
        let next = prev - 0.1;
        if (next < 0) next = 251.2;
        return next;
      });
    }, 1000);
    return () => clearInterval(offsetTimer);
  }, []);

  const timeString = liveTime.toTimeString().split(' ')[0];

  // Mouse tilt effect for shift card
  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x > 0 && x < rect.width && y > 0 && y < rect.height) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    } else {
      card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
    }
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (card) {
      card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
    }
  };

  // Pre-configured stable calendar days
  const calendarDays = [
    { day: 1, status: 'present', log: '09:00 AM - 05:30 PM' },
    { day: 2, status: 'present', log: '08:58 AM - 05:30 PM' },
    { day: 3, status: 'late', log: '09:15 AM - 06:00 PM' },
    { day: 4, status: 'present', log: '08:45 AM - 05:30 PM' },
    { day: 5, status: 'present', log: '09:00 AM - 05:30 PM' },
    { day: 6, status: 'absent', log: 'N/A' },
    { day: 7, status: 'present', log: '09:02 AM - 05:30 PM' },
    { day: 8, status: 'present', log: '08:50 AM - 05:30 PM' },
    { day: 9, status: 'present', log: '08:55 AM - 05:30 PM' },
    { day: 10, status: 'present', log: '09:00 AM - 05:30 PM' },
    { day: 11, status: 'late', log: '09:20 AM - 06:10 PM' },
    { day: 12, status: 'present', log: '09:00 AM - 05:30 PM', isToday: true },
    { day: 13, status: 'present', log: '08:49 AM - 05:30 PM' },
    { day: 14, status: 'present', log: '09:00 AM - 05:30 PM' },
    { day: 15, status: 'present', log: '08:55 AM - 05:30 PM' },
    { day: 16, status: 'present', log: '09:00 AM - 05:30 PM' },
    { day: 17, status: 'absent', log: 'N/A' },
    { day: 18, status: 'present', log: '08:58 AM - 05:30 PM' },
    { day: 19, status: 'present', log: '09:00 AM - 05:30 PM' },
    { day: 20, status: 'present', log: '09:01 AM - 05:30 PM' },
    { day: 21, status: 'present', log: '08:50 AM - 05:30 PM' },
    { day: 22, status: 'late', log: '09:30 AM - 06:30 PM' },
    { day: 23, status: 'present', log: '08:55 AM - 05:30 PM' },
    { day: 24, status: 'present', log: '09:00 AM - 05:30 PM' },
    { day: 25, status: 'present', log: '09:00 AM - 05:30 PM' },
    { day: 26, status: 'present', log: '08:48 AM - 05:30 PM' },
    { day: 27, status: 'present', log: '08:59 AM - 05:30 PM' },
    { day: 28, status: 'absent', log: 'N/A' },
    { day: 29, status: 'present', log: '09:00 AM - 05:30 PM' },
    { day: 30, status: 'present', log: '09:00 AM - 05:30 PM' },
    { day: 31, status: 'present', log: '08:52 AM - 05:30 PM' }
  ];

  return (
    <DashboardLayout userRole="employee">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 animate-fade-in">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-white tracking-tight">Attendance</h2>
          <p className="text-on-surface-variant mt-1 font-body-md text-body-md">Track your daily cycle and organizational health.</p>
        </div>
        
        {/* Glass Segmented Control */}
        <div className="flex bg-surface-container-lowest/40 backdrop-blur-md p-1 rounded-xl border border-white/5">
          <button className="px-6 py-2 font-label-sm text-label-sm rounded-lg text-on-surface-variant hover:text-white transition-all bg-transparent border-none cursor-pointer">Daily</button>
          <button className="px-6 py-2 font-label-sm text-label-sm rounded-lg text-on-surface-variant hover:text-white transition-all bg-transparent border-none cursor-pointer">Weekly</button>
          <button className="px-6 py-2 font-label-sm text-label-sm rounded-lg bg-primary/20 text-primary border border-primary/20 shadow-sm transition-all cursor-pointer">Monthly</button>
        </div>
      </div>

      {/* Bento Layout */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Monthly Calendar Grid (Span 8) */}
        <div className="col-span-12 lg:col-span-8 glass-panel rounded-3xl p-8 animate-enter">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <h3 className="font-headline-md text-headline-md font-bold">October 2023</h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors bg-transparent border-none cursor-pointer text-on-surface">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors bg-transparent border-none cursor-pointer text-on-surface">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
            
            {/* Color Legend */}
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2 font-label-sm text-label-sm opacity-60">
                <span className="w-3 h-3 rounded-full bg-primary"></span> Present
              </div>
              <div className="flex items-center gap-2 font-label-sm text-label-sm opacity-60">
                <span className="w-3 h-3 rounded-full bg-tertiary-container"></span> Late
              </div>
              <div className="flex items-center gap-2 font-label-sm text-label-sm opacity-60">
                <span className="w-3 h-3 rounded-full bg-error"></span> Absent
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-3">
            {/* Days Header */}
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
              <div key={day} className="text-center font-label-sm text-label-sm opacity-40 pb-4">{day}</div>
            ))}
            
            {/* Blank days matching layout */}
            <div className="h-24 rounded-2xl bg-white/5 opacity-10"></div>
            <div className="h-24 rounded-2xl bg-white/5 opacity-10"></div>

            {/* Render Days */}
            {calendarDays.map(item => {
              let statusColors = 'bg-primary/20 border-primary/30';
              let indicatorColor = 'bg-primary';
              let statusText = 'Present';

              if (item.status === 'late') {
                statusColors = 'bg-tertiary-container/20 border-tertiary-container/30';
                indicatorColor = 'bg-tertiary';
                statusText = 'Late (15m)';
              } else if (item.status === 'absent') {
                statusColors = 'bg-error/20 border-error/30';
                indicatorColor = 'bg-error';
                statusText = 'Absent';
              }

              return (
                <div 
                  key={item.day}
                  className={`group relative h-24 rounded-2xl border transition-all duration-300 hover:scale-[1.03] hover:z-20 cursor-pointer ${
                    item.isToday 
                      ? 'border-primary shadow-[0_0_15px_rgba(104,218,185,0.3)] ring-1 ring-primary/50' 
                      : 'border-white/10'
                  }`}
                >
                  <div className={`absolute inset-0 rounded-2xl ${statusColors} opacity-40`}></div>
                  <div className="relative p-3 h-full flex flex-col justify-between">
                    <span className={`font-label-sm text-label-sm ${item.isToday ? 'text-primary font-bold' : 'opacity-60'}`}>
                      {item.day}
                    </span>
                    <div className={`w-full h-1 rounded-full ${indicatorColor} opacity-50`}></div>
                  </div>
                  
                  {/* Hover Tooltip */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-surface-container-highest rounded-lg text-[10px] font-label-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap shadow-xl border border-white/10 z-30">
                    Status: {statusText} <br /> Log: {item.log}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clock In/Out Card + Summary (Span 4) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div 
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="tilt-card glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group transition-all duration-300"
            id="check-in-card"
          >
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <span className="material-symbols-outlined text-6xl">schedule</span>
            </div>
            
            <h4 className="font-label-sm text-label-sm text-primary uppercase tracking-[0.2em] mb-6">Shift Timer</h4>
            
            {/* Progress Ring */}
            <div className="relative w-48 h-48 mb-8">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-white/5" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="6"></circle>
                <circle 
                  className="text-primary progress-ring__circle" 
                  cx="50" 
                  cy="50" 
                  fill="transparent" 
                  r="40" 
                  stroke="currentColor" 
                  strokeDasharray="251.2" 
                  strokeDashoffset={offset} 
                  strokeLinecap="round" 
                  strokeWidth="6"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display-xl text-4xl font-bold tracking-tighter" id="live-clock">{timeString}</span>
                <span className="font-label-sm text-[10px] opacity-40 uppercase tracking-widest mt-1">Active Now</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full mb-8">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] opacity-40 uppercase mb-1">Check In</p>
                <p className="font-label-sm text-sm font-bold">09:12 AM</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] opacity-40 uppercase mb-1">Total Hrs</p>
                <p className="font-label-sm text-sm font-bold">06:42:15</p>
              </div>
            </div>

            <button className="w-full py-4 bg-tertiary-container text-on-tertiary-container font-bold rounded-2xl shadow-xl shadow-tertiary-container/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 border-none cursor-pointer">
              <span className="material-symbols-outlined">logout</span>
              Clock Out
            </button>
          </div>

          {/* Statistics Card */}
          <div className="glass-panel rounded-3xl p-6">
            <h4 className="font-label-sm text-label-sm font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">analytics</span>
              Weekly Summary
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-body-md text-sm opacity-60">Avg. Arrival</span>
                <span className="font-label-sm text-sm">08:54 AM</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[85%] rounded-full shadow-[0_0_8px_rgba(104,218,185,0.5)]"></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-body-md text-sm opacity-60">Work Efficiency</span>
                <span className="font-label-sm text-sm text-primary">94%</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-tertiary h-full w-[94%] rounded-full shadow-[0_0_8px_rgba(255,175,211,0.5)]"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
