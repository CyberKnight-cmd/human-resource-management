import React from 'react';
import { Link } from 'react-router-dom';

export default function Topbar({
  searchPlaceholder = "Search employees, documents, or reports...",
  userName = "Alex Rivera",
  userRole = "Administrator",
  userAvatar = "https://lh3.googleusercontent.com/aida-public/AB6AXuDTtkFI0Em5-kZ3CLM-BWjpPR4q3HNOYsajT-0BJzu7asojs1u1MhJ2B2DtmDHUV6Ec6-1Ao8MZV8r4GfQlHadWM2iugG6QTN9JzFYer7bdt8b6opsvId5eFtwe8Ae7Mpsa2GUd6kcTRU0RFUFlIwALikJw84R-vqkeTf2XjBoLz8ui_A25hTmnfleccl7B3NqwkuNzfX9xSrJ-2tYWMU8wshyvdkAlsH-H8eF7djQPV6_XC9hQRPyzHseu6N9nylxlbyD-8p5b7cQ",
  onMenuClick = () => {},
  isCollapsed = false,
}) {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-16 bg-surface/80 lg:bg-surface/60 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 lg:px-container-padding flex justify-between items-center gap-4 shadow-sm transition-[left] duration-300 ${
        isCollapsed ? 'lg:left-20' : 'lg:left-64'
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-all text-on-surface cursor-pointer border-none bg-transparent"
          aria-label="Open navigation"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div className="relative group min-w-0 flex-1 max-w-[10rem] sm:max-w-xs md:max-w-sm lg:max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
            search
          </span>
          <input
            className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-1.5 w-full text-body-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-on-surface placeholder:text-on-surface-variant/30"
            placeholder={searchPlaceholder}
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <button className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full hover:bg-white/5 transition-all text-on-surface-variant cursor-pointer border-none bg-transparent">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full hover:bg-white/5 transition-all text-on-surface-variant cursor-pointer border-none bg-transparent">
          <span className="material-symbols-outlined">help</span>
        </button>
        <div className="hidden sm:block h-8 w-[1px] bg-white/10 mx-2"></div>
        <Link to="/profile" className="flex items-center gap-3 pl-2 hover:opacity-80 transition-all text-decoration-none">
          <div className="text-right hidden md:block">
            <p className="font-label-sm text-label-sm text-on-surface">{userName}</p>
            <p className="font-label-sm text-[10px] text-primary">{userRole}</p>
          </div>
          <img
            className="w-10 h-10 shrink-0 rounded-full border border-primary/20 object-cover"
            src={userAvatar}
            alt={userName}
          />
        </Link>
      </div>
    </header>
  );
}
