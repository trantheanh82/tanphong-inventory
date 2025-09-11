
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import CryptoJS from 'crypto-js';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setApiResponse(null);
    const secret = process.env.NEXT_PUBLIC_CRYPTO_SECRET || 'your-default-secret-key';

    try {
        const response = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            toast({
                title: 'Đăng nhập thành công',
                description: "Chào mừng trở lại!",
            });

            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
                localStorage.setItem('rememberMe', 'true');
                const encryptedEmail = CryptoJS.AES.encrypt(email, secret).toString();
                const encryptedPassword = CryptoJS.AES.encrypt(password, secret).toString();
                localStorage.setItem('authEmail', encryptedEmail);
                localStorage.setItem('authToken', encryptedPassword);
            } else {
                localStorage.removeItem('rememberedEmail');
                localStorage.removeItem('rememberMe');
                localStorage.removeItem('authEmail');
                localStorage.removeItem('authToken');
            }

            // Store user and employee info in sessionStorage
            if (result.data?.user) {
              sessionStorage.setItem('user', JSON.stringify(result.data.user));
            }
            if (result.data?.employee) {
              sessionStorage.setItem('employee', JSON.stringify(result.data.employee));
            }

            sessionStorage.setItem('isLoggedIn', 'true');
            router.push('/');
        } else {
            toast({
                variant: 'destructive',
                title: 'Đăng nhập thất bại',
                description: result.message || 'Email hoặc mật khẩu không đúng.',
            });
            setApiResponse({ success: false, data: result });
        }
    } catch (error) {
        console.error('Login error:', error);
        toast({
            variant: 'destructive',
            title: 'Lỗi đăng nhập',
            description: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
        });
        setApiResponse({ success: false, data: { message: 'An unexpected error occurred.'} });
    }
    
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-sm bg-white/30 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 animate-in fade-in-0 zoom-in-95 duration-500">
        <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-[#333]">Kho Tân Phong</CardTitle>
            <CardDescription className="text-gray-700">Đăng nhập để tiếp tục</CardDescription>
        </CardHeader>
        <CardContent>
            <form className="space-y-6" onSubmit={handleLogin}>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <Input 
                        id="email" 
                        type="email" 
                        placeholder="Email" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-gray-800 bg-white/80" 
                    />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-gray-500"
                  />
                  <Label htmlFor="remember-me" className="text-sm font-medium text-gray-800 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Ghi nhớ đăng nhập
                  </Label>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-gray-900 transition-transform transform hover:scale-105 duration-200 ease-in-out shadow-lg disabled:bg-gray-600">
                    {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
            </form>
        </CardContent>
    </Card>
  );
}
