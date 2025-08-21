
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { ScanLine, ShieldCheck } from "lucide-react";
import { useRouter } from 'next/navigation';

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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  series: z.string().min(1, { message: "Số series là bắt buộc." }),
  reason: z.string().min(10, { message: "Lý do bảo hành phải có ít nhất 10 ký tự." }),
});

export default function WarrantyPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            series: "",
            reason: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        console.log(values);
        // Here you would typically call an API to submit the warranty claim
        toast({
            title: "Yêu cầu đã được gửi",
            description: "Yêu cầu bảo hành của bạn đã được gửi thành công.",
        });
        router.push('/listing?type=warranty');
    }

    return (
        <div className="p-4 animate-in fade-in-0 duration-500">
            <Card className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg border border-white/50">
                <CardHeader>
                    <CardTitle className="text-[#333] flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6" />
                        <span>Tạo Phiếu Bảo Hành</span>
                    </CardTitle>
                    <CardDescription className="text-gray-600">Quét số series và điền lý do để tạo phiếu bảo hành.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="relative">
                                <FormField
                                    control={form.control}
                                    name="series"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-800 font-semibold">Số Series</FormLabel>
                                            <FormControl>
                                                <div className="flex gap-2">
                                                    <Input placeholder="Nhập hoặc quét số series" {...field} className="bg-white/80 rounded-xl border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-gray-800 flex-grow" />
                                                    <Button type="button" size="icon" className="bg-gray-800 hover:bg-gray-900 text-white rounded-xl" onClick={() => router.push('/scanning')}>
                                                        <ScanLine className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="reason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-800 font-semibold">Lý do bảo hành</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Mô tả chi tiết lý do bảo hành..." {...field} className="bg-white/80 rounded-xl border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-gray-800" rows={4} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button 
                                type="submit" 
                                disabled={isSubmitting || !form.formState.isValid}
                                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-md disabled:bg-gray-600"
                            >
                                <ShieldCheck className="w-5 h-5" />
                                <span>{isSubmitting ? 'Đang gửi...' : 'Gửi Yêu Cầu'}</span>
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
