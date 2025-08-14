
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  List,
  ArrowUpSquare,
  ArrowDownSquare,
  Warehouse,
  Menu,
  User,
  LogOut,
  Power,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/inventory", icon: List, label: "Inventory" },
  { href: "/import", icon: ArrowDownSquare, label: "Import Tires" },
  { href: "/export", icon: ArrowUpSquare, label: "Export Tires" },
  { href: "/profile", icon: User, label: "Profile" },
];

const pageTitles: { [key: string]: string } = {
  "/": "Kho lốp Tân Phong",
  "/inventory": "Inventory",
  "/import": "Import Tires",
  "/export": "Export Tires",
  "/profile": "User Profile",
};

function MobileSidebar() {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <nav className="grid gap-4 text-lg font-medium">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold mb-4"
          >
            <Warehouse className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Tân Phong</span>
          </Link>
          {navItems.map((item) => {
             const isActive = (item.href === "/" && pathname === item.href) || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    isActive && "text-primary bg-primary/10"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </SheetClose>
            );
          })}
        </nav>
        <div className="mt-auto">
          <SheetClose asChild>
            <Button asChild variant="ghost" className="w-full justify-start gap-3 px-3">
                <Link href="/login">
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                </Link>
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function UserMenu() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="person" />
                        <AvatarFallback>TP</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Tân Phong Admin</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            admin@tanphong.co
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile">
                        <User className="mr-2" />
                        <span>Profile</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                     <Link href="/login">
                        <LogOut className="mr-2" />
                        <span>Log out</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function AppHeader() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "Dashboard";

  return (
    <header className="flex h-20 items-center justify-between gap-4 bg-background border-b px-4 md:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-4">
            <MobileSidebar />
            <h1 className="text-xl font-bold hidden md:block">{title}</h1>
        </div>
        <div className="flex items-center md:hidden">
             <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
                <Warehouse className="h-7 w-7" />
                <span>Tân Phong</span>
            </Link>
        </div>
        <UserMenu />
    </header>
  );
}
