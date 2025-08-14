import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const importItems = [
    { id: "PNK001", dot: "1234567890", quantity: 100 },
    { id: "PNK002", dot: "0987654321", quantity: 50 },
    { id: "PNK003", dot: "1122334455", quantity: 200 },
];

const exportItems = [
    { id: "PXK001", dot: "0011223344", quantity: 75 },
    { id: "PXK002", dot: "5566778899", quantity: 30 },
];

const TireIconSVG = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9" />
        <path d="M12 21c4.97 0 9-4.03 9-9" />
        <path d="M3 12c0 4.97 4.03 9 9 9" />
        <path d="M12 3c-4.97 0-9 4.03-9 9" />
        <path d="M18.36 5.64c-1.56-1.56-3.61-2.49-5.86-2.49" />
        <path d="M5.64 18.36c1.56 1.56 3.61 2.49 5.86 2.49" />
    </svg>
);

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in-0 duration-500 p-4">
        <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-6 bg-white/50 backdrop-blur-md rounded-xl shadow-lg cursor-pointer hover:scale-105 transition-transform duration-200 border border-white/50">
                <img src="https://placehold.co/100x100/fff/333?text=Nhập+Kho" alt="Scan QR code to import" className="w-20 h-20 mb-2 rounded-lg object-cover" data-ai-hint="warehouse import" />
                <span className="text-base font-semibold text-[#333]">Nhập Kho</span>
            </div>
            <div className="flex flex-col items-center justify-center p-6 bg-white/50 backdrop-blur-md rounded-xl shadow-lg cursor-pointer hover:scale-105 transition-transform duration-200 border border-white/50">
                <img src="https://placehold.co/100x100/fff/333?text=Xuất+Kho" alt="Empty warehouse shelf for export" className="w-20 h-20 mb-2 rounded-lg object-cover" data-ai-hint="warehouse export" />
                <span className="text-base font-semibold text-[#333]">Xuất Kho</span>
            </div>
        </div>

      <Card className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg p-4 transition-transform transform hover:scale-[1.01] duration-200 border border-white/50">
        <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2 text-2xl font-bold text-[#333]">
                <TireIconSVG className="w-6 h-6" />
                <span>Nhập Kho</span>
            </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <div className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên phiếu</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOT</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white/50 divide-y divide-gray-200">
                        {importItems.map((item) => (
                            <TableRow key={item.id} className="hover:bg-gray-200 cursor-pointer transition duration-200">
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.dot}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
        <CardFooter className="pt-4 p-0">
            <Button asChild className="mt-4 w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-xl transition-transform transform hover:scale-105 duration-200 flex items-center justify-center space-x-2 shadow-md">
                <Link href="/import">
                    Xem thêm
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </CardFooter>
      </Card>

      <Card className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg p-4 transition-transform transform hover:scale-[1.01] duration-200 border border-white/50">
        <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2 text-2xl font-bold text-[#333]">
                <TireIconSVG className="w-6 h-6" />
                <span>Xuất Kho</span>
            </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <div className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên phiếu</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOT</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white/50 divide-y divide-gray-200">
                        {exportItems.map((item) => (
                             <TableRow key={item.id} className="hover:bg-gray-200 cursor-pointer transition duration-200">
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.dot}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
        <CardFooter className="pt-4 p-0">
            <Button asChild className="mt-4 w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-xl transition-transform transform hover:scale-105 duration-200 flex items-center justify-center space-x-2 shadow-md">
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
