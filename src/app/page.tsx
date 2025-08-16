
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowDownCircle, ArrowUpCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a4 4 0 0 0-4 4 4 4 0 0 0 8 0 4 4 0 0 0-4-4z" />
        <path d="M12 2v20" />
        <path d="M4.93 4.93l14.14 14.14" />
        <path d="M4.93 19.07L19.07 4.93" />
        <path d="M2 12h20" />
    </svg>
);

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in-0 duration-500 p-4">
        <div className="grid grid-cols-1 gap-4">
          <Image src="/images/tire3.jpg" alt="Tire" width={600} height={400} className="rounded-xl shadow-lg w-full h-auto" data-ai-hint="tire" />
        </div>
        
        <div className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg border border-white/50 p-4">
            <div className="flex justify-around items-center">
                <Link href="/import" className="flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-white/50 transition-colors duration-200">
                    <ArrowDownCircle className="w-12 h-12 mb-2 text-[#333]" />
                    <span className="text-sm font-semibold text-center text-[#333]">Nhập Kho</span>
                </Link>
                <Link href="/export" className="flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-white/50 transition-colors duration-200">
                    <ArrowUpCircle className="w-12 h-12 mb-2 text-[#333]" />
                    <span className="text-sm font-semibold text-center text-[#333]">Xuất Kho</span>
                </Link>
                <Link href="/warranty" className="flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-white/50 transition-colors duration-200">
                    <ShieldCheck className="w-12 h-12 mb-2 text-[#333]" />
                    <span className="text-sm font-semibold text-center text-[#333]">Bảo Hành</span>
                </Link>
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
