
"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { BottomNav } from '@/components/bottom-nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isLoginPage = pathname === '/login';

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 font-sans overflow-hidden">
      <div className={`relative bg-white/30 backdrop-blur-md rounded-3xl w-full max-w-md h-[90vh] overflow-hidden flex flex-col shadow-2xl z-10 border border-white/50 ${isLoginPage ? 'justify-center' : ''}`}>
        {!isLoginPage && <AppHeader />}
        <main className="flex-grow overflow-y-auto">
            {children}
        </main>
        {!isLoginPage && <BottomNav />}
      </div>
    </div>
  );
}
