
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { PlusCircle, ScanLine, MinusCircle } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, { message: "Tên phiếu xuất là bắt buộc." }),
  quantity: z.coerce.number().int().min(1, { message: "Số lượng phải lớn hơn 0." }),
});

export default function ExportPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            quantity: 1,
        },
    });

    const { control, handleSubmit, setValue, getValues } = form;

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/export-note', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            const result = await response.json();

            if (response.ok) {
                toast({
                    title: "Thành công",
                    description: `Phiếu xuất kho "${values.name}" đã được tạo.`,
                });
                router.push(`/scanning?noteId=${result.exportNoteId}&type=export`);
            } else {
                throw new Error(result.message || 'Không thể tạo phiếu xuất kho.');
            }
        } catch (error: any) {
            console.error('Failed to create export note:', error);
            toast({
                variant: 'destructive',
                title: "Lỗi",
                description: error.message,
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleQuantityChange = (amount: number) => {
        const currentQuantity = getValues('quantity') || 0;
        const newQuantity = Math.max(1, currentQuantity + amount);
        setValue('quantity', newQuantity, { shouldValidate: true });
    };


    return (
        <div className="p-4 animate-in fade-in-0 duration-500">
            <Card className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg border border-white/50">
                <CardHeader>
                    <CardTitle className="text-[#333]">Tạo Phiếu Xuất Kho</CardTitle>
                    <CardDescription className="text-gray-600">Nhập tên và tổng số lượng lốp cần xuất, sau đó tiến hành quét.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-800 font-semibold">Tên phiếu xuất</FormLabel>
                                        <FormControl>
                                            <Input placeholder="VD: Xuất hàng cho khách B" {...field} className="bg-white/80 rounded-xl border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-gray-800" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                             <FormField
                                control={control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-800 font-semibold">Số lượng lốp</FormLabel>
                                        <FormControl>
                                            <div className="flex items-center gap-4">
                                                <Button type="button" size="icon" variant="outline" onClick={() => handleQuantityChange(-1)} className="bg-white/80 border-gray-300">
                                                    <MinusCircle className="w-5 h-5 text-gray-800"/>
                                                </Button>
                                                <Input 
                                                    {...field}
                                                    type="number"
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        // Allow empty string for clearing, otherwise parse as number
                                                        field.onChange(value === '' ? '' : Number(value));
                                                    }}
                                                    className="bg-white/80 rounded-xl border-gray-300 text-black text-center font-bold text-lg w-24 focus:outline-none focus:ring-2 focus:ring-gray-800"
                                                />
                                                <Button type="button" size="icon" variant="outline" onClick={() => handleQuantityChange(1)} className="bg-white/80 border-gray-300">
                                                    <PlusCircle className="w-5 h-5 text-gray-800"/>
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex items-center justify-end gap-4 mt-6">
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting || !form.formState.isValid}
                                    className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-md disabled:bg-gray-600"
                                >
                                    <ScanLine className="w-5 h-5" />
                                    <span>{isSubmitting ? 'Đang tạo...' : 'Tạo và Quét'}</span>
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
