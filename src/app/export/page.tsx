
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import * as z from "zod";
import { useState, useMemo } from "react";
import { PlusCircle, ScanLine, XCircle } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { updateInventory } from "@/ai/flows/inventory-flow";

const itemSchema = z.object({
  dot: z.string().length(4, { message: "DOT phải là 4 chữ số." }).regex(/^\d{4}$/, {
    message: "DOT phải là 4 chữ số.",
  }),
  quantity: z.coerce.number().int().positive({
    message: "Số lượng phải là một số dương.",
  }),
});

const formSchema = z.object({
  items: z.array(itemSchema),
  exportId: z.string().min(1, { message: "Mã phiếu xuất là bắt buộc." }),
});

export default function ExportPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            exportId: "",
            items: [{ dot: "", quantity: 1 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const watchedItems = useWatch({
        control: form.control,
        name: "items",
    });

    const isScanButtonVisible = useMemo(() => {
        if (!watchedItems || watchedItems.length === 0) return false;
        return watchedItems.every(item => item.dot && /^\d{4}$/.test(item.dot) && item.quantity && item.quantity > 0);
    }, [watchedItems]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        // The original logic is commented out, but can be restored if needed.
        // try {
        //     for (const item of values.items) {
        //         const result = await updateInventory({ name: item.dot, quantity: item.quantity, type: 'export' });
        //         if (result.success) {
        //             toast({
        //                 title: "Xuất kho thành công",
        //                 description: `Đã xuất ${item.quantity} lốp với DOT ${item.dot} cho phiếu ${values.exportId}.`,
        //             });
        //         } else {
        //             toast({
        //                 title: "Lỗi",
        //                 description: `Lỗi khi xuất lốp với DOT ${item.dot}: ${result.message}`,
        //                 variant: "destructive",
        //             });
        //         }
        //     }
        //     form.reset({ exportId: "", items: [{ dot: "", quantity: 1 }] });
        // } catch (error) {
        //     toast({
        //         title: "Lỗi",
        //         description: "Đã có lỗi xảy ra khi gửi yêu cầu.",
        //         variant: "destructive",
        //     });
        // } finally {
        //     setIsSubmitting(false);
        // }
        router.push('/scanning');
    }

    return (
        <div className="p-4 animate-in fade-in-0 duration-500">
            <Card className="bg-[#E0F2FE] rounded-2xl shadow-lg border-0">
                <CardHeader>
                    <CardTitle className="text-slate-800">Tạo Phiếu Xuất Kho</CardTitle>
                    <CardDescription className="text-slate-600">Điền thông tin chi tiết cho phiếu xuất kho lốp xe mới.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="exportId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-800 font-semibold">Tên phiếu</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nhập mã phiếu xuất" {...field} className="bg-white rounded-xl border-slate-300 text-slate-800 focus-visible:ring-1 focus-visible:ring-blue-500 font-normal" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {fields.map((field, index) => (
                                <div key={field.id} className="rounded-xl bg-transparent relative space-y-4 border-b border-slate-300 pb-4 last:border-b-0">
                                    <div className="flex justify-between items-center">
                                        <Label className="font-bold text-slate-800">Lốp {index + 1}</Label>
                                        <span className="text-sm font-medium text-slate-600">Đã scan 0/{watchedItems?.[index]?.quantity || 0}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.dot`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-800 font-normal">DOT</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} className="bg-white rounded-xl border-slate-300 text-slate-800 focus-visible:ring-1 focus-visible:ring-blue-500 font-normal"/>
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
                                                    <FormLabel className="text-slate-800 font-normal">Số lượng</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="1" {...field} className="bg-white rounded-xl border-slate-300 text-slate-800 focus-visible:ring-1 focus-visible:ring-blue-500 font-normal"/>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    {index > 0 && (
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => remove(index)} 
                                            className="absolute top-0 right-0 text-red-500 hover:text-red-700 hover:bg-transparent"
                                        >
                                            <XCircle className="w-6 h-6" />
                                        </Button>
                                    )}
                                </div>
                            ))}

                            <div className="flex items-center justify-between gap-4 mt-6">
                                <Button 
                                    type="button" 
                                    variant="ghost"
                                    onClick={() => append({ dot: "", quantity: 1 })}
                                    className="bg-transparent hover:bg-transparent text-slate-800 font-semibold py-3 px-6 rounded-xl flex items-center justify-center space-x-2"
                                >
                                    <PlusCircle className="w-5 h-5" />
                                    <span>Thêm</span>
                                </Button>
                                
                                {isScanButtonVisible && (
                                    <Button 
                                        type="submit" 
                                        disabled={isSubmitting || !form.formState.isValid}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-md disabled:bg-blue-400"
                                    >
                                        <ScanLine className="w-5 h-5" />
                                        <span>{isSubmitting ? 'Đang xử lý...' : 'Quét Mã'}</span>
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
