'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/src/frontend/store/use-auth-store';
import { useAuth } from '@/src/frontend/hooks/use-auth';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, requiresPasswordChange } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  
  // Initialize auth listener
  useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user && !pathname.startsWith('/login') && !pathname.startsWith('/reset-password')) {
        router.push('/login');
      } else if (user && requiresPasswordChange && !pathname.startsWith('/change-password')) {
        router.push('/change-password');
      } else if (user && !requiresPasswordChange && pathname.startsWith('/change-password')) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, requiresPasswordChange, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user && !pathname.startsWith('/login') && !pathname.startsWith('/reset-password')) {
    return null;
  }

  if (user && requiresPasswordChange && !pathname.startsWith('/change-password')) {
    return null;
  }

  return <>{children}</>;
}
