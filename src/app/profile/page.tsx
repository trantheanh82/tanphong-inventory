
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: string;
  email: string;
  avatar: string;
  name: string;
}

interface Employee {
  fields: {
    name: string;
    username: string;
    position: string;
    user: {
      id: string;
      email: string;
      title: string;
      avatarUrl: string;
    };
  };
  name: string;
  id: string;
  createdTime: string;
}

export default function ProfilePage() {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        // Fetch from sessionStorage first for quick render
        const storedUser = sessionStorage.getItem('user');
        const storedEmployee = sessionStorage.getItem('employee');
        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedEmployee) setEmployee(JSON.parse(storedEmployee));

        // Then fetch from API for latest data
        const response = await fetch('/api/profile');
        if (response.ok) {
          const apiEmployeeData = await response.json();
          setEmployee(apiEmployeeData);
          if (apiEmployeeData.fields?.user) {
              const apiUser = {
                  id: apiEmployeeData.fields.user.id,
                  email: apiEmployeeData.fields.user.email,
                  name: apiEmployeeData.fields.user.title,
                  avatar: apiEmployeeData.fields.user.avatarUrl
              }
              setUser(apiUser);
              sessionStorage.setItem('user', JSON.stringify(apiUser));
              sessionStorage.setItem('employee', JSON.stringify(apiEmployeeData));
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'TP';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  if (loading) {
    return (
        <div className="p-4 animate-in fade-in-0 duration-500">
            <Card className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg border border-white/50 p-4">
                 <CardHeader className="flex flex-col items-center text-center space-y-4">
                     <Skeleton className="h-24 w-24 rounded-full" />
                     <div className="space-y-2">
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-5 w-48" />
                     </div>
                 </CardHeader>
                 <CardContent className="mt-4">
                    <Separator className="bg-gray-300" />
                    <div className="grid gap-4 py-6">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                    </div>
                 </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="p-4 animate-in fade-in-0 duration-500">
      <Card className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg border border-white/50 p-4">
        <CardHeader className="flex flex-col items-center text-center space-y-4">
          <Avatar className="h-24 w-24 border-2 border-white">
            <AvatarImage src={user?.avatar || undefined} alt="User Avatar" data-ai-hint="person" />
            <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl text-[#333]">{user?.name || 'User'}</CardTitle>
            <CardDescription className="text-gray-600">{user?.email || 'user@email.com'}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="mt-4">
          <Separator className="bg-gray-300" />
          <div className="grid gap-4 py-6 text-gray-800">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Full Name</span>
              <span className="font-medium">{employee?.fields?.name || 'User Name'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Role</span>
              <span className="font-medium">{employee?.fields?.position || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Member Since</span>
              <span className="font-medium">{employee ? new Date(employee.createdTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric'}) : 'N/A'}</span>
            </div>
          </div>
          <Separator className="bg-gray-300" />
          <div className="mt-6 flex flex-col gap-4">
            <Button disabled className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-xl transition-transform transform hover:scale-105 duration-200 shadow-md disabled:opacity-50">Edit Profile (soon)</Button>
            <Button onClick={() => setIsChangePasswordOpen(true)} variant="outline" className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-xl transition-transform transform hover:scale-105 duration-200 shadow-md">Change Password</Button>
          </div>
        </CardContent>
      </Card>
      <ChangePasswordDialog isOpen={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen} />
    </div>
  );
}
