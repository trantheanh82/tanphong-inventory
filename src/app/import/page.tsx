"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

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

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Tên phiếu must be at least 2 characters.",
  }),
  quantity: z.coerce.number().int().positive({
    message: "Số lượng must be a positive number.",
  }),
});

export default function ImportPage() {
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            quantity: 1,
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values);
        toast({
            title: "Import Successful",
            description: `Imported ${values.quantity} of ${values.name}.`,
        });
        form.reset();
    }

    return (
        <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in-0 duration-500">
            <div className="space-y-1.5">
                <h1 className="text-3xl font-bold tracking-tight">Import Tires</h1>
                <p className="text-muted-foreground">Record a new shipment of tires into the inventory.</p>
            </div>
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>New Import Form</CardTitle>
                    <CardDescription>Fill in the details for the new tire import.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <div className="space-y-2">
                                <Label htmlFor="importId">Import #</Label>
                                <Input id="importId" placeholder="IMP-0129" disabled />
                                <p className="text-sm text-muted-foreground">The import ID is generated automatically.</p>
                            </div>
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tên phiếu (Tire Name)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Lốp Michelin 205/55R16" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Số lượng (Quantity)</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit">Submit Import</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
