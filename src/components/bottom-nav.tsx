"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ArrowUpSquare, ArrowDownSquare, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const BottomNavItem = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
  const pathname = usePathname();
  const isActive = (href === "/" && pathname === href) || (href !== "/" && pathname.startsWith(href));

  return (
    <Link href={href} className={cn(
      "flex flex-col items-center justify-center gap-1 flex-1 p-2 rounded-lg transition-colors duration-200", 
      isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"
    )}>
      <Icon className="h-6 w-6" />
      <span className="text-xs font-semibold">{label}</span>
    </Link>
  );
};

export function BottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-2 bg-background/80 backdrop-blur-sm">
      <Card className="rounded-xl shadow-lg">
          <div className="flex justify-around items-center h-16 p-1 gap-1">
              <BottomNavItem href="/" icon={Home} label="Home" />
              <BottomNavItem href="/import" icon={ArrowUpSquare} label="Import" />
              <BottomNavItem href="/export" icon={ArrowDownSquare} label="Export" />
              <BottomNavItem href="/profile" icon={User} label="Profile" />
          </div>
      </Card>
    </div>
  );
}
