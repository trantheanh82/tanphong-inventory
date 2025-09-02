
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const itemSchema = z.object({
  tire_type: z.enum(['Nội địa', 'Nước ngoài'], { required_error: "Vui lòng chọn loại."}),
  dot: z.string().length(4, { message: "DOT phải là 4 chữ số." }).regex(/^\d{4}$/, {
    message: "DOT phải là 4 chữ số.",
  }),
  quantity: z.coerce.number().int().positive({
    message: "Số lượng phải là một số dương.",
  }),
  series: z.string().optional(),
});

const formSchema = z.object({
  name: z.string().min(1, { message: "Tên phiếu xuất là bắt buộc." }),
  items: z.array(itemSchema).min(1, { message: "Phải có ít nhất một lốp xe." }),
});

export default function ExportPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            items: [{ tire_type: "Nội địa", dot: "", quantity: 1, series: "" }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const watchedItems = useWatch({ control: form.control, name: "items" });

    const isScanButtonVisible = useMemo(() => {
        if (!watchedItems || watchedItems.length === 0) return false;
        return watchedItems.every(item => 
            item.tire_type &&
            item.dot && /^\d{4}$/.test(item.dot) && 
            item.quantity && item.quantity > 0
        );
    }, [watchedItems]);

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

    const handleAddItem = () => {
        append({ tire_type: "Nội địa", dot: "", quantity: 1, series: "" });
    }

    return (
        <div className="p-4 animate-in fade-in-0 duration-500">
            <Card className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg border border-white/50">
                <CardHeader>
                    <CardTitle className="text-[#333]">Tạo Phiếu Xuất Kho</CardTitle>
                    <CardDescription className="text-gray-600">Điền thông tin chi tiết cho phiếu xuất kho lốp xe mới.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-800 font-semibold">Tên phiếu</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nhập tên phiếu xuất" {...field} className="bg-white/80 rounded-xl border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-gray-800" />
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
                                    
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.tire_type`}
                                        render={({ field }) => (
                                            <FormItem className="space-y-3 bg-gray-100/60 p-4 rounded-xl border border-gray-200">
                                                <FormControl>
                                                    <RadioGroup
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                        className="flex space-x-6 pt-2"
                                                    >
                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                            <FormControl>
                                                                <RadioGroupItem value="Nội địa" />
                                                            </FormControl>
                                                            <FormLabel className="font-normal text-gray-800 text-base">Nội địa</FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                            <FormControl>
                                                                <RadioGroupItem value="Nước ngoài" />
                                                            </FormControl>
                                                            <FormLabel className="font-normal text-gray-800 text-base">Nước ngoài</FormLabel>
                                                        </FormItem>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.dot`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-800 font-normal">DOT</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} className="bg-white/80 rounded-xl border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-gray-800"/>
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

                                    {watchedItems?.[index]?.tire_type === 'Nước ngoài' && (
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.series`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-800 font-normal">Series Number</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Quét để nhập" {...field} disabled className="bg-gray-200/80 rounded-xl border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-gray-800" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>
                            ))}

                            <div className="flex items-center justify-between gap-4 mt-6">
                                <Button 
                                    type="button" 
                                    variant="ghost"
                                    onClick={handleAddItem}
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
