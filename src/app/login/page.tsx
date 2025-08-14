
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Warehouse } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm mx-auto animate-in fade-in-0 zoom-in-95 duration-500 p-4">
        <Card className="bg-white/30 backdrop-blur-md border border-white/50 shadow-2xl rounded-3xl">
            <CardHeader className="text-center">
                <CardTitle className="text-4xl font-bold text-white mb-2">Đăng nhập</CardTitle>
                <CardDescription className="text-gray-200">
                  Vui lòng đăng nhập vào tài khoản của bạn.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-6">
                    <div>
                        <Label htmlFor="username" className="block text-white text-sm font-semibold mb-2">Username</Label>
                        <Input id="username" type="text" placeholder="your-username" required className="w-full p-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-gray-800" />
                    </div>
                    <div>
                        <Label htmlFor="password" className="block text-white text-sm font-semibold mb-2">Password</Label>
                        <Input id="password" type="password" required className="w-full p-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-gray-800" />
                    </div>
                    <Button asChild type="submit" className="w-full bg-white text-gray-800 font-bold py-3 rounded-xl hover:bg-gray-200 transition-transform transform hover:scale-105 duration-200 ease-in-out shadow-md">
                        <Link href="/">
                            Đăng nhập
                        </Link>
                    </Button>
                </form>
                <div className="text-center mt-6">
                    <Link href="#" className="text-sm font-semibold text-gray-300 hover:underline">
                        Quên mật khẩu?
                    </Link>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
