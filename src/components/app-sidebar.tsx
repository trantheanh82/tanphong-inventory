"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, List, ArrowUpSquare, ArrowDownSquare, Warehouse, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SidebarNavItem = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
    const pathname = usePathname();
    const isActive = (href === "/" && pathname === href) || (href !== "/" && pathname.startsWith(href));

    return (
        <Button
            asChild
            variant={isActive ? "secondary" : "ghost"}
            className={cn("w-full justify-start gap-3 px-3", isActive && "font-bold text-primary")}
        >
            <Link href={href}>
                <Icon className="h-5 w-5" />
                <span>{label}</span>
            </Link>
        </Button>
    );
};

export function AppSidebar() {
    return (
        <aside className="hidden md:flex flex-col w-64 bg-card border-r">
            <div className="flex items-center justify-center h-20 border-b px-6">
                <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
                    <Warehouse className="h-7 w-7" />
                    <span>Tân Phong</span>
                </Link>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                <SidebarNavItem href="/" icon={Home} label="Dashboard" />
                <SidebarNavItem href="/inventory" icon={List} label="Inventory" />
                <SidebarNavItem href="/import" icon={ArrowUpSquare} label="Import Tires" />
                <SidebarNavItem href="/export" icon={ArrowDownSquare} label="Export Tires" />
            </nav>
            <div className="p-4 border-t mt-auto">
                 <Button asChild variant="ghost" className="w-full justify-start gap-3 px-3">
                    <Link href="/login">
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                    </Link>
                </Button>
            </div>
        </aside>
    );
}
