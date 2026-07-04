import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ProgressBar from '../../components/ui/ProgressBar';
import { useAuth } from '../../context/AuthContext';
import { getMyPayroll, getEmployeePayroll, updateEmployeePayroll } from '../../api/payroll';
import { listEmployees } from '../../api/users';

const inr = (value) => `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const todayStr = () => new Date().toISOString().slice(0, 10);

export default function PayrollPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [myPayroll, setMyPayroll] = useState(null);
  const [myPayrollError, setMyPayrollError] = useState('');

  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [history, setHistory] = useState([]);

  const [basicPay, setBasicPay] = useState('0');
  const [hra, setHra] = useState('0');
  const [allowances, setAllowances] = useState('0');
  const [deductions, setDeductions] = useState('0');
  const [effectiveFrom, setEffectiveFrom] = useState(todayStr());
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getMyPayroll()
      .then(setMyPayroll)
      .catch((err) => setMyPayrollError(err.message || 'No salary structure has been set up yet'));
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    listEmployees(50, 0)
      .then((page) => {
        setEmployees(page.items);
        if (page.items.length > 0) setSelectedEmployeeId(page.items[0].id);
      })
      .catch(() => {});
  }, [isAdmin]);

  const loadHistory = useCallback((employeeId) => {
    if (!employeeId) return;
    getEmployeePayroll(employeeId)
      .then((rows) => {
        setHistory(rows);
        const current = rows.find((r) => r.is_current) || rows[0];
        if (current) {
          setBasicPay(String(current.basic_pay));
          setHra(String(current.hra));
          setAllowances(String(current.allowances));
          setDeductions(String(current.deductions));
        } else {
          setBasicPay('0');
          setHra('0');
          setAllowances('0');
          setDeductions('0');
        }
      })
      .catch(() => setHistory([]));
  }, []);

  useEffect(() => {
    if (isAdmin && selectedEmployeeId) loadHistory(selectedEmployeeId);
  }, [isAdmin, selectedEmployeeId, loadHistory]);

  const handleSave = async () => {
    setSaveError('');
    setSaveSuccess(false);
    setIsSaving(true);
    try {
      await updateEmployeePayroll(selectedEmployeeId, {
        basic_pay: Number(basicPay),
        hra: Number(hra),
        allowances: Number(allowances),
        deductions: Number(deductions),
        effective_from: effectiveFrom,
      });
      setSaveSuccess(true);
      loadHistory(selectedEmployeeId);
    } catch (err) {
      setSaveError(err.message || 'Could not save this revision');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    const current = history.find((r) => r.is_current);
    if (current) {
      setBasicPay(String(current.basic_pay));
      setHra(String(current.hra));
      setAllowances(String(current.allowances));
      setDeductions(String(current.deductions));
    }
    setEffectiveFrom(todayStr());
    setSaveError('');
    setSaveSuccess(false);
  };

  const gross = myPayroll ? Number(myPayroll.basic_pay) + Number(myPayroll.hra) + Number(myPayroll.allowances) : 0;
  const net = myPayroll ? Number(myPayroll.net_pay) : 0;
  const deductionsAmount = myPayroll ? Number(myPayroll.deductions) : 0;
  const netArc = gross > 0 ? Math.round((net / gross) * 251) : 0;
  const deductionsArc = gross > 0 ? Math.round((deductionsAmount / gross) * 251) : 0;

  return (
    <DashboardLayout userRole={isAdmin ? 'admin' : 'employee'}>
      {/* Top Navbar Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-fade-in">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-white tracking-tight">Payroll</h2>
          <p className="text-on-surface-variant mt-1 font-body-md text-body-md">Track compensation details and configure salary structures.</p>
        </div>
        <div className="bg-surface-container px-3 py-1 rounded-full border border-white/5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-tighter">
            {myPayroll ? `Effective: ${new Date(myPayroll.effective_from).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : 'No active structure'}
          </span>
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

        {myPayrollError && !myPayroll && (
          <div className="lg:col-span-12 glass-card rounded-3xl p-8 text-on-surface-variant font-body-md">{myPayrollError}</div>
        )}

        {myPayroll && (
          <>
            {/* Employee Glass Salary Card */}
            <div className="lg:col-span-8 glass-card rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full -mr-16 -mt-16"></div>

              {/* Donut Chart Container */}
              <div className="relative w-56 h-56 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" fill="transparent" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="12"></circle>
                  <circle className="donut-segment" cx="50" cy="50" fill="transparent" r="40" stroke="#68dab9" strokeDasharray={`${netArc} 251`} strokeLinecap="round" strokeWidth="12"></circle>
                  <circle className="donut-segment" cx="50" cy="50" fill="transparent" r="40" stroke="#ffb4ab" strokeDasharray={`${deductionsArc} 251`} strokeDashoffset={`-${netArc}`} strokeLinecap="round" strokeWidth="12"></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-label-sm text-[10px] uppercase text-on-surface-variant">Net Payout</span>
                  <span className="font-display-xl text-[28px] font-extrabold text-white tracking-tight">{inr(net)}</span>
                </div>
              </div>

              {/* Breakdown Details */}
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Gross Monthly Income</p>
                    <h3 className="font-headline-lg text-headline-lg font-bold text-white">{inr(gross)}</h3>
                  </div>
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
                    <span className="font-label-sm text-label-sm text-primary font-bold">+{inr(Number(myPayroll.basic_pay) + Number(myPayroll.hra))}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 bg-tertiary-container rounded-full"></div>
                      <div>
                        <p className="font-label-sm text-label-sm text-white font-medium">Allowances</p>
                        <p className="text-[12px] text-on-surface-variant">Variable component</p>
                      </div>
                    </div>
                    <span className="font-label-sm text-label-sm text-tertiary font-bold">+{inr(myPayroll.allowances)}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-error-container/10 border border-error/10">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 bg-error rounded-full"></div>
                      <div>
                        <p className="font-label-sm text-label-sm text-white font-medium">Tax & Deductions</p>
                        <p className="text-[12px] text-on-surface-variant">Statutory withholding</p>
                      </div>
                    </div>
                    <span className="font-label-sm text-label-sm text-error font-bold">-{inr(myPayroll.deductions)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Summary Card */}
            <div className="lg:col-span-4 glass-card rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Current Structure</span>
                  <span className="material-symbols-outlined text-primary">account_balance</span>
                </div>
                <h4 className="font-headline-md text-headline-md font-bold mb-6 text-white">Compensation Split</h4>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-[12px] mb-1">
                      <span className="text-on-surface-variant">Net of Gross</span>
                      <span className="text-white">{gross > 0 ? Math.round((net / gross) * 100) : 0}%</span>
                    </div>
                    <ProgressBar value={gross > 0 ? (net / gross) * 100 : 0} color="primary" />
                  </div>

                  <div>
                    <div className="flex justify-between text-[12px] mb-1">
                      <span className="text-on-surface-variant">Deductions of Gross</span>
                      <span className="text-white">{gross > 0 ? Math.round((deductionsAmount / gross) * 100) : 0}%</span>
                    </div>
                    <ProgressBar value={gross > 0 ? (deductionsAmount / gross) * 100 : 0} color="tertiary" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Admin View Section */}
        {isAdmin && (
          <div className="lg:col-span-12 mt-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="font-headline-md text-headline-md font-bold flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
                Salary Structure Administration
              </h2>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="bg-surface-container border border-white/10 rounded-xl px-4 py-2 font-label-sm text-label-sm text-on-surface outline-none"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-gutter">

              {/* Version Timeline */}
              <div className="xl:col-span-1 glass-card rounded-3xl p-6">
                <h3 className="font-label-sm text-label-sm font-bold text-on-surface-variant mb-6 uppercase tracking-widest">Version History</h3>
                {history.length === 0 && <p className="text-on-surface-variant font-body-md text-sm">No structure set up yet.</p>}
                <div className="relative space-y-0">
                  <div className="absolute left-4 top-2 bottom-2 w-[1px] bg-white/10"></div>
                  {history.map((row, index) => (
                    <div key={row.id} className={`relative flex gap-6 ${index < history.length - 1 ? 'pb-8' : ''} ${row.is_current ? '' : 'opacity-60 hover:opacity-100 transition-opacity'}`}>
                      <div className={`z-10 w-8 h-8 rounded-full border-4 border-surface flex items-center justify-center ${row.is_current ? 'bg-primary' : 'bg-surface-container'}`}>
                        {row.is_current ? (
                          <span className="material-symbols-outlined text-[14px] text-on-primary">check</span>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-on-surface-variant"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="font-label-sm text-label-sm font-bold text-white">{new Date(row.effective_from).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          {row.is_current && <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">ACTIVE</span>}
                        </div>
                        <p className="text-[12px] text-on-surface-variant">Net pay: {inr(row.net_pay)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Editable Structure Config Table */}
              <div className="xl:col-span-2 glass-card rounded-3xl overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                    <h3 className="font-label-sm text-label-sm font-bold text-white uppercase tracking-widest">New Revision</h3>
                    <span className="font-label-sm text-[10px] text-on-surface-variant">EDITING MODE ACTIVE</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead className="bg-surface-container-high">
                        <tr>
                          <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase">Pay Component</th>
                          <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase">Type</th>
                          <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase">Amount (INR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {[
                          { label: 'Basic Salary', desc: 'Primary compensation base', value: basicPay, setter: setBasicPay, tag: 'FIXED' },
                          { label: 'HRA', desc: 'Tax-exempt housing allowance', value: hra, setter: setHra, tag: 'FIXED' },
                          { label: 'Allowances', desc: 'Variable target bonus', value: allowances, setter: setAllowances, tag: 'VARIABLE' },
                          { label: 'Deductions', desc: 'Statutory withholding', value: deductions, setter: setDeductions, tag: 'VARIABLE' },
                        ].map((row) => (
                          <tr key={row.label} className="hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-5">
                              <div className="font-body-md text-white font-medium">{row.label}</div>
                              <div className="text-[11px] text-on-surface-variant">{row.desc}</div>
                            </td>
                            <td className="px-6 py-5">
                              <span className={`px-3 py-1 rounded-full font-label-sm text-[10px] font-bold ${row.tag === 'FIXED' ? 'bg-primary/10 text-primary' : 'bg-tertiary/10 text-tertiary'}`}>{row.tag}</span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="relative max-w-[140px]">
                                <input
                                  className="bg-surface-container border border-white/10 rounded-lg px-3 py-1 text-label-sm w-full focus:ring-1 focus:ring-primary outline-none text-on-surface"
                                  type="number"
                                  min="0"
                                  value={row.value}
                                  onChange={(e) => row.setter(e.target.value)}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td className="px-6 py-5">
                            <div className="font-body-md text-white font-medium">Effective From</div>
                          </td>
                          <td className="px-6 py-5"></td>
                          <td className="px-6 py-5">
                            <input
                              className="bg-surface-container border border-white/10 rounded-lg px-3 py-1 text-label-sm max-w-[160px] focus:ring-1 focus:ring-primary outline-none text-on-surface"
                              type="date"
                              value={effectiveFrom}
                              onChange={(e) => setEffectiveFrom(e.target.value)}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                {saveError && <p className="text-error font-body-md text-sm px-6 pt-4">{saveError}</p>}
                {saveSuccess && <p className="text-primary font-body-md text-sm px-6 pt-4">New salary structure saved.</p>}
                <div className="p-4 bg-surface-container-high/50 flex justify-end gap-3 border-t border-white/5 mt-6">
                  <button onClick={handleDiscard} className="px-4 py-2 font-label-sm text-label-sm text-on-surface-variant hover:text-white transition-all bg-transparent border-none cursor-pointer">Discard Changes</button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !selectedEmployeeId}
                    className="px-6 py-2 bg-primary text-on-primary font-bold rounded-xl font-label-sm text-label-sm shadow-xl hover:scale-[0.98] transition-all border-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving…' : 'Save Structure'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
