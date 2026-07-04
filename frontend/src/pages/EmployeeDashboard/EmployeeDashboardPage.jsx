import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/ui/GlassCard';
import ProgressBar from '../../components/ui/ProgressBar';

export default function EmployeeDashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockedIn, setClockedIn] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateOptions = { weekday: 'long', month: 'short', day: 'numeric' };
  const dateString = currentTime.toLocaleDateString('en-US', dateOptions);

  return (
    <DashboardLayout userRole="employee">
      {/* Header Greeting */}
      <section className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in">
        <div>
          <h1 className="font-display-xl text-headline-lg font-bold text-on-surface tracking-tight">
            Good morning, <span className="text-primary">Sarah</span>
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
            <p className={`font-label-sm text-label-sm uppercase tracking-widest mb-1 ${clockedIn ? 'text-primary-container' : 'text-primary'}`}>
              Status: {clockedIn ? 'Active' : 'Offline'}
            </p>
            <p className="font-body-md text-on-surface-variant">Shift: 09:00 - 18:00</p>
          </div>
          <button 
            onClick={() => setClockedIn(!clockedIn)}
            className={`pulse-ring w-20 h-20 rounded-full flex flex-col items-center justify-center group transition-all duration-500 shadow-[0_0_30px_rgba(104,218,185,0.1)] border-none cursor-pointer ${
              clockedIn 
                ? 'bg-primary text-on-primary' 
                : 'bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20'
            }`}
          >
            <span className="material-symbols-outlined text-3xl">
              {clockedIn ? 'logout' : 'login'}
            </span>
            <span className="font-label-sm text-label-sm">
              {clockedIn ? 'Finish' : 'Start'}
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
          <h3 className="font-headline-md text-headline-md mb-1 text-white">98%</h3>
          <p className="font-body-md text-on-surface-variant mb-4">Completion rate</p>
          <ProgressBar value={98} color="secondary" />
        </GlassCard>

        {/* Attendance Card */}
        <GlassCard className="stagger-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
              <span className="material-symbols-outlined text-primary">event_available</span>
            </div>
            <span className="font-label-sm text-label-sm text-primary bg-primary/10 px-2 py-1 rounded">Attendance</span>
          </div>
          <h3 className="font-headline-md text-headline-md mb-1 text-white">22 / 24</h3>
          <p className="font-body-md text-on-surface-variant mb-4">Days this month</p>
          <div className="flex items-end gap-1 h-8">
            <div className="flex-1 bg-primary/40 rounded-t h-[60%]"></div>
            <div className="flex-1 bg-primary/60 rounded-t h-[80%]"></div>
            <div className="flex-1 bg-primary rounded-t h-[95%]"></div>
            <div className="flex-1 bg-primary/40 rounded-t h-[40%]"></div>
            <div className="flex-1 bg-primary/70 rounded-t h-[75%]"></div>
            <div className="flex-1 bg-primary rounded-t h-[90%]"></div>
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
          <h3 className="font-headline-md text-headline-md mb-1 text-white">12 Days</h3>
          <p className="font-body-md text-on-surface-variant mb-4">Available balance</p>
          <div className="flex gap-2">
            <div className="flex-1 text-center bg-white/5 py-1 rounded">
              <span className="font-label-sm text-label-sm block opacity-50">Used</span>
              <span className="font-body-md text-on-surface">8</span>
            </div>
            <div className="flex-1 text-center bg-white/5 py-1 rounded">
              <span className="font-label-sm text-label-sm block opacity-50">Pending</span>
              <span className="font-body-md text-on-surface">2</span>
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
          <h3 className="font-headline-md text-headline-md mb-1 text-white">$8,420</h3>
          <p className="font-body-md text-on-surface-variant mb-4">Next payout: Nov 1</p>
          <svg className="w-full h-8 stroke-primary stroke-2 fill-none overflow-visible" viewBox="0 0 100 20">
            <path d="M0 15 Q 10 5, 20 12 T 40 10 T 60 15 T 80 5 T 100 12"></path>
          </svg>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Recent Activity Timeline */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-8 stagger-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-headline-md text-headline-md text-white">Recent Activity</h2>
            <button className="text-primary font-label-sm text-label-sm hover:underline bg-transparent border-none cursor-pointer">
              View All
            </button>
          </div>
          <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
            {/* Activity Item 1 */}
            <div className="relative pl-10 flex items-start group">
              <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-surface-container-highest border-2 border-primary flex items-center justify-center z-10 group-hover:scale-125 transition-transform">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-body-lg font-semibold text-on-surface">Clocked In</h4>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Today, 09:14 AM</span>
                </div>
                <p className="font-body-md text-on-surface-variant">Automatic check-in from Office Wi-Fi Hub #4.</p>
              </div>
            </div>

            {/* Activity Item 2 */}
            <div className="relative pl-10 flex items-start group">
              <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-surface-container-highest border-2 border-tertiary flex items-center justify-center z-10 group-hover:scale-125 transition-transform">
                <div className="w-2 h-2 bg-tertiary rounded-full"></div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-body-lg font-semibold text-on-surface">Leave Request Approved</h4>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Yesterday, 04:30 PM</span>
                </div>
                <p className="font-body-md text-on-surface-variant">Your request for 'Annual Vacation' (Oct 28-30) has been approved by HR.</p>
              </div>
            </div>

            {/* Activity Item 3 */}
            <div className="relative pl-10 flex items-start group">
              <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-surface-container-highest border-2 border-secondary flex items-center justify-center z-10 group-hover:scale-125 transition-transform">
                <div className="w-2 h-2 bg-secondary rounded-full"></div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-body-lg font-semibold text-on-surface">Payroll Dispatched</h4>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Oct 20, 11:00 AM</span>
                </div>
                <p className="font-body-md text-on-surface-variant">October Month Salary slip is now available for download.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Team / Colleagues Status */}
        <div className="glass-panel rounded-3xl p-8 stagger-in" style={{ animationDelay: '0.7s' }}>
          <h2 className="font-headline-md text-headline-md text-white mb-8">Team Status</h2>
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
