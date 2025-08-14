
"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { BottomNav } from '@/components/bottom-nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/login') {
    return <main className="relative min-h-screen flex items-center justify-center p-4 font-sans overflow-hidden">{children}</main>;
  }

  return (
    <div className="relative bg-white/30 backdrop-blur-md rounded-3xl w-full max-w-md h-[90vh] overflow-hidden flex flex-col shadow-2xl z-10 border border-white/50 mx-auto my-auto">
        <AppHeader />
        <main className="flex-grow overflow-y-auto">
            {children}
        </main>
        <BottomNav />
    </div>
  );
}
