
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ArrowUp, ArrowDown, User, List } from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomNavItem = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
  const pathname = usePathname();
  const isActive = (href === "/" && pathname === href) || (href !== "/" && pathname.startsWith(href));

  return (
    <Link href={href} className={cn(
      "flex flex-col items-center flex-grow p-2 transition-colors duration-200", 
      isActive ? "text-gray-800 font-semibold" : "text-gray-600"
    )}>
      <Icon className="w-5 h-5" strokeWidth={3} />
      <span className="text-xs mt-1">{label}</span>
    </Link>
  );
};

export function BottomNav() {
  return (
    <nav className="w-full bg-white/50 backdrop-blur-md border-t border-white/50 shadow-xl">
        <div className="flex justify-around items-center h-16">
            <BottomNavItem href="/" icon={Home} label="Trang chủ" />
            <BottomNavItem href="/export" icon={ArrowUp} label="Xuất" />
            <BottomNavItem href="/import" icon={ArrowDown} label="Nhập" />
            <BottomNavItem href="/inventory" icon={List} label="Tồn kho" />
            <BottomNavItem href="/profile" icon={User} label="Cá nhân" />
        </div>
    </nav>
  );
}
