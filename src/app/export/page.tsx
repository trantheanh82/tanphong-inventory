
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const dotTireSchema = z.object({
  dot: z.string().min(2, "DOT phải có ít nhất 2 chữ số").max(4, "DOT có thể có tối đa 4 chữ số"),
  quantity: z.coerce.number().int().positive("Số lượng phải là một số nguyên dương."),
});

const seriesTireSchema = z.object({
  quantity: z.coerce.number().int().positive("Số lượng phải là một số nguyên dương."),
});

const dotSeriesTireSchema = z.object({
  dot: z.string().min(2, "DOT phải có ít nhất 2 chữ số").max(4, "DOT có thể có tối đa 4 chữ số"),
  quantity: z.coerce.number().int().positive("Số lượng phải là một số nguyên dương."),
});

const formSchema = z.object({
  name: z.string().min(1, { message: "Tên phiếu xuất là bắt buộc." }),
  customer: z.string().optional(),
  dotTires: z.array(dotTireSchema),
  seriesTires: z.array(seriesTireSchema),
  dotSeriesTires: z.array(dotSeriesTireSchema),
}).refine(data => data.dotTires.length > 0 || data.seriesTires.length > 0 || data.dotSeriesTires.length > 0, {
    message: "Bạn phải thêm ít nhất một loại lốp xe.",
    path: ["dotTires"], // Assign error to a field so it can be displayed
});


export default function ExportPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            customer: "",
            dotTires: [],
            seriesTires: [],
            dotSeriesTires: [],
        },
    });

    const { fields: dotFields, append: appendDot, remove: removeDot } = useFieldArray({
      control: form.control,
      name: "dotTires",
    });
    
    const { fields: seriesFields, append: appendSeries, remove: removeSeries } = useFieldArray({
      control: form.control,
      name: "seriesTires",
    });

    const { fields: dotSeriesFields, append: appendDotSeries, remove: removeDotSeries } = useFieldArray({
      control: form.control,
      name: "dotSeriesTires",
    });


    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        // This will need to be updated to handle the complex payload.
        // For now, we can aggregate quantity for the existing API.
        try {
            console.log("Form values:", values);
            const totalDotQuantity = values.dotTires.reduce((sum, tire) => sum + tire.quantity, 0);
            const totalSeriesQuantity = values.seriesTires.reduce((sum, tire) => sum + tire.quantity, 0);
            const totalDotSeriesQuantity = values.dotSeriesTires.reduce((sum, tire) => sum + tire.quantity, 0);
            const totalQuantity = totalDotQuantity + totalSeriesQuantity + totalDotSeriesQuantity;

            // This API call needs to be replaced with one that can handle the complex form data
            const response = await fetch('/api/export-note', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: values.name, quantity: totalQuantity, customer: values.customer }), // Simplified payload
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

    return (
        <div className="p-4 animate-in fade-in-0 duration-500">
            <Card className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg border border-white/50">
                <CardHeader>
                    <CardTitle className="text-[#333]">Tạo Phiếu Xuất Kho</CardTitle>
                    <CardDescription className="text-gray-600">Nhập thông tin phiếu và thêm các loại lốp cần xuất.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[#333] font-semibold">Tên phiếu xuất</FormLabel>
                                        <FormControl>
                                            <Input placeholder="VD: Xuất hàng cho khách B" {...field} className="bg-white/80 rounded-xl border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-gray-800" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                             <FormField
                                control={form.control}
                                name="customer"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[#333] font-semibold">Khách hàng</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nhập tên khách hàng" {...field} className="bg-white/80 rounded-xl border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-gray-800" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <div className="space-y-4">
                                <FormLabel className="text-[#333] font-semibold">Thông tin lốp xe</FormLabel>
                                {form.formState.errors.dotTires && (
                                    <p className="text-sm font-medium text-destructive">{form.formState.errors.dotTires.message}</p>
                                )}

                                {/* DOT Section */}
                                <div className="border-t border-gray-300 pt-4">
                                    <div className="flex items-center justify-between">
                                        <FormLabel className="text-[#333] font-bold">DOT</FormLabel>
                                    </div>
                                    <div className="space-y-3 mt-2">
                                        {dotFields.map((field, index) => (
                                            <div key={field.id} className="flex items-end gap-2 border-b border-dotted border-gray-400 pb-3">
                                                <FormField
                                                    control={form.control}
                                                    name={`dotTires.${index}.dot`}
                                                    render={({ field }) => <FormItem className="flex-1"><FormLabel className="text-[#333]">DOT</FormLabel><FormControl><Input placeholder="VD: 2423" {...field} className="text-black bg-white/80" /></FormControl><FormMessage /></FormItem>}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`dotTires.${index}.quantity`}
                                                    render={({ field }) => <FormItem className="w-24"><FormLabel className="text-[#333]">Số lượng</FormLabel><FormControl><Input type="number" placeholder="SL" {...field} className="text-black bg-white/80" /></FormControl><FormMessage /></FormItem>}
                                                />
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeDot(index)}><XCircle className="w-5 h-5 text-red-500" /></Button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => appendDot({ dot: "", quantity: 1 })}
                                            className="text-[#333] hover:bg-transparent hover:text-[#333]"
                                        >
                                            <PlusCircle className="mr-2 h-4 w-4 text-[#333]" />
                                            <span className="text-[#333]">Thêm</span>
                                        </Button>
                                    </div>
                                </div>

                                {/* Series Section */}
                                <div className="border-t border-gray-300 pt-4">
                                    <div className="flex items-center justify-between">
                                        <FormLabel className="text-[#333] font-bold">Series</FormLabel>
                                    </div>
                                     <div className="space-y-3 mt-2">
                                        {seriesFields.map((field, index) => (
                                            <div key={field.id} className="flex items-end gap-2 border-b border-dotted border-gray-400 pb-3">
                                                <FormField
                                                    control={form.control}
                                                    name={`seriesTires.${index}.quantity`}
                                                    render={({ field }) => <FormItem className="w-24"><FormLabel className="text-[#333]">Số lượng</FormLabel><FormControl><Input type="number" placeholder="Số lượng" {...field} className="text-black bg-white/80" /></FormControl><FormMessage /></FormItem>}
                                                />
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeSeries(index)}><XCircle className="w-5 h-5 text-red-500" /></Button>
                                            </div>
                                        ))}
                                    </div>
                                     <div className="mt-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => appendSeries({ quantity: 1 })}
                                            className="text-[#333] hover:bg-transparent hover:text-[#333]"
                                        >
                                            <PlusCircle className="mr-2 h-4 w-4 text-[#333]" />
                                            <span className="text-[#333]">Thêm</span>
                                        </Button>
                                    </div>
                                </div>

                                {/* DOT & Series Section */}
                                <div className="border-t border-gray-300 pt-4">
                                    <div className="flex items-center justify-between">
                                        <FormLabel className="text-[#333] font-bold">DOT &amp; Series</FormLabel>
                                    </div>
                                    <div className="space-y-3 mt-2">
                                        {dotSeriesFields.map((field, index) => (
                                            <div key={field.id} className="flex items-end gap-2 border-b border-dotted border-gray-400 pb-3">
                                                <FormField
                                                    control={form.control}
                                                    name={`dotSeriesTires.${index}.dot`}
                                                    render={({ field }) => <FormItem className="flex-1"><FormLabel className="text-[#333]">DOT</FormLabel><FormControl><Input placeholder="VD: 2423" {...field} className="text-black bg-white/80" /></FormControl><FormMessage /></FormItem>}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`dotSeriesTires.${index}.quantity`}
                                                    render={({ field }) => <FormItem className="w-24"><FormLabel className="text-[#333]">Số lượng</FormLabel><FormControl><Input type="number" placeholder="SL" {...field} className="text-black bg-white/80" /></FormControl><FormMessage /></FormItem>}
                                                />
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeDotSeries(index)}><XCircle className="w-5 h-5 text-red-500" /></Button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => appendDotSeries({ dot: "", quantity: 1 })}
                                            className="text-[#333] hover:bg-transparent hover:text-[#333]"
                                        >
                                            <PlusCircle className="mr-2 h-4 w-4 text-[#333]" />
                                            <span className="text-[#333]">Thêm</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>


                            <div className="flex items-center justify-end gap-4 mt-6">
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting || !form.formState.isValid}
                                    className="bg-gray-800 hover:bg-gray-900 text-white hover:text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-md disabled:bg-gray-600"
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

    