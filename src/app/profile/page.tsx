
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChangePasswordDialog } from "@/components/change-password-dialog";

export default function ProfilePage() {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  return (
    <div className="p-4 animate-in fade-in-0 duration-500">
      <Card className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg border border-white/50 p-4">
        <CardHeader className="flex flex-col items-center text-center space-y-4">
          <Avatar className="h-24 w-24 border-2 border-white">
            <AvatarImage src="https://placehold.co/100x100/fff/333.png?text=A" alt="User Avatar" data-ai-hint="person" />
            <AvatarFallback>TP</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl text-[#333]">Admin User</CardTitle>
            <CardDescription className="text-gray-600">admin@tanphong.co</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="mt-4">
          <Separator className="bg-gray-300" />
          <div className="grid gap-4 py-6 text-gray-800">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Full Name</span>
              <span className="font-medium">Tân Phong Admin</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Role</span>
              <span className="font-medium">Inventory Manager</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Member Since</span>
              <span className="font-medium">October 2023</span>
            </div>
          </div>
          <Separator className="bg-gray-300" />
          <div className="mt-6 flex flex-col gap-4">
            <Button className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-xl transition-transform transform hover:scale-105 duration-200 shadow-md">Edit Profile</Button>
            <Button onClick={() => setIsChangePasswordOpen(true)} variant="outline" className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-xl transition-transform transform hover:scale-105 duration-200 shadow-md">Change Password</Button>
          </div>
        </CardContent>
      </Card>
      <ChangePasswordDialog isOpen={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen} />
    </div>
  );
}
