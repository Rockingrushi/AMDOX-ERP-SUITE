'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Menu, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return 'System Overview';
      case '/employees':
        return 'Workforce Registry';
      case '/inventory':
        return 'Inventory & Supply';
      case '/finance':
        return 'Financial Operations';
      case '/attendance':
        return 'Workforce Attendance';
      default:
        if (pathname?.startsWith('/employees/')) {
          return 'Employee Detailed Ledger';
        }
        return 'AMDOX Management';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/5 bg-[#06070a]/40 px-6 backdrop-blur-md lg:px-8">
      {/* Page Title & Mobile Toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-sans">{getPageTitle()}</h2>
          <p className="hidden text-xs text-gray-500 md:block">Real-time enterprise control panel</p>
        </div>
      </div>

      {/* Stats, Health & Profile badges */}
      <div className="flex items-center gap-6">
        {/* System Status Indicators */}
        <div className="hidden items-center gap-4.5 rounded-full border border-white/5 bg-[#0d101a]/50 px-4 py-1.5 text-xs text-gray-400 md:flex">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-gray-300">Live Database Connection</span>
          </div>
          <div className="h-3 w-[1px] bg-white/10" />
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-accentCyan" />
            <span>JWT Secure Session</span>
          </div>
        </div>

        {/* User Badging */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold text-white">{user?.name || 'Administrator'}</p>
            <p className="text-[10px] text-accentPurple font-bold tracking-wide uppercase">{user?.role || 'Admin'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
