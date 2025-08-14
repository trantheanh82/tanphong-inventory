
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
  { href: "/import", icon: ArrowUpSquare, label: "Import Tires" },
  { href: "/export", icon: ArrowDownSquare, label: "Export Tires" },
  { href: "/profile", icon: User, label: "Profile" },
];

const pageTitles: { [key: string]: string } = {
  "/": "Dashboard",
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
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <nav className="grid gap-4 text-lg font-medium">
          <Link
            href="#"
            className="flex items-center gap-2 text-lg font-semibold mb-4"
          >
            <Warehouse className="h-6 w-6" />
            <span className="text-xl font-bold text-primary">Tân Phong</span>
          </Link>
          {navItems.map((item) => {
             const isActive = (item.href === "/" && pathname === item.href) || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    isActive && "text-primary bg-muted"
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
        <Button variant="secondary" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src="https://placehold.co/100x100.png"
              alt="User Avatar"
              data-ai-hint="person"
            />
            <AvatarFallback>TP</AvatarFallback>
          </Avatar>
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
           <Link href="/login">Logout</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "Dashboard";

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b bg-card px-4 md:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-4">
            <MobileSidebar />
            <Link href="/" className="md:hidden flex items-center gap-2 text-lg font-semibold">
                <Warehouse className="h-6 w-6" />
                <span className="sr-only">Tân Phong</span>
            </Link>
            <h1 className="hidden md:block text-xl font-semibold">{title}</h1>
        </div>
        <UserMenu />
    </header>
  );
}
