
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Warehouse } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm mx-auto animate-in fade-in-0 zoom-in-95 duration-500 p-4">
        <div className="text-center mb-8">
            <Link href="/" className="flex items-center justify-center gap-2 text-2xl font-bold text-primary">
                <Warehouse className="h-8 w-8" />
                <span>Tân Phong</span>
            </Link>
        </div>
        
        <div className="space-y-4">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold">Welcome Back</h1>
                <p className="text-muted-foreground">Enter your credentials to access your inventory.</p>
            </div>
            <div className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" type="text" placeholder="your-username" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" required />
                </div>
                <Button asChild type="submit" className="w-full !mt-6">
                    <Link href="/">
                        Login
                    </Link>
                </Button>
            </div>
        </div>
    </div>
  );
}
