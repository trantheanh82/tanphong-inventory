
"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { BottomNav } from '@/components/bottom-nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isLoginPage = pathname === '/login';

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
