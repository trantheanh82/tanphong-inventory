
"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { BottomNav } from '@/components/bottom-nav';
import { Skeleton } from '@/components/ui/skeleton';

// Mock authentication check
const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, you'd check a token, session, etc.
        const timer = setTimeout(() => {
            const loggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
            setIsAuthenticated(loggedIn);
            setLoading(false);
        }, 0); // No delay

        return () => clearTimeout(timer);
    }, []);

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
      return null; // or a loading spinner, while redirecting
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
    </div>
  );
}
