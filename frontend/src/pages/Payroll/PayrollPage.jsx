import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/ui/GlassCard';
import ProgressBar from '../../components/ui/ProgressBar';

export default function PayrollPage() {
  const [basicPct, setBasicPct] = useState('100%');
  const [hraPct, setHraPct] = useState('40%');
  const [incentivePlan, setIncentivePlan] = useState('Formula_A');

  const handleSave = () => {
    alert(`Salary Structure Saved!\nBasic: ${basicPct}\nHRA: ${hraPct}\nIncentive: ${incentivePlan}`);
  };

  const handleDiscard = () => {
    setBasicPct('100%');
    setHraPct('40%');
    setIncentivePlan('Formula_A');
    alert('Changes discarded.');
  };

  return (
    <DashboardLayout userRole="employee">
      {/* Top Navbar Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-fade-in">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-white tracking-tight">Payroll</h2>
          <p className="text-on-surface-variant mt-1 font-body-md text-body-md">Track compensation details and configure salary structures.</p>
        </div>
        <div className="bg-surface-container px-3 py-1 rounded-full border border-white/5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-tighter">Current Period: Oct 2023</span>
        </div>
      </div>

      {/* Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter max-w-[1400px] mx-auto">
        
        {/* Section Title: Employee View */}
        <div className="lg:col-span-12 mt-4">
          <h2 className="font-headline-md text-headline-md font-bold flex items-center gap-2 text-white">
            <span className="material-symbols-outlined text-primary">person</span>
            My Compensation
          </h2>
        </div>

        {/* Employee Glass Salary Card */}
        <div className="lg:col-span-8 glass-card rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full -mr-16 -mt-16"></div>
          
          {/* Donut Chart Container */}
          <div className="relative w-56 h-56 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background */}
              <circle cx="50" cy="50" fill="transparent" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="12"></circle>
              {/* Net Pay (Emerald) */}
              <circle className="donut-segment" cx="50" cy="50" fill="transparent" r="40" stroke="#68dab9" strokeDasharray="188 251" strokeLinecap="round" strokeWidth="12"></circle>
              {/* Deductions (Coral) */}
              <circle className="donut-segment" cx="50" cy="50" fill="transparent" r="40" stroke="#ffb4ab" strokeDasharray="40 251" strokeDashoffset="-188" strokeLinecap="round" strokeWidth="12"></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-label-sm text-[10px] uppercase text-on-surface-variant">Net Payout</span>
              <span className="font-display-xl text-[32px] font-extrabold text-white tracking-tight">$8,420</span>
            </div>
          </div>

          {/* Breakdown Details */}
          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Gross Monthly Income</p>
                <h3 className="font-headline-lg text-headline-lg font-bold text-white">$10,250.00</h3>
              </div>
              <button className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-primary/50 px-4 py-2 rounded-xl transition-all magnetic-button cursor-pointer text-on-surface">
                <span className="material-symbols-outlined text-[20px]">download</span>
                <span className="font-label-sm text-label-sm">Oct_Payslip.pdf</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-primary rounded-full"></div>
                  <div>
                    <p className="font-label-sm text-label-sm text-white font-medium">Basic Salary + HRA</p>
                    <p className="text-[12px] text-on-surface-variant">Fixed component</p>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm text-primary font-bold">+$9,500.00</span>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-tertiary-container rounded-full"></div>
                  <div>
                    <p className="font-label-sm text-label-sm text-white font-medium">Performance Bonus</p>
                    <p className="text-[12px] text-on-surface-variant">Variable quarterly</p>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm text-tertiary font-bold">+$750.00</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-error-container/10 border border-error/10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-error rounded-full"></div>
                  <div>
                    <p className="font-label-sm text-label-sm text-white font-medium">Tax & Deductions</p>
                    <p className="text-[12px] text-on-surface-variant">Statutory withholding</p>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm text-error font-bold">-$1,830.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tax Summary Card */}
        <div className="lg:col-span-4 glass-card rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="font-label-sm text-label-sm text-on-surface-variant">YTD Contributions</span>
              <span className="material-symbols-outlined text-primary">account_balance</span>
            </div>
            <h4 className="font-headline-md text-headline-md font-bold mb-6 text-white">Tax Savings Pool</h4>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-on-surface-variant">Section 80C Limit</span>
                  <span className="text-white">75% Used</span>
                </div>
                <ProgressBar value={75} color="primary" />
              </div>
              
              <div>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-on-surface-variant">Medical Insurance</span>
                  <span className="text-white">Completed</span>
                </div>
                <ProgressBar value={100} color="primary" />
              </div>
            </div>
          </div>
          <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
            <p className="text-[13px] leading-relaxed text-primary-fixed-dim">
              <span className="font-bold">Pro-tip:</span> You can save an additional <span class="font-bold">$420</span> in taxes by declaring your rent receipts before the 25th.
            </p>
          </div>
        </div>

        {/* Admin View Section */}
        <div className="lg:col-span-12 mt-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="font-headline-md text-headline-md font-bold flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
              Salary Structure Administration
            </h2>
            <div className="flex gap-3">
              <button className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 font-label-sm text-label-sm transition-all bg-transparent text-on-surface cursor-pointer">Export Report</button>
              <button className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold font-label-sm text-label-sm hover:shadow-[0_0_20px_rgba(104,218,185,0.4)] transition-all flex items-center gap-2 border-none cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">add</span> New Revision
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-gutter">
            
            {/* Version Timeline */}
            <div className="xl:col-span-1 glass-card rounded-3xl p-6">
              <h3 className="font-label-sm text-label-sm font-bold text-on-surface-variant mb-6 uppercase tracking-widest">Version History</h3>
              <div className="relative space-y-0">
                {/* Vertical Line */}
                <div className="absolute left-4 top-2 bottom-2 w-[1px] bg-white/10"></div>
                
                {/* Timeline Item Active */}
                <div className="relative flex gap-6 pb-8">
                  <div className="z-10 w-8 h-8 rounded-full bg-primary border-4 border-surface flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px] text-on-primary">check</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-label-sm text-label-sm font-bold text-white">V4.2 - Current</p>
                      <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">ACTIVE</span>
                    </div>
                    <p className="text-[12px] text-on-surface-variant">Effective: Oct 01, 2023</p>
                    <p className="text-[12px] text-on-surface-variant mt-2 italic">Adjusted for regional inflation across APAC offices.</p>
                  </div>
                </div>

                {/* Timeline Item Previous */}
                <div className="relative flex gap-6 pb-8 opacity-60 hover:opacity-100 transition-opacity">
                  <div className="z-10 w-8 h-8 rounded-full bg-surface-container border-4 border-surface flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-on-surface-variant"></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-label-sm text-label-sm font-bold text-white">V4.1</p>
                    <p className="text-[12px] text-on-surface-variant">Jan 01, 2023 - Sep 30, 2023</p>
                  </div>
                </div>

                {/* Timeline Item Oldest */}
                <div className="relative flex gap-6">
                  <div className="z-10 w-8 h-8 rounded-full bg-surface-container border-4 border-surface flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-on-surface-variant"></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-label-sm text-label-sm font-bold text-white">V4.0 - Initial Legacy</p>
                    <p className="text-[12px] text-on-surface-variant">Jul 2022 - Dec 2022</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Structure Config Table */}
            <div className="xl:col-span-2 glass-card rounded-3xl overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                  <h3 className="font-label-sm text-label-sm font-bold text-white uppercase tracking-widest">Global Structure Config (V4.2)</h3>
                  <span className="font-label-sm text-[10px] text-on-surface-variant">EDITING MODE ACTIVE</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead className="bg-surface-container-high">
                      <tr>
                        <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase">Pay Component</th>
                        <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase">Type</th>
                        <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase">Formula / % of Basic</th>
                        <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="font-body-md text-white font-medium">Basic Salary</div>
                          <div className="text-[11px] text-on-surface-variant">Primary compensation base</div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-[10px] font-bold">FIXED</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="relative max-w-[120px]">
                            <input 
                              className="bg-surface-container border border-white/10 rounded-lg px-3 py-1 text-label-sm w-full focus:ring-1 focus:ring-primary outline-none text-on-surface" 
                              type="text" 
                              value={basicPct}
                              onChange={(e) => setBasicPct(e.target.value)}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button className="p-2 text-on-surface-variant hover:text-white bg-transparent border-none cursor-pointer"><span className="material-symbols-outlined">edit_note</span></button>
                        </td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="font-body-md text-white font-medium">HRA (Housing)</div>
                          <div className="text-[11px] text-on-surface-variant">Tax-exempt housing allowance</div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-[10px] font-bold">FIXED</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="relative max-w-[120px]">
                            <input 
                              className="bg-surface-container border border-white/10 rounded-lg px-3 py-1 text-label-sm w-full focus:ring-1 focus:ring-primary outline-none text-on-surface" 
                              type="text" 
                              value={hraPct}
                              onChange={(e) => setHraPct(e.target.value)}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button className="p-2 text-on-surface-variant hover:text-white bg-transparent border-none cursor-pointer"><span className="material-symbols-outlined">edit_note</span></button>
                        </td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="font-body-md text-white font-medium">Incentive Plan</div>
                          <div className="text-[11px] text-on-surface-variant">Variable target bonus</div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-3 py-1 rounded-full bg-tertiary/10 text-tertiary font-label-sm text-[10px] font-bold">VARIABLE</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="relative max-w-[120px]">
                            <input 
                              className="bg-surface-container border border-white/10 rounded-lg px-3 py-1 text-label-sm w-full focus:ring-1 focus:ring-primary outline-none text-on-surface" 
                              type="text" 
                              value={incentivePlan}
                              onChange={(e) => setIncentivePlan(e.target.value)}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button className="p-2 text-on-surface-variant hover:text-white bg-transparent border-none cursor-pointer"><span className="material-symbols-outlined">edit_note</span></button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="p-4 bg-surface-container-high/50 flex justify-end gap-3 border-t border-white/5 mt-6">
                <button onClick={handleDiscard} className="px-4 py-2 font-label-sm text-label-sm text-on-surface-variant hover:text-white transition-all bg-transparent border-none cursor-pointer">Discard Changes</button>
                <button onClick={handleSave} className="px-6 py-2 bg-primary text-on-primary font-bold rounded-xl font-label-sm text-label-sm shadow-xl hover:scale-[0.98] transition-all border-none cursor-pointer">Save Structure</button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
