import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'job' | 'salary' | 'docs'

  // Personal Info State
  const [fullName, setFullName] = useState('Alexander James Sterling');
  const [personalEmail, setPersonalEmail] = useState('alex.sterling@personal.me');
  const [mobile, setMobile] = useState('+1 (555) 012-9938');

  return (
    <DashboardLayout userRole="employee">
      {/* Page header title */}
      <div className="mb-8 animate-fade-in">
        <h2 className="font-headline-lg text-headline-lg font-bold text-white tracking-tight">Profile</h2>
        <p className="text-on-surface-variant mt-1 font-body-md text-body-md">Manage personal information and view career details.</p>
      </div>

      <div className="pt-4 pb-section-gap">
        {/* Glass Hero Header */}
        <div className="relative w-full rounded-[2rem] overflow-hidden glass-panel mb-8 border border-white/20">
          <div className="h-64 w-full bg-gradient-to-br from-primary-container via-surface-container to-secondary-container opacity-40"></div>
          <div className="absolute inset-0 flex flex-col md:flex-row items-end p-8 gap-8">
            
            {/* Profile Photo Wrapper */}
            <div className="relative group">
              <div className="w-40 h-40 rounded-3xl border-4 border-background overflow-hidden shadow-2xl relative z-20">
                <img 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0EGpYh0MuYFXSjA_sHmqkQ_0z_-5RYf-pRKvuV407fPCWYTFt8NTIuYexLd3OS1XLcVpMVSa0L2a-Lw2LbiYjTP-rtumirmvLjWMLcDJr5Qs3tYPMdjD24_CdbjjkImV8bDDADAQNhW_ITbpKD7L0LlmWrUgGlEGObRtG2wXjmX0fAc1ewi_02hydY9gPvfxrjpVq9RTcgcUua6UwaOOLk5jmsw-LSlvFy9tafwg53Ar9MeHWIDYIy04iRWyyeZEtAuT-5tb6Vog" 
                  alt="Alex Sterling" 
                />
              </div>
              <button className="absolute bottom-[-10px] right-[-10px] z-30 bg-primary text-on-primary p-2 rounded-xl shadow-xl hover:scale-110 transition-transform flex items-center justify-center border-none cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">upload_file</span>
              </button>
            </div>

            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-display-xl text-4xl text-on-surface font-extrabold tracking-tighter">Alex Sterling</h1>
                <StatusBadge status="Active" />
              </div>
              <p className="text-on-surface-variant font-body-lg">Senior Human Resources Lead • Employee ID: #AE-99210</p>
            </div>

            <div className="flex gap-3 pb-2 flex-wrap">
              <button className="px-6 py-3 rounded-xl glass-panel-high text-on-surface font-label-sm border border-white/10 hover:border-primary/50 transition-all flex items-center gap-2 bg-transparent cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">share</span> Share Profile
              </button>
              <button className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold font-label-sm magnetic-btn shadow-lg shadow-primary/20 flex items-center gap-2 border-none cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">edit</span> Edit Profile
              </button>
            </div>

          </div>
        </div>

        {/* Profile Tabs */}
        <div className="flex gap-8 mb-8 border-b border-white/10 overflow-x-auto">
          {[
            { id: 'personal', label: 'PERSONAL', icon: 'person' },
            { id: 'job', label: 'JOB DETAILS', icon: 'work' },
            { id: 'salary', label: 'SALARY STRUCTURE', icon: 'payments' },
            { id: 'docs', label: 'DOCUMENTS', icon: 'description' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 font-label-sm flex items-center gap-2 bg-transparent border-none cursor-pointer transition-all ${
                activeTab === tab.id
                  ? 'text-primary font-bold border-b-2 border-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {/* Personal Details */}
        {activeTab === 'personal' && (
          <div className="tab-content active">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
              {/* Identity Section */}
              <div className="lg:col-span-8 glass-panel rounded-3xl p-8">
                <h3 className="font-headline-md mb-6 flex items-center gap-3 text-white">
                  <span className="material-symbols-outlined text-primary">contact_page</span> Identity Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="font-label-sm text-on-surface-variant uppercase opacity-60">Full Legal Name</label>
                    <input 
                      className="w-full bg-surface-container-low border border-white/5 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary focus:bg-surface-container-high transition-all text-on-surface outline-none" 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="font-label-sm text-on-surface-variant uppercase opacity-60">Date of Birth</label>
                    <div className="relative">
                      <input 
                        className="w-full bg-surface-container-lowest/50 border border-white/5 rounded-xl px-4 py-3 text-on-surface-variant cursor-not-allowed outline-none" 
                        disabled 
                        type="text" 
                        defaultValue="14 May 1992" 
                      />
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[18px]">lock</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-label-sm text-on-surface-variant uppercase opacity-60">Personal Email</label>
                    <input 
                      className="w-full bg-surface-container-low border border-white/5 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary transition-all text-on-surface outline-none" 
                      type="email" 
                      value={personalEmail}
                      onChange={(e) => setPersonalEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-label-sm text-on-surface-variant uppercase opacity-60">Mobile Number</label>
                    <input 
                      className="w-full bg-surface-container-low border border-white/5 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary transition-all text-on-surface outline-none" 
                      type="text" 
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Side stats */}
              <div className="lg:col-span-4 space-y-gutter">
                <div className="glass-panel-high rounded-3xl p-6 border-l-4 border-l-primary">
                  <label className="font-label-sm text-primary uppercase block mb-1">Onboarding Score</label>
                  <div className="flex items-end gap-2 text-white">
                    <span className="font-display-xl text-5xl font-bold">98</span>
                    <span className="font-label-sm pb-2 opacity-50">/ 100</span>
                  </div>
                  <p className="text-xs mt-4 text-on-surface-variant">Top 2% of the workforce. Exceptional cultural alignment recorded in Q1.</p>
                </div>
                
                <div className="glass-panel rounded-3xl p-6">
                  <h4 className="font-label-sm text-on-surface-variant uppercase mb-4">Upcoming Anniversaries</h4>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-tertiary/10 border border-tertiary/20 flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined">cake</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Work Anniversary</p>
                      <p className="text-xs opacity-60 text-on-surface-variant">3 Years • June 12</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Job Details Tab */}
        {activeTab === 'job' && (
          <div className="tab-content active">
            <div className="grid grid-cols-12 gap-gutter">
              <div className="col-span-12 glass-panel rounded-3xl p-8">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="font-headline-md flex items-center gap-3 text-white">
                    <span className="material-symbols-outlined text-primary">badge</span> Professional Status
                  </h3>
                  <button className="text-primary font-label-sm hover:underline bg-transparent border-none cursor-pointer">Request Transfer</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <div className="space-y-1">
                    <p className="font-label-sm opacity-40 uppercase text-on-surface-variant">Current Designation</p>
                    <p className="text-xl font-bold text-white">Senior HR Lead</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-label-sm opacity-40 uppercase text-on-surface-variant">Department</p>
                    <p className="text-xl font-bold text-white">People & Operations</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-label-sm opacity-40 uppercase text-on-surface-variant">Direct Manager</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-secondary"></div>
                      <p className="text-lg font-medium text-white">Sarah Jenkins</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="font-label-sm opacity-40 uppercase text-on-surface-variant">Employment Type</p>
                    <p className="text-xl font-bold text-white">Full Time / Permanent</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-label-sm opacity-40 uppercase text-on-surface-variant">Work Location</p>
                    <p className="text-xl font-bold text-white">Seattle HQ (Remote Eligible)</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-label-sm opacity-40 uppercase text-on-surface-variant">Probation Status</p>
                    <p className="text-xl font-bold text-primary">Completed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Salary Tab */}
        {activeTab === 'salary' && (
          <div className="tab-content active">
            <div className="glass-panel rounded-3xl overflow-hidden">
              <div className="p-8 bg-white/5 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                  <h3 className="font-headline-md mb-1 text-white">Compensation Package</h3>
                  <p className="font-body-md text-on-surface-variant">Confidential Financial Summary (FY 2024-25)</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-label-sm opacity-50 uppercase text-on-surface-variant">Annual CTC</p>
                  <p className="text-3xl font-display-xl font-extrabold text-primary">$142,500.00</p>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center p-4 rounded-2xl hover:bg-white/5 transition-all">
                  <span className="font-body-md text-white">Basic Salary</span>
                  <div className="flex items-center gap-4">
                    <span className="font-label-sm font-bold text-white">$78,000.00</span>
                    <span className="material-symbols-outlined text-on-surface-variant/30">lock</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 rounded-2xl hover:bg-white/5 transition-all">
                  <span className="font-body-md text-white">HRA (House Rent Allowance)</span>
                  <div className="flex items-center gap-4">
                    <span className="font-label-sm font-bold text-white">$32,000.00</span>
                    <span className="material-symbols-outlined text-on-surface-variant/30">lock</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 rounded-2xl hover:bg-white/5 transition-all">
                  <span className="font-body-md text-white">Variable Performance Bonus</span>
                  <div className="flex items-center gap-4">
                    <span className="font-label-sm font-bold text-white">$12,500.00</span>
                    <span className="material-symbols-outlined text-primary">info</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 rounded-2xl hover:bg-white/5 transition-all">
                  <span className="font-body-md text-white">Stock Options (RSUs)</span>
                  <div className="flex items-center gap-4">
                    <span className="font-label-sm font-bold text-white">250 Units / Year</span>
                    <span className="material-symbols-outlined text-on-surface-variant/30">lock</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'docs' && (
          <div className="tab-content active">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {/* Doc Item 1 */}
              <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4 hover:scale-[1.02] transition-all cursor-pointer group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all">
                  <span className="material-symbols-outlined">contract</span>
                </div>
                <div>
                  <h4 className="font-bold text-white">Employment Contract</h4>
                  <p className="text-xs opacity-50 text-on-surface-variant">PDF • Signed May 2021</p>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-[10px] font-label-sm text-primary uppercase">Verified</span>
                  <span className="material-symbols-outlined text-[18px] opacity-40 text-on-surface">download</span>
                </div>
              </div>
              
              {/* Doc Item 2 */}
              <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4 hover:scale-[1.02] transition-all cursor-pointer group">
                <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:bg-tertiary group-hover:text-on-tertiary transition-all">
                  <span className="material-symbols-outlined">verified_user</span>
                </div>
                <div>
                  <h4 className="font-bold text-white">Insurance Policy</h4>
                  <p className="text-xs opacity-50 text-on-surface-variant">PDF • Updated Feb 2024</p>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-[10px] font-label-sm text-primary uppercase">Active</span>
                  <span className="material-symbols-outlined text-[18px] opacity-40 text-on-surface">download</span>
                </div>
              </div>

              {/* Doc Item 3 */}
              <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4 hover:scale-[1.02] transition-all cursor-pointer group border-dashed border-white/20 bg-transparent">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined">add</span>
                </div>
                <div>
                  <h4 className="font-bold text-white">Upload Document</h4>
                  <p className="text-xs opacity-50 text-on-surface-variant">Passport, Degree, etc.</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
