
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Power, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const pageTitles: { [key: string]: string } = {
  "/": "Kho lốp Tân Phong",
  "/inventory": "Tồn Kho",
  "/import": "Nhập Kho",
  "/export": "Xuất Kho",
  "/profile": "Thông tin Cá nhân",
  "/warranty": "Bảo hành",
  "/scanning": "Quét Mã",
};

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const title = pageTitles[pathname] || "Kho lốp Tân Phong";
  const isHomePage = pathname === '/';

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    router.push('/login');
  };

  return (
    <header className="bg-gray-800/80 backdrop-blur-md text-white p-4 flex items-center justify-between shadow-lg sticky top-0 z-30">
        <div className="w-10">
            {!isHomePage && (
                <Button asChild variant="ghost" size="icon" className="text-white hover:text-gray-400 transition-colors duration-200 transform hover:scale-110">
                    <Link href="/">
                        <ArrowLeft className="w-8 h-8" strokeWidth={2.5} />
                    </Link>
                </Button>
            )}
        </div>
        
        <h1 className="text-xl font-bold">
          {title}
        </h1>

        <div className="w-10 flex justify-end">
          <Button onClick={handleLogout} variant="ghost" size="icon" className="text-white hover:text-gray-400 transition-colors duration-200 transform hover:scale-110">
              <Power className="w-8 h-8" strokeWidth={2.5} />
          </Button>
        </div>
    </header>
  );
}
