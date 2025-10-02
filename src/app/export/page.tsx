
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
import { Separator } from "@/components/ui/separator";

const tireItemSchema = z.object({
  dot: z.string().min(2, "DOT must be at least 2 digits").max(4, "DOT can be at most 4 digits"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
});

const formSchema = z.object({
  name: z.string().min(1, { message: "Tên phiếu xuất là bắt buộc." }),
  customer: z.string().optional(),
  tires: z.array(tireItemSchema).min(1, "You must add at least one tire."),
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
            tires: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "tires",
    });

    const { control, handleSubmit } = form;

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        // This is a placeholder for the actual submission logic.
        // The API endpoint and payload will need to be updated to handle the new form structure.
        try {
            // NOTE: The API endpoint /api/export-note currently expects a single `name` and `quantity`.
            // It will need to be updated to handle a customer and an array of tires.
            console.log("Form values to be submitted:", values);
            
            // Simulating API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const totalQuantity = values.tires.reduce((sum, tire) => sum + tire.quantity, 0);

            // Mock response for now
            const response = await fetch('/api/export-note', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: values.name, quantity: totalQuantity }),
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
                                name="customer"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-800 font-semibold">Khách hàng</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nhập tên khách hàng" {...field} className="bg-white/80 rounded-xl border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-gray-800" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Separator className="my-4" />

                            <div>
                                <FormLabel className="text-gray-800 font-semibold">Thông tin lốp xe</FormLabel>
                                <div className="space-y-4 mt-2">
                                     {fields.map((field, index) => (
                                        <div key={field.id} className="flex items-end gap-4 p-4 border rounded-lg bg-white/60">
                                            <FormField
                                                control={control}
                                                name={`tires.${index}.dot`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormLabel className="text-gray-800">Lốp DOT</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="VD: 2423" {...field} className="bg-white/80 rounded-xl border-gray-300 text-black"/>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={control}
                                                name={`tires.${index}.quantity`}
                                                render={({ field }) => (
                                                    <FormItem  className="w-24">
                                                        <FormLabel className="text-gray-800">Số lượng</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" {...field} className="bg-white/80 rounded-xl border-gray-300 text-black"/>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                                <XCircle className="w-5 h-5 text-red-500" />
                                            </Button>
                                        </div>
                                    ))}
                                    
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => append({ dot: "", quantity: 1 })}
                                        className="bg-white/80 border-gray-300 text-gray-800"
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Thêm DOT
                                    </Button>
                                    <FormMessage>{form.formState.errors.tires?.message}</FormMessage>
                                </div>
                            </div>


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

    