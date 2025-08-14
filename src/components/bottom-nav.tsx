
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, ArrowUpCircle, ArrowDownCircle, CircleUser, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomNavItem = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
  const pathname = usePathname();
  const isActive = (href === "/" && pathname === href) || (href !== "/" && pathname.startsWith(href));

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
            <BottomNavItem href="/export" icon={ArrowUpCircle} label="Xuất" />
            <BottomNavItem href="/import" icon={ArrowDownCircle} label="Nhập" />
            <BottomNavItem href="/warranty" icon={ShieldCheck} label="Bảo hành" />
            <BottomNavItem href="/profile" icon={CircleUser} label="Cá nhân" />
        </div>
    </nav>
  );
}
