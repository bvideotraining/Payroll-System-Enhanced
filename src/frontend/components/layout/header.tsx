'use client';

import { useState } from 'react';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/src/frontend/store/use-auth-store';
import { useAuth } from '@/src/frontend/hooks/use-auth';

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

export function Header({ setSidebarOpen }: HeaderProps) {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="sticky top-0 z-40 flex h-10 shrink-0 items-center gap-x-3 border-b border-gray-200 bg-white px-3 shadow-sm sm:gap-x-4 sm:px-4 lg:px-6">
      <button
        type="button"
        className="-m-2 p-2 text-gray-700 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-5 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-3 self-stretch lg:gap-x-4">
        <div className="flex flex-1 items-center">
          {/* We can add a global search bar here later */}
          <h1 className="text-sm font-semibold text-gray-900 hidden sm:block">
            Welcome back, {user?.displayName || 'User'}
          </h1>
        </div>
        
        <div className="flex items-center gap-x-3 lg:gap-x-4">
          <button type="button" className="-m-2 p-2 text-gray-400 hover:text-gray-500">
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-5 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          {/* Profile dropdown */}
          <div className="relative">
            <button
              type="button"
              className="-m-1 flex items-center p-1"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span className="sr-only">Open user menu</span>
              <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[10px]">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="hidden lg:flex lg:items-center">
                <span className="ml-2 text-xs font-semibold leading-5 text-gray-900" aria-hidden="true">
                  {user?.email}
                </span>
              </span>
            </button>

            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2.5 w-48 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                  <div className="px-4 py-2 border-b border-gray-100 mb-1">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="mr-2 h-4 w-4 text-gray-400" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
