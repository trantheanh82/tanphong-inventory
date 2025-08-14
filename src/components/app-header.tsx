
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const pageTitles: { [key: string]: string } = {
  "/": "Kho lốp Tân Phong",
  "/inventory": "Tồn Kho",
  "/import": "Nhập Kho",
  "/export": "Xuất Kho",
  "/profile": "Thông tin Cá nhân",
};

export function AppHeader() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "Kho lốp Tân Phong";
  const isHomePage = pathname === '/';

  return (
    <header className="bg-gray-800/80 backdrop-blur-md text-white p-4 flex items-center justify-between shadow-lg sticky top-0 z-30">
        <div className="w-8">
            {!isHomePage && (
                <Button asChild variant="ghost" size="icon" className="text-white hover:text-gray-400 transition-colors duration-200 transform hover:scale-110">
                    <Link href="/">
                        <ArrowLeft className="w-6 h-6" strokeWidth={3} />
                    </Link>
                </Button>
            )}
        </div>
        
        <h1 className="text-xl font-bold">
          {title}
        </h1>

        <div className="w-8 flex justify-end">
          <Button asChild variant="ghost" size="icon" className="text-white hover:text-gray-400 transition-colors duration-200 transform hover:scale-110">
              <Link href="/login">
                  <LogOut className="w-6 h-6" strokeWidth={3} />
              </Link>
          </Button>
        </div>
    </header>
  );
}
