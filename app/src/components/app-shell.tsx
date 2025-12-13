
"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { BottomNav } from '@/components/bottom-nav';
import { Skeleton } from '@/components/ui/skeleton';
import { PwaUpdater } from './pwa-updater';

const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();

    useEffect(() => {
        setLoading(true);
        const loggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
        setIsAuthenticated(loggedIn);
        setLoading(false);
    }, [pathname]);

    return { isAuthenticated, loading };
};

function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen font-sans overflow-hidden">
            <div className="relative bg-white/30 backdrop-blur-md w-full h-screen overflow-hidden flex flex-col shadow-2xl z-10">
                <AppHeader />
                <main className="flex-grow overflow-y-auto">
                    {children}
                </main>
                <BottomNav />
                <PwaUpdater />
            </div>
        </div>
    );
}

function SpecialPageLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen font-sans overflow-hidden">
            <div className="relative bg-white/30 backdrop-blur-md w-full h-screen overflow-hidden flex flex-col shadow-2xl z-10">
                {children}
                <PwaUpdater />
            </div>
        </div>
    );
}


function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen font-sans overflow-hidden">
            <div className="relative bg-white/30 backdrop-blur-md w-full h-screen overflow-hidden flex flex-col shadow-2xl z-10 justify-center">
                {children}
                 <PwaUpdater />
            </div>
        </div>
    );
}

function LoadingScreen() {
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  
  const isLoginPage = pathname === '/login';
  const isScanningPage = pathname === '/scanning';

  useEffect(() => {
    if (!loading && !isAuthenticated && !isLoginPage) {
        router.push('/login');
    }
    if (!loading && isAuthenticated && isLoginPage) {
        router.push('/');
    }
  }, [loading, isAuthenticated, isLoginPage, router]);
  
  if (isLoginPage) {
    return <PublicLayout>{children}</PublicLayout>;
  }

  if(isScanningPage) {
    return <SpecialPageLayout>{children}</SpecialPageLayout>
  }

  if (loading || (!isAuthenticated && !isLoginPage)) {
    return <LoadingScreen />;
  }

  return <AuthLayout>{children}</AuthLayout>;
}
