
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/form";
import { useRouter } from "next/navigation";


const formSchema = z.object({
    currentPassword: z.string().min(1, { message: "Mật khẩu hiện tại là bắt buộc." }),
    newPassword: z.string().min(6, { message: "Mật khẩu mới phải có ít nhất 6 ký tự." }),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
});


interface ChangePasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ChangePasswordDialog({ isOpen, onOpenChange }: ChangePasswordDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                password: values.currentPassword,
                newPassword: values.newPassword,
            }),
        });

        const result = await response.json();

        if (response.ok) {
            toast({
                title: "Thành công",
                description: "Mật khẩu của bạn đã được thay đổi. Vui lòng đăng nhập lại.",
            });
            sessionStorage.removeItem('isLoggedIn');
            handleClose();
            router.push('/login');
        } else {
             toast({
                variant: 'destructive',
                title: "Lỗi",
                description: result.message || "Không thể thay đổi mật khẩu.",
            });
        }

    } catch (error) {
        console.error('Failed to change password:', error);
        toast({
            variant: 'destructive',
            title: "Lỗi",
            description: "Đã xảy ra lỗi không mong muốn.",
        });
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg border-white/50 text-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#333]">Thay đổi mật khẩu</DialogTitle>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                 <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                        <FormItem>
                            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                            <FormControl>
                                <Input id="currentPassword" type="password" {...field} className="bg-white/80 rounded-xl border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-gray-800"/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                        <FormItem>
                            <Label htmlFor="newPassword">Mật khẩu mới</Label>
                             <FormControl>
                                <Input id="newPassword" type="password" {...field} className="bg-white/80 rounded-xl border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-gray-800"/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                             <FormControl>
                                <Input id="confirmPassword" type="password" {...field} className="bg-white/80 rounded-xl border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-gray-800"/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter className="pt-4">
                    <Button type="button" variant="ghost" onClick={handleClose}>Hủy</Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-gray-800 hover:bg-gray-900 text-white">
                        {isSubmitting ? "Đang thay đổi..." : "Thay đổi"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
