
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

const domesticItemSchema = z.object({
  dot: z.string().length(4, { message: "DOT phải là 4 chữ số." }).regex(/^\d{4}$/, {
    message: "DOT phải là 4 chữ số.",
  }),
  quantity: z.coerce.number().int().positive({
    message: "Số lượng phải là một số dương.",
  }),
});

const internationalItemSchema = z.object({
  dot: z.string().length(4, { message: "DOT phải là 4 chữ số." }).regex(/^\d{4}$/, {
    message: "DOT phải là 4 chữ số.",
  }),
  quantity: z.coerce.number().int().positive({
    message: "Số lượng phải là một số dương.",
  }),
  series: z.string().optional(),
});

const formSchema = z.object({
  exportId: z.string().min(1, { message: "Mã phiếu xuất là bắt buộc." }),
  type: z.enum(['domestic', 'international']),
  domesticItems: z.array(domesticItemSchema),
  internationalItems: z.array(internationalItemSchema),
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
            type: 'domestic',
            domesticItems: [{ dot: "", quantity: 1 }],
            internationalItems: [],
        },
    });

    const { fields: domesticFields, append: appendDomestic, remove: removeDomestic } = useFieldArray({
        control: form.control,
        name: "domesticItems",
    });
    
    const { fields: internationalFields, append: appendInternational, remove: removeInternational } = useFieldArray({
        control: form.control,
        name: "internationalItems",
    });

    const watchedDomesticItems = useWatch({ control: form.control, name: "domesticItems" });
    const watchedInternationalItems = useWatch({ control: form.control, name: "internationalItems" });

    const isScanButtonVisible = useMemo(() => {
        if (activeTab === 'domestic') {
            if (!watchedDomesticItems || watchedDomesticItems.length === 0) return false;
            return watchedDomesticItems.every(item => item.dot && /^\d{4}$/.test(item.dot) && item.quantity && item.quantity > 0);
        } else {
            if (!watchedInternationalItems || watchedInternationalItems.length === 0) return false;
            return watchedInternationalItems.every(item => item.dot && /^\d{4}$/.test(item.dot) && item.quantity && item.quantity > 0);
        }
    }, [activeTab, watchedDomesticItems, watchedInternationalItems]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        // Logic for what to do with the data on submission
        console.log(values);
        router.push('/scanning');
    }

    const handleTabChange = (value: string) => {
      setActiveTab(value);
      form.setValue('type', value as 'domestic' | 'international');
      if (value === 'domestic' && form.getValues('domesticItems').length === 0) {
        form.setValue('internationalItems', []);
        appendDomestic({ dot: "", quantity: 1 });
      } else if (value === 'international' && form.getValues('internationalItems').length === 0) {
        form.setValue('domesticItems', []);
        appendInternational({ dot: "", quantity: 1, series: "" });
      }
    }

    const handleAddItem = () => {
        if (activeTab === 'domestic') {
            appendDomestic({ dot: "", quantity: 1 });
        } else {
            appendInternational({ dot: "", quantity: 1, series: "" });
        }
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
                                <TabsList className="grid w-full grid-cols-2 bg-gray-200 rounded-xl p-1">
                                    <TabsTrigger value="domestic" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white rounded-lg data-[state=inactive]:bg-transparent data-[state=inactive]:text-black transition-all duration-300">Nội địa</TabsTrigger>
                                    <TabsTrigger value="international" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white rounded-lg data-[state=inactive]:bg-transparent data-[state=inactive]:text-black transition-all duration-300">Nước ngoài</TabsTrigger>
                                </TabsList>
                                <TabsContent value="domestic" className="mt-4">
                                  {domesticFields.map((field, index) => (
                                      <div key={field.id} className="relative space-y-4 pt-4 border-t border-gray-200 first:border-t-0">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Label className="font-bold text-gray-800">Lốp {index + 1}</Label>
                                                <span className="text-sm font-medium text-gray-600">(Đã scan 0/{watchedDomesticItems?.[index]?.quantity || 0})</span>
                                            </div>
                                            {domesticFields.length > 1 && (
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => removeDomestic(index)} 
                                                    className="text-red-500 hover:text-red-700 hover:bg-transparent"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </Button>
                                            )}
                                          </div>
                                          <div className="grid grid-cols-2 gap-4">
                                              <FormField
                                                  control={form.control}
                                                  name={`domesticItems.${index}.dot`}
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
                                                  name={`domesticItems.${index}.quantity`}
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
                                </TabsContent>
                                <TabsContent value="international" className="mt-4">
                                  {internationalFields.map((field, index) => (
                                      <div key={field.id} className="relative space-y-4 pt-4 border-t border-gray-200 first:border-t-0">
                                           <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Label className="font-bold text-gray-800">Lốp {index + 1}</Label>
                                                    <span className="text-sm font-medium text-gray-600">(Đã scan 0/{watchedInternationalItems?.[index]?.quantity || 0})</span>
                                                </div>
                                                {internationalFields.length > 1 && (
                                                    <Button 
                                                        type="button" 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => removeInternational(index)} 
                                                        className="text-red-500 hover:text-red-700 hover:bg-transparent"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </Button>
                                                )}
                                          </div>
                                          <div className="grid grid-cols-2 gap-4">
                                              <FormField
                                                  control={form.control}
                                                  name={`internationalItems.${index}.dot`}
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
                                                  name={`internationalItems.${index}.quantity`}
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
                                                name={`internationalItems.${index}.series`}
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
                                      </div>
                                  ))}
                                </TabsContent>
                            </Tabs>

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

    