
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setApiResponse(null);

    try {
        const response = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (response.ok) {
            toast({
                title: 'Login Successful',
                description: result.message,
            });
            sessionStorage.setItem('isLoggedIn', 'true');
            router.push('/');
        } else {
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: result.message,
            });
            setApiResponse({ success: false, data: result });
        }
    } catch (error) {
        console.error('Login error:', error);
        toast({
            variant: 'destructive',
            title: 'Login Error',
            description: 'An unexpected error occurred.',
        });
        setApiResponse({ success: false, data: { message: 'An unexpected error occurred.'} });
    }
    
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-sm bg-white/30 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 animate-in fade-in-0 zoom-in-95 duration-500">
        <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-[#333]">Kho Tân Long</CardTitle>
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
                <Button type="submit" disabled={isLoading} className="w-full bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-gray-900 transition-transform transform hover:scale-105 duration-200 ease-in-out shadow-lg disabled:bg-gray-600">
                    {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
            </form>
            
            {apiResponse && (
                <div className="mt-6 p-4 bg-gray-100 rounded-xl border border-gray-200">
                    <h3 className="font-bold text-lg mb-2">{apiResponse.success ? 'Login Success' : 'Login Error'}</h3>
                    <pre className="text-sm text-left bg-gray-800 text-white p-3 rounded-lg overflow-x-auto">
                        <code>{JSON.stringify(apiResponse.data, null, 2)}</code>
                    </pre>
                </div>
            )}
        </CardContent>
    </Card>
  );
}
