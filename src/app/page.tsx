import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, PackageOpen, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";

const importItems = [
    { id: "PNK001", dot: "1234567890", quantity: 100 },
    { id: "PNK002", dot: "0987654321", quantity: 50 },
    { id: "PNK003", dot: "1122334455", quantity: 200 },
];

const exportItems = [
    { id: "PXK001", dot: "1234567890", quantity: 20 },
    { id: "PXK002", dot: "0987654321", quantity: 10 },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in-0 duration-500">
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                    <ArrowDown className="h-5 w-5 text-primary" />
                </div>
                <span className="font-bold text-lg">Nhập Kho</span>
            </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/30">
                        <TableHead className="text-muted-foreground font-semibold">TÊN PHIẾU</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">DOT</TableHead>
                        <TableHead className="text-right text-muted-foreground font-semibold">SỐ LƯỢNG</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {importItems.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.id}</TableCell>
                            <TableCell>{item.dot}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
        <CardFooter className="pt-6">
            <Button asChild variant="outline" className="w-full">
                <Link href="/import">
                    Xem thêm
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-3">
                 <div className="bg-primary/10 p-2 rounded-full">
                    <ArrowUp className="h-5 w-5 text-primary" />
                </div>
                <span className="font-bold text-lg">Xuất Kho</span>
            </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/30">
                        <TableHead className="text-muted-foreground font-semibold">TÊN PHIẾU</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">DOT</TableHead>
                        <TableHead className="text-right text-muted-foreground font-semibold">SỐ LƯỢNG</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {exportItems.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.id}</TableCell>
                            <TableCell>{item.dot}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
        <CardFooter className="pt-6">
            <Button asChild variant="outline" className="w-full">
                <Link href="/export">
                    Xem thêm
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
