'use client';

import { useState } from 'react';
import { AuthGuard } from '@/src/frontend/components/layout/auth-guard';
import { Sidebar } from '@/src/frontend/components/layout/sidebar';
import { Header } from '@/src/frontend/components/layout/header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <div className="lg:pl-64 flex flex-col min-h-screen">
          <Header setSidebarOpen={setSidebarOpen} />
          
          <main className="flex-1">
            <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
