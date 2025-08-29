
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import * as z from "zod";
import { useState, useMemo } from "react";
import { PlusCircle, ScanLine, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

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
import { Separator } from "@/components/ui/separator";

const itemSchema = z.object({
  dot: z.string().length(4, { message: "DOT phải là 4 chữ số." }).regex(/^\d{4}$/, {
    message: "DOT phải là 4 chữ số.",
  }),
  quantity: z.coerce.number().int().positive({
    message: "Số lượng phải là một số dương.",
  }),
});

const formSchema = z.object({
  items: z.array(itemSchema).min(1, { message: "Phải có ít nhất một lốp xe." }),
  importId: z.string().min(1, { message: "Mã phiếu nhập là bắt buộc." }),
});

export default function ImportPage() {
    const { toast } = useToast();
    const router = useRouter();
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
        if (!watchedItems || watchedItems.length === 0 || !form.getValues('importId')) return false;
        return watchedItems.every(item => item.dot && /^\d{4}$/.test(item.dot) && item.quantity && item.quantity > 0);
    }, [watchedItems, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/import-note', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            const result = await response.json();

            if (response.ok) {
                toast({
                    title: "Thành công",
                    description: `Phiếu nhập kho "${values.importId}" đã được tạo.`,
                });
                router.push(`/scanning?noteId=${result.importNoteId}&type=import`);
            } else {
                throw new Error(result.message || 'Không thể tạo phiếu nhập kho.');
            }
        } catch (error: any) {
            console.error('Failed to create import note:', error);
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
                    <CardTitle className="text-[#333]">Tạo Phiếu Nhập Kho</CardTitle>
                    <CardDescription className="text-gray-600">Điền thông tin chi tiết cho phiếu nhập kho lốp xe mới.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="importId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-800 font-semibold">Tên phiếu</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nhập mã phiếu nhập" {...field} className="bg-white/80 rounded-xl border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-gray-800" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            {fields.map((field, index) => (
                                <div key={field.id} className="relative space-y-4 pt-4 border-t border-gray-200 first:border-t-0">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                          <Label className="font-bold text-gray-800">Lốp {index + 1}</Label>
                                          <span className="text-sm font-medium text-gray-600">(Đã scan 0/{watchedItems?.[index]?.quantity || 0})</span>
                                      </div>
                                      {fields.length > 1 && (
                                          <Button 
                                              type="button" 
                                              variant="ghost" 
                                              size="icon" 
                                              onClick={() => remove(index)} 
                                              className="text-red-500 hover:text-red-700 hover:bg-transparent"
                                          >
                                              <XCircle className="w-5 h-5" />
                                          </Button>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.dot`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-800 font-normal">DOT</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} className="bg-white/80 rounded-xl border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-gray-800" />
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
                                                    <FormLabel className="text-gray-800 font-normal">Số lượng</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="1" {...field} className="bg-white/80 rounded-xl border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-gray-800"/>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}

                            <div className="flex items-center justify-between gap-4 mt-6">
                                <Button 
                                    type="button" 
                                    variant="ghost"
                                    onClick={() => append({ dot: "", quantity: 1 })}
                                    className="text-gray-800 font-semibold py-3 px-6 rounded-xl flex items-center justify-center space-x-2"
                                >
                                    <PlusCircle className="w-5 h-5" />
                                    <span>Thêm</span>
                                </Button>

                                {isScanButtonVisible && (
                                    <Button 
                                        type="submit" 
                                        disabled={isSubmitting || !form.formState.isValid}
                                        className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-md disabled:bg-gray-600"
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
