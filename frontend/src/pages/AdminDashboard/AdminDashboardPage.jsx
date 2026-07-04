import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import StarRating from '../../components/ui/StarRating';
import GlassCard from '../../components/ui/GlassCard';

export default function AdminDashboardPage() {
  const [employees, setEmployees] = useState([
    {
      id: 1,
      name: "Jordan Smith",
      email: "jordan.s@aether.co",
      role: "Senior Architect",
      status: "Active",
      performance: 4,
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCf5G6vNXB7ruEHjmTnDpcfgRBPPe7RpZaAj_BagAvzxTZQRMrI398UsrnBsCNIjewofxfVwmKv67g-4PdIInrtQoBBlz4_pzMXLQPqAVdPwp3fL0h6WjNXR9akL9YdyC4G-VfQwKvA11wH-Q_b6mf_zhfiOx0Ol-EhUZGoPBLiOJnXkb-oUIogI0eT7rNfScrv0GYlzJkjga_cACQKfwf1PE2amYsf_JXZUej4M3mKe8qe0g9bNwtr9lN1JLEVRiDeEgrUq3ujXJw"
    },
    {
      id: 2,
      name: "Elena Rodriguez",
      email: "elena.r@aether.co",
      role: "HR Manager",
      status: "On Leave",
      performance: 5,
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAEBBa3Q-xbJbH_OwSTZPfC4t35TkZeXa2RMylC9Pzg9uMe9ltL272B8B6re6Tcshsofb2RJibfznMJztnGqyKltQruJgdmesDsWncQKv3G-oR5ImLsXknmcQwNl8N7KsLPLLs759X4YbYWvPc-Pl8KPITcgCWVCI05dhcnOpuupNBaiP6iBkFShMcasi4-NS_f4pEwwJExE2qNeGNe3hMs3X4DVT46SjEVWFPVGM2cBMwk0ZHSK0Av-kFWW0aclSCnhHeni28IElE"
    },
    {
      id: 3,
      name: "Sarah Chen",
      email: "sarah.c@aether.co",
      role: "Product Designer",
      status: "Active",
      performance: 4,
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCbobfDQ3VFXDlhLiIUzMNkPs25K5knTr6HkTTwF74beko2DtmjtBG8tv2DVwy91itiiDZxKxsZsFuk6mcDOiX-8xNhGxH1WgenqzEHOjRp8paQObZ094pIpuiy70YuXG0DPJSDF7vGq9r2QeNMV3JpstNx39k7QTA_ZSeDC3Qq8apJm4gi3YlUKVrBtST6Sd6X3WYP2_BIOHbNEB9KKphbThoIhHxr0IW7ObGzEFqSoeFlnnyr7SaMMpj4J1G4VqGUwb--GlxC7_4"
    }
  ]);

  const [leaveRequests, setLeaveRequests] = useState([
    {
      id: 1,
      name: "Mark Thompson",
      type: "Sick Leave",
      duration: "2 Days",
      time: "Today",
      message: '"Feeling under the weather today, need to take a couple of days off to recover. Projects are handed over."',
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC_zQSPKE4mDBwI8Y47iH4zPmHyZzbjMzwqdSqPCN82xfPbgoaO2FfrfBZuO95CQv8k9UfuTgeyQP23wFu2v1_-6dblACb-j2KtCTRykwEIqdgUVEmADkjfKELfGsm0LTVR_A7mILqW1_rrT-AIOdZL7gc_k8V0wW4edaXCMlB3B0p94C_SnG-miGYjRS2MR8iNvD_i4w7_WvCLgKQe6Y2fiqQZ0wmPvHtdrbuzQW7Wh-jYAIcvZDu9u29RD_KiNDWlLxVhIygQBic"
    },
    {
      id: 2,
      name: "Aria Varma",
      type: "Vacation",
      duration: "5 Days",
      time: "12 May",
      message: '"Family trip planned for next week. All deliverables for the current sprint are on track."',
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBY-QFupQWHs5OLP8N4FkEDP4ylrZSK1Xu_lUg86NuyYjkBCGOQvxGTKfP3OgKbVNUA1VlHVz0qmCLLn78g1uRt66OKG7OZS-0a8RKC5CcLucpS3euNiPkuQwKvOStZzm6UsKdJmnBwU-Z564xnxKg584q3yCMGR6nw6th3ROQXaPRX_rdEXuG475Lsfk9GGHu9eVwKgju7PB15DuTa3byNkS6Ehfltl06ioCt6tT8McenaHMXeAlXqeEKFtTWFUi0wqZmYskw9hFw"
    }
  ]);

  const handleApprove = (id) => {
    setLeaveRequests(prev => prev.filter(req => req.id !== id));
  };

  const handleReject = (id) => {
    setLeaveRequests(prev => prev.filter(req => req.id !== id));
  };

  return (
    <DashboardLayout userRole="admin">
      {/* Dashboard Title */}
      <div className="mb-10 animate-fade-in">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2 tracking-tight">Organization Overview</h2>
        <p className="text-on-surface-variant max-w-2xl">Real-time organizational insights and operational metrics for AetherCorp.</p>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-section-gap">
        <StatCard
          icon="groups"
          title="Total Employees"
          value={1248}
          badgeText="+4%"
          badgeType="primary"
          delay="0.1s"
        />
        <StatCard
          icon="how_to_reg"
          title="Present Today"
          value={1142}
          badgeText="92%"
          badgeType="tertiary"
          iconBgColor="bg-tertiary-container/10"
          iconColor="text-tertiary"
          delay="0.2s"
        />
        <StatCard
          icon="event_busy"
          title="Pending Leaves"
          value={14}
          iconBgColor="bg-secondary-container/20"
          iconColor="text-secondary"
          delay="0.3s"
        />
        {/* Payroll Status StatCard */}
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
          <p className="font-label-sm text-on-surface-variant opacity-60 mt-2">Cycle: May 2024</p>
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
              <p className="font-label-sm text-on-surface-variant">Manage 1,248 global employees</p>
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
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img className="w-10 h-10 rounded-full border border-white/10 object-cover" src={emp.avatar} alt={emp.name} />
                        <div>
                          <p className="font-label-sm text-on-surface">{emp.name}</p>
                          <p className="text-[12px] text-on-surface-variant">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant font-label-sm">{emp.role}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={emp.status} />
                    </td>
                    <td className="px-6 py-4">
                      <StarRating rating={emp.performance} />
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
            <p className="font-label-sm text-on-surface-variant text-[12px]">Showing 3 of 1,248 employees</p>
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
            <a className="font-label-sm text-label-sm text-primary hover:underline" href="#">View All</a>
          </div>

          {leaveRequests.length === 0 ? (
            <div className="glass-card p-8 rounded-3xl text-center text-on-surface-variant font-body-md">
              No pending leave requests.
            </div>
          ) : (
            leaveRequests.map(req => (
              <div key={req.id} className="glass-card p-5 rounded-3xl relative group overflow-hidden transition-all duration-300">
                <div className="flex gap-4 mb-4">
                  <img className="w-12 h-12 rounded-2xl border border-white/10 object-cover" src={req.avatar} alt={req.name} />
                  <div>
                    <h4 className="font-label-sm text-on-surface">{req.name}</h4>
                    <p className="text-[12px] text-on-surface-variant">{req.type} • {req.duration}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-[10px] text-on-surface-variant uppercase">{req.time}</p>
                  </div>
                </div>
                <p className="text-body-md text-[14px] text-on-surface-variant mb-6 leading-relaxed">
                  {req.message}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleReject(req.id)}
                    className="py-2.5 rounded-xl border border-error/30 text-error font-bold font-label-sm text-label-sm hover:bg-error/10 active:scale-95 transition-all cursor-pointer bg-transparent"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleApprove(req.id)}
                    className="py-2.5 rounded-xl bg-primary text-on-primary font-bold font-label-sm text-label-sm hover:shadow-[0_0_15px_rgba(104,218,185,0.4)] active:scale-95 transition-all cursor-pointer border-none"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
