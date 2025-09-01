
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowDownCircle, ArrowUpCircle, ShieldCheck, ScanLine } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardData, RecordItem, InventoryItemDetail } from "@/models/inventory";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { NoteDetailRecord } from "@/models/note-detail";


const mapApiDetailToInventoryDetail = (apiDetail: NoteDetailRecord, type: "import" | "export" | "warranty"): InventoryItemDetail => {
    return {
        dot: apiDetail.fields.DOT || apiDetail.fields.dot,
        quantity: apiDetail.fields.quantity,
        scanned: apiDetail.fields.scanned || 0,
        series: apiDetail.fields.series,
        reason: apiDetail.fields.reason,
    };
};

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

const StatusCircle = ({ status }: { status: string }) => {
    const statusColor = {
      "Mới tạo": "bg-gray-400",
      "Đã scan đủ": "bg-green-500",
      "Chưa scan đủ": "bg-red-500",
    }[status];
  
    return <div className={cn("w-3 h-3 rounded-full", statusColor || "bg-gray-400")} />;
};

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<RecordItem | null>(null);
    const [selectedItemType, setSelectedItemType] = useState<"import" | "export" | "warranty" | null>(null);
    const [selectedItemDetails, setSelectedItemDetails] = useState<InventoryItemDetail[]>([]);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);

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

    const handleRowClick = async (item: RecordItem, type: "import" | "export" | "warranty") => {
        setSelectedItem(item);
        setSelectedItemType(type);
        setSelectedItemDetails([]);
        setIsFetchingDetails(true);
        try {
            const response = await fetch(`/api/note-detail?type=${type}&noteId=${item.id}`);
            if(response.ok) {
                const detailsData: NoteDetailRecord[] = await response.json();
                const mappedDetails = detailsData.map(d => mapApiDetailToInventoryDetail(d, type));
                setSelectedItemDetails(mappedDetails);
            } else {
                console.error("Failed to fetch note details");
                setSelectedItemDetails([]);
            }
        } catch (error) {
            console.error("Error fetching note details:", error);
            setSelectedItemDetails([]);
        } finally {
            setIsFetchingDetails(false);
        }
    };

    const handleCloseDialog = () => {
        setSelectedItem(null);
        setSelectedItemType(null);
    };

    const getBadgeStyling = (type: "import" | "export" | "warranty" | null) => {
        if (!type) return "";
        switch(type) {
            case "import": return "bg-blue-500";
            case "export": return "bg-red-500";
            case "warranty": return "bg-yellow-500";
        }
    }
    
    const getDialogTypeLabel = (type: "import" | "export" | "warranty" | null) => {
        if (!type) return "";
        switch(type) {
            case "import": return "Nhập Kho";
            case "export": return "Xuất Kho";
            case "warranty": return "Bảo Hành";
        }
    }
    
    const getQuantityForRecord = (item: RecordItem, type: "import" | "export" | "warranty") => {
        if (type === 'warranty') {
            return item.fields.total_warranty_note || 0;
        }
        return item.fields.total_quantity || 0;
    }


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

      <Card className="bg-white rounded-xl shadow-lg p-4 transition-transform transform hover:scale-[1.01] duration-200">
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
                        <TableRow className="bg-gray-200 hover:bg-gray-200 border-b-2 border-gray-300">
                            <TableHead className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-[1%]">#</TableHead>
                            <TableHead className="sticky left-0 bg-gray-200 px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tên phiếu</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-[1%]">Trạng thái</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Số lượng</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data?.imports?.slice(0, 3).map((item, index) => (
                            <TableRow key={item.id} onClick={() => handleRowClick(item, 'import')} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 cursor-pointer transition duration-200 border-b border-gray-200 last:border-b-0 group">
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</TableCell>
                                <TableCell className="sticky left-0 odd:bg-white even:bg-gray-50 group-hover:bg-gray-100 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.fields.name}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    <StatusCircle status={item.fields.status} />
                                </TableCell>
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

      <Card className="bg-white rounded-xl shadow-lg p-4 transition-transform transform hover:scale-[1.01] duration-200">
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
                        <TableRow className="bg-gray-200 hover:bg-gray-200 border-b-2 border-gray-300">
                            <TableHead className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-[1%]">#</TableHead>
                            <TableHead className="sticky left-0 bg-gray-200 px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tên phiếu</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-[1%]">Trạng thái</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Số lượng</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data?.exports?.slice(0, 3).map((item, index) => (
                             <TableRow key={item.id} onClick={() => handleRowClick(item, 'export')} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 cursor-pointer transition duration-200 border-b border-gray-200 last:border-b-0 group">
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</TableCell>
                                <TableCell className="sticky left-0 odd:bg-white even:bg-gray-50 group-hover:bg-gray-100 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.fields.name}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    <StatusCircle status={item.fields.status} />
                                </TableCell>
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

      <Card className="bg-white rounded-xl shadow-lg p-4 transition-transform transform hover:scale-[1.01] duration-200">
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
                        <TableRow className="bg-gray-200 hover:bg-gray-200 border-b-2 border-gray-300">
                            <TableHead className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-[1%]">#</TableHead>
                            <TableHead className="sticky left-0 bg-gray-200 px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tên phiếu</TableHead>
                             <TableHead className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-[1%]">Trạng thái</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Số lượng</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data?.warranties?.slice(0, 3).map((item, index) => (
                             <TableRow key={item.id} onClick={() => handleRowClick(item, 'warranty')} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 cursor-pointer transition duration-200 border-b border-gray-200 last:border-b-0 group">
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</TableCell>
                                <TableCell className="sticky left-0 odd:bg-white even:bg-gray-50 group-hover:bg-gray-100 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.fields.name}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    <StatusCircle status={item.fields.status} />
                                </TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.fields.total_warranty_note}</TableCell>
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
        {selectedItem && (
            <Dialog open={!!selectedItem} onOpenChange={(isOpen) => !isOpen && handleCloseDialog()}>
                <DialogContent className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg border-white/50 text-gray-800">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-[#333]">Chi Tiết Phiếu</DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Thông tin chi tiết cho phiếu {selectedItem.fields.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex justify-between">
                            <span className="font-semibold">Tên Phiếu:</span>
                            <span>{selectedItem.fields.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Loại:</span>
                            <Badge variant={selectedItemType === "import" ? "default" : "secondary"} className={`${getBadgeStyling(selectedItemType)} text-white`}>
                            {getDialogTypeLabel(selectedItemType)}
                            </Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Trạng thái:</span>
                            <span>{selectedItem.fields.status}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Ngày tạo:</span>
                            <span>{new Date(selectedItem.createdTime).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Tổng số lượng:</span>
                            <span>{selectedItemType && getQuantityForRecord(selectedItem, selectedItemType)}</span>
                        </div>
                        <div className="space-y-2 pt-2">
                            <h4 className="font-semibold text-gray-800">Chi tiết lốp:</h4>
                            <div className="overflow-y-auto rounded-lg border p-2 bg-gray-50/50 max-h-48">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b-gray-300">
                                        <TableHead className="text-gray-800">#</TableHead>
                                        {(selectedItemType === 'export' || selectedItemType === 'warranty') && <TableHead className="text-gray-800">Series</TableHead>}
                                        <TableHead className="text-gray-800">DOT</TableHead>
                                        <TableHead className="text-gray-800">Đã scan</TableHead>
                                        <TableHead className="text-gray-800">Số lượng</TableHead>
                                        {selectedItemType === 'warranty' && <TableHead className="text-gray-800">Lý do</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isFetchingDetails ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center">
                                                <Skeleton className="h-8 w-full" />
                                            </TableCell>
                                        </TableRow>
                                    ) : selectedItemDetails.length > 0 ? selectedItemDetails.map((detail, index) => (
                                        <TableRow key={index} className="border-none">
                                            <TableCell>{index + 1}</TableCell>
                                            {(selectedItemType === 'export' || selectedItemType === 'warranty') && <TableCell>{detail.series || 'N/A'}</TableCell>}
                                            <TableCell>{detail.dot}</TableCell>
                                            <TableCell>{detail.scanned}</TableCell>
                                            <TableCell>{detail.quantity}</TableCell>
                                            {selectedItemType === 'warranty' && <TableCell>{detail.reason}</TableCell>}
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-gray-500">
                                                Chưa có chi tiết.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )}
    </div>
  );
}

    
    