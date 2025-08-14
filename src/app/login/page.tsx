
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Warehouse } from 'lucide-react';

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm mx-auto animate-in fade-in-0 zoom-in-95 duration-500">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center mb-4">
            <Warehouse className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Welcome to Tân Phong</CardTitle>
        <CardDescription>Enter your credentials to access your inventory.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" type="text" placeholder="your-username" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required />
          </div>
          <Button asChild type="submit" className="w-full">
            <Link href="/">
                Login
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
