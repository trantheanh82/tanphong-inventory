
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { ScanLine, PlusCircle, MinusCircle } from "lucide-react";
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
  name: z.string().min(1, { message: "Tên phiếu là bắt buộc." }),
  quantity: z.coerce.number().int().min(1, { message: "Phải có ít nhất một lốp xe." }),
});

export default function WarrantyPage() {
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

    const { control, handleSubmit, setValue, watch } = form;
    const quantity = watch('quantity');

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/warranty-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            const responseText = await response.text();
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (error) {
                result = { message: responseText };
            }

            if (response.ok && result.success) {
                toast({
                    title: "Thành công",
                    description: `Phiếu bảo hành "${values.name}" đã được tạo.`,
                });
                router.push(`/scanning?noteId=${result.warrantyNoteId}&type=warranty`);
            } else {
                throw new Error(result.message || 'Không thể tạo phiếu bảo hành.');
            }
        } catch (error: any) {
            console.error('Failed to create warranty note:', error);
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
        const currentQuantity = quantity || 0;
        const newQuantity = Math.max(1, currentQuantity + amount);
        setValue('quantity', newQuantity, { shouldValidate: true });
    };

    return (
        <div className="p-4 animate-in fade-in-0 duration-500">
            <Card className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg border border-white/50">
                <CardHeader>
                    <CardTitle className="text-[#333]">Tạo Phiếu Bảo Hành</CardTitle>
                    <CardDescription className="text-gray-600">Nhập tên và số lượng lốp cần bảo hành, sau đó tiến hành quét.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-800 font-semibold">Tên phiếu bảo hành</FormLabel>
                                        <FormControl>
                                            <Input placeholder="VD: Bảo hành cho khách A" {...field} className="bg-white/80 rounded-xl border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-gray-800" />
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
                                                    className="bg-white/80 rounded-xl border-gray-300 text-black text-center font-bold text-lg w-24 focus:outline-none focus:ring-2 focus:ring-gray-800"
                                                    readOnly
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
                                    <span>{isSubmitting ? 'Đang tạo...' : 'Quét Mã'}</span>
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
