
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowDownCircle, ArrowUpCircle, ShieldCheck, ScanLine } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardData } from "@/models/inventory";


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
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const response = await fetch('/api/dashboard');
                if (response.ok) {
                    const jsonData = await response.json();
                    setData(jsonData);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in-0 duration-500 p-4">
        <div className="grid grid-cols-1 gap-4">
          <Image src="/images/tire3.jpg" alt="Tire" width={600} height={400} className="rounded-xl shadow-lg w-full h-auto" data-ai-hint="tire" />
        </div>
        
        <div className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg border border-white/50 p-4">
            <div className="flex items-center text-xl font-bold mb-4 text-[#333]">
                <ScanLine className="w-6 h-6 mr-2" strokeWidth={1.5} />
                <span>Tạo phiếu</span>
            </div>
            <div className="flex justify-around items-center">
                <Link href="/import" className="flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-white/50 transition-colors duration-200 flex-1">
                    <ArrowDownCircle className="w-12 h-12 mb-2 text-[#333]" strokeWidth={1.5} />
                    <span className="text-sm font-semibold text-center text-[#333]">Nhập Kho</span>
                </Link>
                <div className="w-px h-16 bg-gray-300" />
                <Link href="/export" className="flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-white/50 transition-colors duration-200 flex-1">
                    <ArrowUpCircle className="w-12 h-12 mb-2 text-[#333]" strokeWidth={1.5} />
                    <span className="text-sm font-semibold text-center text-[#333]">Xuất Kho</span>
                </Link>
                <div className="w-px h-16 bg-gray-300" />
                <Link href="/warranty" className="flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-white/50 transition-colors duration-200 flex-1">
                    <ShieldCheck className="w-12 h-12 mb-2 text-[#333]" strokeWidth={1.5} />
                    <span className="text-sm font-semibold text-center text-[#333]">Bảo Hành</span>
                </Link>
            </div>
        </div>

      <Card className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg p-4 transition-transform transform hover:scale-[1.01] duration-200 border border-white/50">
        <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-[#333]">
                <TireIconSVG className="w-6 h-6" />
                <span>Nhập Kho</span>
            </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <div className="overflow-hidden">
                 {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : (
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-200 hover:bg-gray-200/60 border-b-2 border-gray-300">
                            <TableHead className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">#</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tên phiếu</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Số lượng</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white/50">
                        {data?.imports?.slice(0, 3).map((item, index) => (
                            <TableRow key={item.id} className="hover:bg-gray-100/50 cursor-pointer transition duration-200 border-b border-gray-200 last:border-b-0">
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.fields.name}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.fields.total_quantity}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                )}
            </div>
        </CardContent>
        <CardFooter className="pt-4 p-0">
            <Button asChild className="mt-4 w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-xl transition-transform transform hover:scale-105 duration-200 flex items-center justify-center space-x-2 shadow-md">
                <Link href="/listing?type=import">
                    Xem thêm
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </CardFooter>
      </Card>

      <Card className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg p-4 transition-transform transform hover:scale-[1.01] duration-200 border border-white/50">
        <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-[#333]">
                <TireIconSVG className="w-6 h-6" />
                <span>Xuất Kho</span>
            </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <div className="overflow-hidden">
                {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : (
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-200 hover:bg-gray-200/60 border-b-2 border-gray-300">
                            <TableHead className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">#</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tên phiếu</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Số lượng</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white/50">
                        {data?.exports?.slice(0, 3).map((item, index) => (
                             <TableRow key={item.id} className="hover:bg-gray-100/50 cursor-pointer transition duration-200 border-b border-gray-200 last:border-b-0">
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.fields.name}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.fields.total_quantity}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                )}
            </div>
        </CardContent>
        <CardFooter className="pt-4 p-0">
            <Button asChild className="mt-4 w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-xl transition-transform transform hover:scale-105 duration-200 flex items-center justify-center space-x-2 shadow-md">
                <Link href="/listing?type=export">
                    Xem thêm
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </CardFooter>
      </Card>

      <Card className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg p-4 transition-transform transform hover:scale-[1.01] duration-200 border border-white/50">
        <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-[#333]">
                <ShieldCheck className="w-6 h-6" />
                <span>Bảo Hành</span>
            </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <div className="overflow-hidden">
                {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : (
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-200 hover:bg-gray-200/60 border-b-2 border-gray-300">
                            <TableHead className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">#</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tên phiếu</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Số lượng</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white/50">
                        {data?.warranties?.slice(0, 3).map((item, index) => (
                             <TableRow key={item.id} className="hover:bg-gray-100/50 cursor-pointer transition duration-200 border-b border-gray-200 last:border-b-0">
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.fields.name}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.fields.total_quarantine_note}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                )}
            </div>
        </CardContent>
        <CardFooter className="pt-4 p-0">
            <Button asChild className="mt-4 w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-xl transition-transform transform hover:scale-105 duration-200 flex items-center justify-center space-x-2 shadow-md">
                <Link href="/listing?type=warranty">
                    Xem thêm
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );

    