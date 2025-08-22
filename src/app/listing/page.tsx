
"use client";

import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { ScanLine, ShieldCheck, Search } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type InventoryItemDetail = {
    dot: string;
    quantity: number;
    series?: string;
    reason?: string;
};

type InventoryItem = {
    id: string;
    type: "Import" | "Export" | "Warranty";
    name: string;
    quantity: number;
    date: string;
    details: InventoryItemDetail[];
};


const inventoryItems: InventoryItem[] = Array.from({ length: 40 }, (_, i) => {
    const rand = Math.random();
    const type = rand < 0.45 ? "Import" : rand < 0.9 ? "Export" : "Warranty";
    const date = new Date(2023, 9, 26 - i).toISOString().split('T')[0];
    
    let id, name, details: InventoryItemDetail[], quantity = 0;

    switch(type) {
        case "Import":
            id = `PNK-${String(i + 1).padStart(4, '0')}`;
            name = `Phiếu Nhập ${id}`;
            const importDetailsCount = Math.floor(Math.random() * 3) + 1;
            details = Array.from({ length: importDetailsCount }, (__, j) => {
                const q = Math.floor(Math.random() * 20) + 1;
                quantity += q;
                return {
                    dot: String(Math.floor(Math.random() * 9000) + 1000),
                    quantity: q,
                }
            });
            break;
        case "Export":
            id = `PXK-${String(i + 1).padStart(4, '0')}`;
            name = `Phiếu Xuất ${id}`;
            const exportDetailsCount = Math.floor(Math.random() * 3) + 1;
            details = Array.from({ length: exportDetailsCount }, (__, j) => {
                const q = Math.floor(Math.random() * 20) + 1;
                return {
                    dot: String(Math.floor(Math.random() * 9000) + 1000),
                    quantity: q,
                    series: `SER-${String(Math.floor(Math.random() * 900000) + 100000)}`
                }
            });
            quantity = details.reduce((acc, item) => acc + item.quantity, 0);
            break;
        case "Warranty":
            id = `PBH-${String(i + 1).padStart(4, '0')}`;
            name = `Phiếu Bảo Hành ${id}`;
            quantity = 1;
            details = [{
                dot: String(Math.floor(Math.random() * 9000) + 1000),
                quantity: 1,
                series: `SER-${String(Math.floor(Math.random() * 900000) + 100000)}`,
                reason: Math.random() > 0.5 ? "Lỗi sản xuất" : "Hỏng vách"
            }];
            break;
    }

    return { id, type, name, quantity, date, details };
});


export default function ListingPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const filterType = searchParams.get('type');
    
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const itemsPerPage = 10;
    
    const filteredData = useMemo(() => {
        let items = inventoryItems;
        if (filterType) {
            items = items.filter(item => item.type.toLowerCase() === filterType.toLowerCase());
        }
        if (searchQuery) {
            items = items.filter(item => 
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                item.id.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return items;
    }, [filterType, searchQuery]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterType]);
    
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [currentPage, itemsPerPage, filteredData]);

    const handlePrevPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };
    
    const handleRowClick = (item: InventoryItem) => {
        setSelectedItem(item);
    };

    const handleCloseDialog = () => {
        setSelectedItem(null);
    };

    const getFabLink = () => {
        switch(filterType) {
            case 'import': return '/import';
            case 'export': return '/export';
            case 'warranty': return '/warranty';
            default: return '/';
        }
    }
    
    const getBadgeStyling = (type: "Import" | "Export" | "Warranty") => {
        switch(type) {
            case "Import": return "bg-blue-500";
            case "Export": return "bg-red-500";
            case "Warranty": return "bg-yellow-500";
        }
    }
    
    const getDialogTypeLabel = (type: "Import" | "Export" | "Warranty") => {
        switch(type) {
            case "Import": return "Nhập Kho";
            case "Export": return "Xuất Kho";
            case "Warranty": return "Bảo Hành";
        }
    }

  return (
    <div className="p-4 pb-8 animate-in fade-in-0 duration-500 flex flex-col">
      <Card className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-white/50 flex-grow flex flex-col">
        <div className="p-4 border-b border-white/50">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input
                    placeholder="Tìm kiếm phiếu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-gray-800 bg-white/80"
                />
            </div>
        </div>
        <div>
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-800 hover:bg-gray-800/90 border-b-2 border-gray-700">
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">#</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Tên phiếu</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Số lượng</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="bg-white/80">
                {paginatedData.map((item, index) => (
                    <TableRow key={item.id} onClick={() => handleRowClick(item)} className="hover:bg-gray-200/50 cursor-pointer transition duration-200 border-b border-gray-200/80">
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{item.name}</TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">
                        <Badge variant={item.type === "Import" ? "default" : "secondary"} className={`${getBadgeStyling(item.type)} text-white`}>
                            {item.type === "Import" ? `+${item.quantity}` : Math.abs(item.quantity)}
                        </Badge>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </div>
      </Card>
      
      <div className="flex justify-between items-center mt-4">
        {filteredData.length > itemsPerPage ? (
            <div className="flex justify-start items-center space-x-2">
                <Button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    size="sm"
                    className="px-3 py-1 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-md"
                >
                Trước
                </Button>
                <span className="text-sm font-medium text-white">
                Trang {currentPage} của {totalPages}
                </span>
                <Button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    size="sm"
                    className="px-3 py-1 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-md"
                >
                Sau
                </Button>
            </div>
        ) : (
            <div />
        )}
        <span className="text-sm font-medium text-white">
            Tổng cộng: {filteredData.length}
        </span>
      </div>

      {filterType && (
        <Button asChild className="fixed bottom-20 right-4 h-16 w-16 rounded-full bg-gray-800 hover:bg-gray-900 text-white shadow-lg z-20">
          <Link href={getFabLink()}>
            { filterType === 'warranty' ? <ShieldCheck className="h-8 w-8" /> : <ScanLine className="h-8 w-8" /> }
          </Link>
        </Button>
      )}

      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={(isOpen) => !isOpen && handleCloseDialog()}>
            <DialogContent className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg border-white/50 text-gray-800">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-[#333]">Chi Tiết Phiếu</DialogTitle>
                    <DialogDescription className="text-gray-600">
                        Thông tin chi tiết cho phiếu {selectedItem.id}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex justify-between">
                        <span className="font-semibold">Mã Phiếu:</span>
                        <span>{selectedItem.id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold">Loại:</span>
                        <Badge variant={selectedItem.type === "Import" ? "default" : "secondary"} className={`${getBadgeStyling(selectedItem.type)} text-white`}>
                           {getDialogTypeLabel(selectedItem.type)}
                        </Badge>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold">Ngày tạo:</span>
                        <span>{new Date(selectedItem.date).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold">Tổng số lượng:</span>
                        <span>{selectedItem.quantity}</span>
                    </div>
                    <div className="space-y-2 pt-2">
                        <h4 className="font-semibold text-gray-800">Chi tiết lốp:</h4>
                        <div className="overflow-y-auto rounded-lg border p-2 bg-gray-50/50">
                           <Table>
                                <TableHeader>
                                    <TableRow className="border-b-gray-300">
                                        {selectedItem.type === 'Export' && <TableHead className="text-gray-800">Series</TableHead>}
                                        {selectedItem.type === 'Warranty' && <TableHead className="text-gray-800">Series</TableHead>}
                                        <TableHead className="text-gray-800">DOT</TableHead>
                                        <TableHead className="text-gray-800">Số lượng</TableHead>
                                        {selectedItem.type === 'Warranty' && <TableHead className="text-gray-800">Lý do</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedItem.details.map((detail, index) => (
                                        <TableRow key={index} className="border-none">
                                            {(selectedItem.type === 'Export' || selectedItem.type === 'Warranty') && <TableCell>{detail.series}</TableCell>}
                                            <TableCell>{detail.dot}</TableCell>
                                            <TableCell>{detail.quantity}</TableCell>
                                            {selectedItem.type === 'Warranty' && <TableCell>{detail.reason}</TableCell>}
                                        </TableRow>
                                    ))}
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

    