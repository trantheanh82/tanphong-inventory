
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Power, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const pageTitles: { [key: string]: string } = {
  "/": "Kho lốp Tân Phong",
  "/listing": "Tồn Kho",
  "/import": "Nhập Kho",
  "/export": "Xuất Kho",
  "/profile": "Thông tin Cá nhân",
  "/warranty": "Quét Bảo Hành",
  "/scanning": "Quét Mã",
  "/guide": "Hướng Dẫn Sử Dụng",
};

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getTitle = () => {
    return pageTitles[pathname] || "Kho lốp Tân Phong";
  }

  const title = getTitle();
  const isHomePage = pathname === '/';

  const handleLogout = async () => {
    try {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        
        if (response.ok) {
            sessionStorage.removeItem('isLoggedIn');
            toast({ title: "Đăng xuất thành công" });
            router.push('/login');
        } else {
            const result = await response.json();
            toast({
                variant: 'destructive',
                title: 'Lỗi đăng xuất',
                description: result.message || "Không thể đăng xuất. Vui lòng thử lại.",
            });
        }
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Lỗi',
            description: "Đã xảy ra lỗi không mong muốn khi đăng xuất.",
        });
    }
  };
  
  const [clientTitle, setClientTitle] = useState(title);

  useEffect(() => {
    setClientTitle(getTitle());
  }, [pathname]);


  return (
    <header className="bg-gray-800/80 backdrop-blur-md text-white p-4 flex items-center justify-between shadow-lg sticky top-0 z-30">
        <div className="w-10">
            {!isHomePage && pathname !== '/login' && (
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="text-white hover:text-gray-400 transition-colors duration-200 transform hover:scale-110">
                   <ArrowLeft className="w-8 h-8" strokeWidth={2.5} />
                </Button>
            )}
        </div>
        
        <h1 className="text-xl font-bold">
          {isMounted ? clientTitle : title}
        </h1>

        <div className="w-10 flex justify-end">
          {isMounted && pathname !== '/login' && (
            <Button onClick={handleLogout} variant="ghost" size="icon" className="text-white hover:text-gray-400 transition-colors duration-200 transform hover:scale-110">
                <Power className="w-8 h-8" strokeWidth={2.5} />
            </Button>
          )}
        </div>
    </header>
  );
}
