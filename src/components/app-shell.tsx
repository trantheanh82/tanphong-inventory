
"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { BottomNav } from '@/components/bottom-nav';
import { Skeleton } from '@/components/ui/skeleton';
import { PwaUpdater } from './pwa-updater';

// Mock authentication check
const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();

    useEffect(() => {
        // In a real app, you'd check a token, session, etc.
        const loggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
        setIsAuthenticated(loggedIn);
        setLoading(false);
    }, [pathname]); // Rerun on route change

    return { isAuthenticated, loading };
};


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  const isLoginPage = pathname === '/login';
  const isScanningPage = pathname === '/scanning';

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated && !isLoginPage) {
        router.push('/login');
      }
      if (isAuthenticated && isLoginPage) {
        router.push('/');
      }
    }
  }, [loading, isAuthenticated, isLoginPage, router]);


  if (isLoginPage || isScanningPage) {
    return (
        <div className="relative min-h-screen font-sans overflow-hidden">
            <div className="relative bg-white/30 backdrop-blur-md w-full h-screen overflow-hidden flex flex-col shadow-2xl z-10 justify-center">
                {children}
                 <PwaUpdater />
            </div>
        </div>
    );
  }
  
  if (loading && !isLoginPage) {
    return (
        <div className="relative min-h-screen font-sans overflow-hidden">
            <div className="relative bg-white/30 backdrop-blur-md w-full h-screen overflow-hidden flex flex-col shadow-2xl z-10">
                <AppHeader />
                <main className="flex-grow overflow-y-auto p-4 space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </main>
                <BottomNav />
            </div>
        </div>
    );
  }

  if (!isAuthenticated && !isLoginPage) {
      // While redirecting, it's better to show a loader or nothing to avoid content flash
      return (
        <div className="relative min-h-screen font-sans overflow-hidden">
            <div className="relative bg-white/30 backdrop-blur-md w-full h-screen overflow-hidden flex flex-col shadow-2xl z-10 justify-center items-center">
                {/* You can add a loading spinner here */}
            </div>
        </div>
      );
  }

  return (
    <div className="relative min-h-screen font-sans overflow-hidden">
      <div className={`relative bg-white/30 backdrop-blur-md w-full h-screen overflow-hidden flex flex-col shadow-2xl z-10 ${isLoginPage ? 'justify-center' : ''}`}>
        {!isLoginPage && <AppHeader />}
        <main className="flex-grow overflow-y-auto">
            {children}
        </main>
        {!isLoginPage && <BottomNav />}
      </div>
       <PwaUpdater />
    </div>
  );
}
