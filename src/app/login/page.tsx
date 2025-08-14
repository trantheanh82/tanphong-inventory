
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm mx-auto animate-in fade-in-0 zoom-in-95 duration-500 p-4">
        <div className="p-8 w-full">
            <h1 className="text-4xl font-bold text-center text-white mb-6">Đăng nhập</h1>
            <p className="text-center text-gray-200 mb-8">
              Vui lòng đăng nhập vào tài khoản của bạn.
            </p>
            <form className="space-y-6">
                <div>
                    <Label htmlFor="username" className="block text-white text-sm font-semibold mb-2">Username</Label>
                    <Input id="username" type="text" placeholder="your-username" required className="w-full p-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-gray-800" />
                </div>
                <div>
                    <Label htmlFor="password" className="block text-white text-sm font-semibold mb-2">Password</Label>
                    <Input id="password" type="password" placeholder="your-password" required className="w-full p-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-gray-800" />
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
        </div>
    </div>
  );
}
