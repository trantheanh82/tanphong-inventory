
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, List, ArrowUpSquare, ArrowDownSquare, Warehouse, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


const navItems = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/inventory", icon: List, label: "Inventory" },
  { href: "/import", icon: ArrowDownSquare, label: "Import" },
  { href: "/export", icon: ArrowUpSquare, label: "Export" },
];


const SidebarNavItem = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
    const pathname = usePathname();
    const isActive = (href === "/" && pathname === href) || (href !== "/" && pathname.startsWith(href));

    return (
        <Button
            asChild
            variant={isActive ? "secondary" : "ghost"}
            className={cn("w-full justify-start gap-3 px-3", isActive && "font-bold")}
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
        <aside className="hidden md:flex flex-col w-64 bg-background border-r">
            <div className="flex items-center h-20 border-b px-6">
                <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
                    <Warehouse className="h-7 w-7" />
                    <span>Tân Phong</span>
                </Link>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                    <SidebarNavItem key={item.href} {...item} />
                ))}
            </nav>
            <div className="p-4 border-t mt-auto">
                 <Button asChild variant="ghost" className="w-full justify-start gap-3 px-3">
                    <Link href="/profile">
                        <User className="h-5 w-5" />
                        <span>Profile</span>
                    </Link>
                </Button>
            </div>
        </aside>
    );
}
