
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const itemSchema = z.object({
  dot: z.string().length(4, { message: "DOT phải là 4 chữ số." }).regex(/^\d{4}$/, {
    message: "DOT phải là 4 chữ số.",
  }),
  quantity: z.coerce.number().int().positive({
    message: "Số lượng phải là một số dương.",
  }),
  series: z.string().optional(),
});

const formSchema = z.object({
  items: z.array(itemSchema),
  exportId: z.string().min(1, { message: "Mã phiếu xuất là bắt buộc." }),
  type: z.enum(['domestic', 'international']),
});

export default function ExportPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('domestic');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            exportId: "",
            items: [{ dot: "", quantity: 1 }],
            type: 'domestic',
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
        router.push('/scanning');
    }

    const handleTabChange = (value: string) => {
      setActiveTab(value);
      form.setValue('type', value as 'domestic' | 'international');
      // Reset items when switching tabs to ensure clean state
      form.reset({
        exportId: form.getValues('exportId'),
        items: [{ dot: "", quantity: 1, series: "" }],
        type: value as 'domestic' | 'international',
      });
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
                                name="exportId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-800 font-semibold">Tên phiếu</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nhập mã phiếu xuất" {...field} className="bg-white/80 rounded-xl border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-gray-800" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="domestic">Nội địa</TabsTrigger>
                                    <TabsTrigger value="international">Nước ngoài</TabsTrigger>
                                </TabsList>
                                <TabsContent value="domestic">
                                  {fields.map((field, index) => (
                                      <div key={field.id} className="relative space-y-4 pt-4">
                                          {index > 0 && <Separator className="bg-gray-300" />}
                                          <div className="flex items-center gap-2">
                                              <Label className="font-bold text-gray-800">Lốp {index + 1}</Label>
                                              <span className="text-sm font-medium text-gray-600">(Đã scan 0/{watchedItems?.[index]?.quantity || 0})</span>
                                          </div>
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
                                </TabsContent>
                                <TabsContent value="international">
                                  {fields.map((field, index) => (
                                      <div key={field.id} className="relative space-y-4 pt-4">
                                          {index > 0 && <Separator className="bg-gray-300" />}
                                          <div className="flex items-center gap-2">
                                              <Label className="font-bold text-gray-800">Lốp {index + 1}</Label>
                                              <span className="text-sm font-medium text-gray-600">(Đã scan 0/{watchedItems?.[index]?.quantity || 0})</span>
                                          </div>
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
                                </TabsContent>
                            </Tabs>

                            <div className="flex items-center justify-between gap-4 mt-6">
                                <Button 
                                    type="button" 
                                    variant="ghost"
                                    onClick={() => append({ dot: "", quantity: 1, series: "" })}
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

    