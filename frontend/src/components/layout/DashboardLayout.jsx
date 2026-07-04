import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ShaderBackground from '../background/ShaderBackground';
import NoiseOverlay from '../common/NoiseOverlay';

export default function DashboardLayout({ children, userRole = 'employee', searchPlaceholder }) {
  // Let's use name/role/avatar depending on userRole
  const profileInfo = userRole === 'admin' 
    ? { name: "Alex Rivera", role: "Administrator", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDTtkFI0Em5-kZ3CLM-BWjpPR4q3HNOYsajT-0BJzu7asojs1u1MhJ2B2DtmDHUV6Ec6-1Ao8MZV8r4GfQlHadWM2iugG6QTN9JzFYer7bdt8b6opsvId5eFtwe8Ae7Mpsa2GUd6kcTRU0RFUFlIwALikJw84R-vqkeTf2XjBoLz8ui_A25hTmnfleccl7B3NqwkuNzfX9xSrJ-2tYWMU8wshyvdkAlsH-H8eF7djQPV6_XC9hQRPyzHseu6N9nylxlbyD-8p5b7cQ" }
    : { name: "Sarah Jenkins", role: "HR Lead", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD8yrnXc23Ikct_vT79AN3KlXx5BQMIpNWEGvls8iSgUjTfZG_L0SyW7TVqTjBZD5kMu6ccooftMcy8Fjz3p-UEgnNV2dY0p55iwN6u4kYNgSOsUb51oRNgMg-xdI1Fr01s0HfgiQBFn9Kzw0m4TvjtaNh_59s8asBIU6p5SLngOfxjevmr51ruLfKGuDlIgx9wkCeKLJr1Q0R2KV_L5dETEAVkiF7xQ_DrySiKxh5QFHAn9EzpHx7Uds7XaA_OcruvM5X9NM5me18" };

  return (
    <div className="relative min-h-screen text-on-surface">
      <NoiseOverlay />
      
      {/* Background shader matches page requirements */}
      <ShaderBackground className="fixed inset-0 w-full h-full opacity-40 -z-10" />

      {/* Navigation and Top Bar */}
      <Sidebar userRole={userRole} />
      
      <Topbar 
        searchPlaceholder={searchPlaceholder}
        userName={profileInfo.name}
        userRole={profileInfo.role}
        userAvatar={profileInfo.avatar}
      />

      {/* Main Content Area */}
      <main className="ml-64 relative min-h-screen">
        <div className="pt-24 pb-12 px-container-padding max-w-[1600px] mx-auto relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
