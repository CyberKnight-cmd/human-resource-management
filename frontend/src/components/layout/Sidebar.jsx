import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';

export default function Sidebar({ userRole = 'employee' }) {
  const navigate = useNavigate();

  const handleClockIn = () => {
    // Action trigger for clock in
    alert('Clock In triggered');
  };

  const dashboardPath = userRole === 'admin' ? '/admin' : '/employee';

  return (
    <nav className="fixed left-0 top-0 h-screen w-64 z-[60] flex flex-col p-gutter bg-surface-container/60 backdrop-blur-2xl border-r border-white/10 shadow-2xl">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(104,218,185,0.4)]">
          <span className="material-symbols-outlined text-on-primary fill" style={{ fontVariationSettings: "'FILL' 1" }}>
            corporate_fare
          </span>
        </div>
        <div>
          <h1 className="font-headline-md text-headline-md font-extrabold text-primary leading-tight">AetherCorp</h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant opacity-70">Enterprise HR</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-grow overflow-y-auto">
        <NavLink
          to={dashboardPath}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive
                ? 'bg-primary/10 text-primary shadow-[0_0_20px_rgba(104,218,185,0.2)] border-r-4 border-primary'
                : 'text-on-surface-variant hover:text-on-surface hover:backdrop-blur-3xl hover:bg-white/5'
            }`
          }
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-label-sm text-label-sm">Dashboard</span>
        </NavLink>

        <NavLink
          to="/attendance"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive
                ? 'bg-primary/10 text-primary shadow-[0_0_20px_rgba(104,218,185,0.2)] border-r-4 border-primary'
                : 'text-on-surface-variant hover:text-on-surface hover:backdrop-blur-3xl hover:bg-white/5'
            }`
          }
        >
          <span className="material-symbols-outlined">calendar_today</span>
          <span className="font-label-sm text-label-sm">Attendance</span>
        </NavLink>

        <NavLink
          to="/leave"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive
                ? 'bg-primary/10 text-primary shadow-[0_0_20px_rgba(104,218,185,0.2)] border-r-4 border-primary'
                : 'text-on-surface-variant hover:text-on-surface hover:backdrop-blur-3xl hover:bg-white/5'
            }`
          }
        >
          <span className="material-symbols-outlined">flight_takeoff</span>
          <span className="font-label-sm text-label-sm">Leave</span>
        </NavLink>

        <NavLink
          to="/payroll"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive
                ? 'bg-primary/10 text-primary shadow-[0_0_20px_rgba(104,218,185,0.2)] border-r-4 border-primary'
                : 'text-on-surface-variant hover:text-on-surface hover:backdrop-blur-3xl hover:bg-white/5'
            }`
          }
        >
          <span className="material-symbols-outlined">payments</span>
          <span className="font-label-sm text-label-sm">Payroll</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive
                ? 'bg-primary/10 text-primary shadow-[0_0_20px_rgba(104,218,185,0.2)] border-r-4 border-primary'
                : 'text-on-surface-variant hover:text-on-surface hover:backdrop-blur-3xl hover:bg-white/5'
            }`
          }
        >
          <span className="material-symbols-outlined">manage_accounts</span>
          <span className="font-label-sm text-label-sm">Account</span>
        </NavLink>
      </div>

      <div className="mt-auto space-y-4 pt-6 border-t border-white/5">
        <button
          onClick={handleClockIn}
          className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold font-label-sm text-label-sm shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">timer</span>
          Clock In
        </button>

        <div className="space-y-1">
          <Link
            to="/support"
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-on-surface-variant hover:bg-white/5 transition-all text-decoration-none"
          >
            <span className="material-symbols-outlined text-[20px]">contact_support</span>
            <span className="font-label-sm text-label-sm">Support</span>
          </Link>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-on-surface-variant hover:bg-white/5 transition-all text-left bg-transparent border-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="font-label-sm text-label-sm">Log Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
