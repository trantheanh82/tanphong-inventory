
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, ArrowUpCircle, ArrowDownCircle, CircleUser, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const BottomNavItem = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
  const pathname = usePathname();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const checkActive = () => {
      // For listing pages, we need to check the query param as well.
      if (href.startsWith('/listing')) {
        // Since this runs in useEffect, window is available.
        const currentParams = new URLSearchParams(window.location.search);
        const currentType = currentParams.get('type');
        
        const linkParams = new URLSearchParams(href.split('?')[1] || '');
        const linkType = linkParams.get('type');

        return pathname === '/listing' && currentType === linkType;
      }
      
      // For other pages, just check the pathname.
      return pathname === href;
    };

    // Set initial state without waiting for hydration for non-listing pages
    if (!href.startsWith('/listing')) {
      setIsActive(pathname === href);
    } else {
      // For listing pages, we must wait for client-side hydration
      // to safely access window.location.search
      setIsActive(checkActive());
    }

    // A full re-check on pathname change
    const handlePathChange = () => {
        setIsActive(checkActive());
    };
    handlePathChange();

  }, [pathname, href]);


  return (
    <Link href={href} className={cn(
      "flex flex-col items-center flex-grow p-2 transition-colors duration-200", 
      isActive ? "text-gray-800 font-semibold" : "text-gray-600"
    )}>
      <Icon className="w-6 h-6" strokeWidth={2} />
      <span className="text-xs mt-1">{label}</span>
    </Link>
  );
};

export function BottomNav() {
  return (
    <nav className="w-full bg-white/50 backdrop-blur-md border-t border-white/50 shadow-xl">
        <div className="flex justify-around items-center h-16">
            <BottomNavItem href="/" icon={LayoutGrid} label="Trang chủ" />
            <BottomNavItem href="/listing?type=import" icon={ArrowDownCircle} label="Nhập" />
            <BottomNavItem href="/listing?type=export" icon={ArrowUpCircle} label="Xuất" />
            <BottomNavItem href="/listing?type=warranty" icon={ShieldCheck} label="Bảo hành" />
            <BottomNavItem href="/profile" icon={CircleUser} label="Cá nhân" />
        </div>
    </nav>
  );
}
