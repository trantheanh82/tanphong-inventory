"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import * as z from "zod";
import { useState, useMemo } from "react";
import { PlusCircle, ScanLine } from "lucide-react";

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
import { updateInventory } from "@/ai/flows/inventory-flow";
import { Separator } from "@/components/ui/separator";

const itemSchema = z.object({
  dot: z.string().min(2, {
    message: "DOT phải có ít nhất 2 ký tự.",
  }),
  quantity: z.coerce.number().int().positive({
    message: "Số lượng phải là một số dương.",
  }),
});

const formSchema = z.object({
  items: z.array(itemSchema),
});

export default function ImportPage() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            items: [{ dot: "", quantity: 1 }],
        },
    });

    const { fields, append } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const watchedItems = useWatch({
        control: form.control,
        name: "items",
    });

    const isScanButtonVisible = useMemo(() => {
        if (!watchedItems || watchedItems.length === 0) return false;
        return watchedItems.every(item => item.dot && item.dot.length > 0 && item.quantity && item.quantity > 0);
    }, [watchedItems]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            // Here you would likely navigate to the scanning page or process the items.
            // For now, we'll just toast a success message for each item.
            for (const item of values.items) {
                const result = await updateInventory({ name: item.dot, quantity: item.quantity, type: 'import' });
                if (result.success) {
                    toast({
                        title: "Nhập kho thành công",
                        description: `Đã nhập ${item.quantity} lốp với DOT ${item.dot}.`,
                    });
                } else {
                    toast({
                        title: "Lỗi",
                        description: `Lỗi khi nhập lốp với DOT ${item.dot}: ${result.message}`,
                        variant: "destructive",
                    });
                }
            }
            form.reset({ items: [{ dot: "", quantity: 1 }] });
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Đã có lỗi xảy ra khi gửi yêu cầu.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="p-4 animate-in fade-in-0 duration-500">
            <Card className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg border border-white/50">
                <CardHeader>
                    <CardTitle className="text-[#333]">Phiếu Nhập Kho Mới</CardTitle>
                    <CardDescription className="text-gray-600">Điền thông tin chi tiết cho phiếu nhập kho lốp xe mới.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="importId" className="text-gray-800">Mã phiếu nhập</Label>
                                <Input id="importId" placeholder="IMP-0129" disabled />
                                <p className="text-sm text-gray-600">Mã phiếu nhập được tạo tự động.</p>
                            </div>
                            
                            {fields.map((field, index) => (
                                <div key={field.id} className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <span className="text-gray-800 font-bold">{index + 1}.</span>
                                        <div className="grid grid-cols-2 gap-4 flex-1">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.dot`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-gray-800">DOT</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Nhập DOT" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.quantity`}
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
                                        </div>
                                    </div>
                                    <Separator className="bg-gray-300" />
                                </div>
                            ))}

                            <div className="flex items-center justify-between gap-4">
                                <Button 
                                    type="button" 
                                    onClick={() => append({ dot: "", quantity: 1 })}
                                    className="bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold py-2 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-sm"
                                >
                                    <PlusCircle className="w-5 h-5" />
                                    <span>Thêm</span>
                                </Button>

                                {isScanButtonVisible && (
                                    <Button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-md"
                                    >
                                        <ScanLine className="w-5 h-5" />
                                        <span>{isSubmitting ? 'Đang xử lý...' : 'Quét'}</span>
                                    </Button>
                                )}
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}