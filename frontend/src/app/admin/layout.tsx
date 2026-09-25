'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

/**
 * Admin Layout Guard for NexusDoc
 * Redirects unauthenticated users to the login page.
 * The backend admin routes are already protected by authMiddleware (JWT Bearer).
 * This guard prevents the admin UI shell from being exposed to unauthenticated visitors.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/');
      } else if (!user?.isAdmin) {
        router.replace('/dashboard');
      } else {
        setChecked(true);
      }
    }
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading || !checked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#05050a]">
        <div className="w-8 h-8 border-4 border-[#6c5ce7] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
