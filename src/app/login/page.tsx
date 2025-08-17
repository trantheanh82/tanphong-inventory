
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would validate credentials here.
    // For now, we'll just simulate a successful login.
    sessionStorage.setItem('isLoggedIn', 'true');
    router.push('/');
  };

  return (
    <div className="flex items-center justify-center min-h-full p-4">
        <Card className="w-full max-w-sm bg-white/30 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 animate-in fade-in-0 zoom-in-95 duration-500">
            <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-[#333]">Kho Tân Long</CardTitle>
                <CardDescription className="text-gray-700">Đăng nhập để tiếp tục</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <Input 
                            id="username" 
                            type="text" 
                            placeholder="Tên đăng nhập" 
                            required 
                            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-gray-800 bg-white/80" 
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <Input 
                            id="password" 
                            type="password" 
                            placeholder="Mật khẩu" 
                            required 
                            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-gray-800 bg-white/80" 
                        />
                    </div>
                    <Button type="submit" className="w-full bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-gray-900 transition-transform transform hover:scale-105 duration-200 ease-in-out shadow-lg">
                        Đăng nhập
                    </Button>
                </form>
                <div className="text-center mt-6">
                    <Link href="#" className="text-sm font-semibold text-gray-700 hover:underline">
                        Quên mật khẩu?
                    </Link>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
