'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token, loading } = useAuthStore();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!token || !user)) {
      router.push('/login');
    }
  }, [loading, token, user, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#06070a] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-accentPurple border-t-transparent"></div>
          <p className="text-sm text-gray-400">Loading Enterprise Environment...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex h-screen w-screen bg-[#06070a] overflow-hidden">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
