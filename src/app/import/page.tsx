
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import * as z from "zod";
import { useState, useMemo } from "react";
import { PlusCircle, ScanLine, XCircle } from "lucide-react";

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
  dot: z.string().regex(/^\d{1,4}$/, {
    message: "DOT phải là số và có tối đa 4 ký tự.",
  }),
  quantity: z.coerce.number().int().positive({
    message: "Số lượng phải là một số dương.",
  }),
});

const formSchema = z.object({
  items: z.array(itemSchema),
  importId: z.string().min(1, { message: "Mã phiếu nhập là bắt buộc." }),
});

export default function ImportPage() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            importId: "",
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
        return watchedItems.every(item => item.dot && /^\d{1,4}$/.test(item.dot) && item.quantity && item.quantity > 0);
    }, [watchedItems]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            for (const item of values.items) {
                const result = await updateInventory({ name: item.dot, quantity: item.quantity, type: 'import' });
                if (result.success) {
                    toast({
                        title: "Nhập kho thành công",
                        description: `Đã nhập ${item.quantity} lốp với DOT ${item.dot} cho phiếu ${values.importId}.`,
                    });
                } else {
                    toast({
                        title: "Lỗi",
                        description: `Lỗi khi nhập lốp với DOT ${item.dot}: ${result.message}`,
                        variant: "destructive",
                    });
                }
            }
            form.reset({ importId: "", items: [{ dot: "", quantity: 1 }] });
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
            <Card className="bg-[#E0F2FE] rounded-2xl shadow-lg border-0">
                <CardHeader>
                    <CardTitle className="text-slate-800">Tạo Phiếu Nhập Kho</CardTitle>
                    <CardDescription className="text-slate-600">Điền thông tin chi tiết cho phiếu nhập kho lốp xe mới.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="importId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-800 font-semibold">Tên phiếu</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nhập mã phiếu nhập" {...field} className="bg-white rounded-xl border-0 text-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            {fields.map((field, index) => (
                                <div key={field.id} className="p-4 rounded-xl bg-transparent relative space-y-4 border-b border-slate-300 last:border-b-0">
                                    <Label className="font-bold text-slate-800 block">Lốp {index + 1}</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.dot`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-800 font-semibold">DOT</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} className="bg-white rounded-xl border-0 text-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500" />
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
                                                    <FormLabel className="text-slate-800 font-semibold">Số lượng</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="1" {...field} className="bg-white rounded-xl border-0 text-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500"/>
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
                                            className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-transparent"
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
                                    className="bg-white/80 hover:bg-white text-slate-800 font-semibold py-3 px-6 rounded-xl flex items-center justify-center space-x-2"
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

    