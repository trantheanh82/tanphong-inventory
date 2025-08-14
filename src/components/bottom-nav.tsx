
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ArrowUp, ArrowDown, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const BottomNavItem = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
  const pathname = usePathname();
  const isActive = (href === "/" && pathname === href) || (href !== "/" && pathname.startsWith(href));

  return (
    <Link href={href} className={cn(
      "flex flex-col items-center justify-center gap-1 flex-1 p-2 rounded-lg transition-colors duration-200", 
      isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
    )}>
      <Icon className="h-6 w-6" />
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
};

export function BottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-2 bg-transparent">
      <Card className="rounded-2xl shadow-lg bg-card/80 backdrop-blur-sm">
          <div className="flex justify-around items-center h-16 p-1 gap-1">
              <BottomNavItem href="/" icon={Home} label="Trang chủ" />
              <BottomNavItem href="/export" icon={ArrowUp} label="Xuất" />
              <BottomNavItem href="/import" icon={ArrowDown} label="Nhập" />
              <BottomNavItem href="/profile" icon={User} label="Cá nhân" />
          </div>
      </Card>
    </div>
  );
}
