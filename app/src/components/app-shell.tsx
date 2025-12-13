
"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { BottomNav } from '@/components/bottom-nav';
import { Skeleton } from '@/components/ui/skeleton';
import { PwaUpdater } from './pwa-updater';

function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <AppHeader />
            <main className="flex-grow overflow-y-auto">
                {children}
            </main>
            <BottomNav />
        </>
    );
}

function LoadingScreen() {
     return (
        <>
            <AppHeader />
            <main className="flex-grow overflow-y-auto p-4 space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </main>
            <BottomNav />
        </>
    );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const isLoginPage = pathname === '/login';
  const isScanningPage = pathname === '/scanning';

  useEffect(() => {
    // This effect runs once on mount to check the initial auth status.
    const loggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    setIsAuthenticated(loggedIn);
    setLoading(false);
  }, []);

  useEffect(() => {
    // This effect handles redirection after the initial loading is complete.
    if (loading) {
      return; // Do nothing while loading to prevent premature redirects
    }
    if (!isAuthenticated && !isLoginPage) {
        router.push('/login');
    }
    if (isAuthenticated && isLoginPage) {
        router.push('/');
    }
  }, [loading, isAuthenticated, isLoginPage, router]);

  let content: React.ReactNode;

  if (loading) {
    // Show a loading screen, but only if not on the login page,
    // to avoid layout shifts during the initial check.
    content = isLoginPage ? children : <LoadingScreen />;
  } else if (isLoginPage) {
    content = children;
  } else if (isScanningPage) {
    content = children;
  } else if (isAuthenticated) {
    content = <AuthLayout>{children}</AuthLayout>;
  } else {
    // If not authenticated and not on login/scanning, show a loading screen
    // while the redirect is in progress.
    content = <LoadingScreen />;
  }

  return (
    <div className="relative min-h-screen font-sans overflow-hidden">
        <div className="relative bg-white/30 backdrop-blur-md w-full h-screen overflow-hidden flex flex-col shadow-2xl z-10">
            {content}
            <PwaUpdater />
        </div>
    </div>
  );
}
