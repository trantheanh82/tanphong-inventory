'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { PlusCircle, Save, XCircle } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

const itemSchema = z.object({
  series: z.string().min(1, { message: "Series là bắt buộc." }),
});

const formSchema = z.object({
  name: z.string().min(1, { message: "Tên phiếu là bắt buộc." }),
  items: z.array(itemSchema).min(1, { message: "Phải có ít nhất một lốp xe." }),
});

export default function WarrantyPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            items: [{ series: "" }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/warranty-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                toast({
                    title: "Thành công",
                    description: `Phiếu bảo hành "${values.name}" đã được tạo.`,
                });
                router.push(`/listing?type=warranty`);
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

    return (
        <div className="p-4 animate-in fade-in-0 duration-500">
            <Card className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg border border-white/50">
                <CardHeader>
                    <CardTitle className="text-[#333]">Tạo Phiếu Bảo Hành</CardTitle>
                    <CardDescription className="text-gray-600">Điền thông tin chi tiết cho phiếu bảo hành.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
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

                            <Separator />

                            {fields.map((field, index) => (
                                <div key={field.id} className="relative space-y-4 p-4 border border-gray-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-800">Lốp xe #{index + 1}</h3>
                                        {fields.length > 1 && (
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-red-500 hover:text-red-700">
                                                <XCircle className="w-5 h-5" />
                                            </Button>
                                        )}
                                    </div>
                                    
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.series`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-800 font-normal">Series lốp</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nhập hoặc quét series" {...field} className="bg-white/80 rounded-xl border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-gray-800" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            ))}

                            <div className="flex items-center justify-between gap-4 mt-6">
                                <Button 
                                    type="button" 
                                    variant="ghost"
                                    onClick={() => append({ series: "" })}
                                    className="text-gray-800 font-semibold py-3 px-6 rounded-xl flex items-center justify-center space-x-2"
                                >
                                    <PlusCircle className="w-5 h-5" />
                                    <span>Thêm lốp</span>
                                </Button>
                                
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting || !form.formState.isValid}
                                    className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-md disabled:bg-gray-600"
                                >
                                    <Save className="w-5 h-5" />
                                    <span>{isSubmitting ? 'Đang tạo...' : 'Tạo Phiếu'}</span>
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
