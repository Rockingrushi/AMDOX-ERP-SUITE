'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../store/useAuthStore';
import { 
  LayoutDashboard, 
  Users, 
  Boxes, 
  DollarSign, 
  LogOut, 
  Calendar
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar = ({ isOpen, toggleSidebar }: SidebarProps) => {
  const { logout, user } = useAuthStore();
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Employees', path: '/employees', icon: Users },
    { name: 'Inventory', path: '/inventory', icon: Boxes },
    { name: 'Finance Ledger', path: '/finance', icon: DollarSign },
    { name: 'Attendance & Leaves', path: '/attendance', icon: Calendar },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-white/5 bg-[#0b0d19]/80 px-6 py-8 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="flex items-center justify-center mb-8 px-2">
            <img src="/logo.png" alt="AMDOX ERP Logo" className="h-20 w-20 rounded-full object-cover shadow-[0_0_15px_rgba(6,182,212,0.25)]" />
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) toggleSidebar();
                  }}
                  className={`flex items-center gap-4.5 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-accentPurple/20 to-accentCyan/10 text-white border-l-2 border-accentPurple shadow-[inset_4px_0_12px_rgba(168,85,247,0.1)]'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Admin info and logout */}
        <div className="border-t border-white/5 pt-6">
          <div className="mb-4 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-accentCyan/20 to-accentPurple/20 border border-white/10 text-white font-bold">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium text-white">{user?.name || 'Administrator'}</p>
              <p className="truncate text-xs text-gray-500">{user?.email || 'admin@amdox.com'}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex w-full items-center gap-4.5 rounded-xl bg-white/5 hover:bg-red-500/15 border border-white/5 hover:border-red-500/25 px-4 py-3 text-sm font-medium text-gray-400 hover:text-red-400 transition-all duration-300"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
