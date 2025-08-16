"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Tên lốp xe phải có ít nhất 2 ký tự.",
  }),
  quantity: z.coerce.number().int().positive({
    message: "Số lượng phải là một số dương.",
  }),
});

export default function ExportPage() {
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            quantity: 1,
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values);
        toast({
            title: "Xuất kho thành công",
            description: `Đã xuất ${values.quantity} lốp ${values.name}.`,
        });
        form.reset();
    }

    return (
        <div className="p-4 animate-in fade-in-0 duration-500">
            <Card className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg border border-white/50">
                <CardHeader>
                    <CardTitle className="text-[#333]">Phiếu Xuất Kho Mới</CardTitle>
                    <CardDescription className="text-gray-600">Điền thông tin chi tiết cho phiếu xuất kho lốp xe mới.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="exportId" className="text-gray-800">Mã phiếu xuất</Label>
                                <Input id="exportId" placeholder="EXP-0076" disabled />
                                <p className="text-sm text-gray-600">Mã phiếu xuất được tạo tự động.</p>
                            </div>
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-800">Tên lốp xe</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ví dụ: Lốp Michelin 205/55R16" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-800">Số lượng</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-xl transition-transform transform hover:scale-105 duration-200 flex items-center justify-center space-x-2 shadow-md">
                                Xác nhận xuất kho
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
