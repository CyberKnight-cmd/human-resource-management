import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/attendance', icon: 'calendar_today', label: 'Attendance' },
  { to: '/leave', icon: 'flight_takeoff', label: 'Leave' },
  { to: '/payroll', icon: 'payments', label: 'Payroll' },
  { to: '/profile', icon: 'manage_accounts', label: 'Account' },
];

export default function Sidebar({ userRole = 'employee', isOpen = false, onClose = () => {}, isCollapsed = false, onToggleCollapse = () => {} }) {
  const navigate = useNavigate();

  const handleClockIn = () => {
    alert('Clock In triggered');
  };

  const dashboardPath = userRole === 'admin' ? '/admin' : '/employee';

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl transition-all duration-200 ${isCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'} ${
      isActive
        ? 'bg-primary/10 text-primary shadow-[0_0_20px_rgba(104,218,185,0.2)] lg:border-r-4 border-primary'
        : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
    }`;

  return (
    <nav
      className={`fixed left-0 top-0 h-screen z-[60] flex flex-col p-gutter bg-surface-container/95 lg:bg-surface-container/60 backdrop-blur-2xl border-r border-white/10 shadow-2xl transform transition-all duration-300 ease-out w-72 sm:w-64 ${
        isCollapsed ? 'lg:w-20' : 'lg:w-64'
      } ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
    >
      <div className={`flex items-center gap-3 mb-10 px-2 ${isCollapsed ? 'lg:justify-center lg:px-0' : 'justify-between'}`}>
        <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:gap-0' : ''}`}>
          <div className="w-10 h-10 shrink-0 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(104,218,185,0.4)]">
            <span className="material-symbols-outlined text-on-primary fill" style={{ fontVariationSettings: "'FILL' 1" }}>
              corporate_fare
            </span>
          </div>
          <div className={isCollapsed ? 'lg:hidden' : ''}>
            <h1 className="font-headline-md text-headline-md font-extrabold text-primary leading-tight whitespace-nowrap">AetherCorp</h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant opacity-70 whitespace-nowrap">Enterprise HR</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`lg:hidden w-9 h-9 shrink-0 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-white/5 hover:text-on-surface transition-all bg-transparent border-none cursor-pointer ${isCollapsed ? 'lg:hidden' : ''}`}
          aria-label="Close navigation"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="flex flex-col gap-2 flex-grow overflow-y-auto overflow-x-hidden">
        <NavLink to={dashboardPath} className={linkClass} onClick={onClose} title="Dashboard">
          <span className="material-symbols-outlined shrink-0">dashboard</span>
          <span className={`font-label-sm text-label-sm whitespace-nowrap ${isCollapsed ? 'lg:hidden' : ''}`}>Dashboard</span>
        </NavLink>

        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass} onClick={onClose} title={item.label}>
            <span className="material-symbols-outlined shrink-0">{item.icon}</span>
            <span className={`font-label-sm text-label-sm whitespace-nowrap ${isCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Desktop collapse/expand toggle */}
      <button
        onClick={onToggleCollapse}
        className={`hidden lg:flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-white/5 hover:text-on-surface transition-all bg-transparent border-none cursor-pointer mb-2 ${isCollapsed ? 'justify-center' : ''}`}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <span className="material-symbols-outlined shrink-0">{isCollapsed ? 'chevron_right' : 'chevron_left'}</span>
        <span className={`font-label-sm text-label-sm whitespace-nowrap ${isCollapsed ? 'lg:hidden' : ''}`}>Collapse</span>
      </button>

      <div className="mt-auto space-y-4 pt-6 border-t border-white/5">
        <button
          onClick={handleClockIn}
          title="Clock In"
          className={`w-full bg-primary text-on-primary py-3 rounded-xl font-bold font-label-sm text-label-sm shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer`}
        >
          <span className="material-symbols-outlined text-[20px] shrink-0">timer</span>
          <span className={isCollapsed ? 'lg:hidden' : ''}>Clock In</span>
        </button>

        <div className="space-y-1">
          <Link
            to="/support"
            title="Support"
            className={`flex items-center gap-3 px-4 py-2 rounded-xl text-on-surface-variant hover:bg-white/5 transition-all text-decoration-none ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">contact_support</span>
            <span className={`font-label-sm text-label-sm whitespace-nowrap ${isCollapsed ? 'lg:hidden' : ''}`}>Support</span>
          </Link>
          <button
            onClick={() => navigate('/')}
            title="Log Out"
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-on-surface-variant hover:bg-white/5 transition-all text-left bg-transparent border-none cursor-pointer ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">logout</span>
            <span className={`font-label-sm text-label-sm whitespace-nowrap ${isCollapsed ? 'lg:hidden' : ''}`}>Log Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
