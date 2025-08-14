import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in-0 duration-500">
      <div className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>
      <Card className="max-w-2xl">
        <CardHeader className="flex flex-col items-center text-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="person" />
            <AvatarFallback>TP</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">Admin User</CardTitle>
            <CardDescription>admin@tanphong.co</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="mt-4">
          <Separator />
          <div className="grid gap-4 py-6">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Full Name</span>
              <span className="font-medium">Tân Phong Admin</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium">Inventory Manager</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Member Since</span>
              <span className="font-medium">October 2023</span>
            </div>
          </div>
          <Separator />
          <div className="mt-6 flex gap-2">
            <Button className="flex-1">Edit Profile</Button>
            <Button variant="outline" className="flex-1">Change Password</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
