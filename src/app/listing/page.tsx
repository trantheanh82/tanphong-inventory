
"use client";

import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { ScanLine } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type InventoryItemDetail = {
    dot: string;
    quantity: number;
    series?: string;
};

type InventoryItem = {
    id: string;
    type: "Import" | "Export";
    name: string;
    quantity: number;
    date: string;
    details: InventoryItemDetail[];
};


const inventoryItems: InventoryItem[] = Array.from({ length: 40 }, (_, i) => {
    const isImport = Math.random() > 0.5;
    const date = new Date(2023, 9, 26 - i).toISOString().split('T')[0];
    const id = `${isImport ? 'PNK' : 'PXK'}-${String(i + 1).padStart(4, '0')}`;
    const detailsCount = Math.floor(Math.random() * 3) + 1;
    let totalQuantity = 0;
    const details: InventoryItemDetail[] = Array.from({ length: detailsCount }, (__, j) => {
        const quantity = Math.floor(Math.random() * 20) + 1;
        totalQuantity += quantity;
        return {
            dot: String(Math.floor(Math.random() * 9000) + 1000),
            quantity: quantity,
            series: isImport ? undefined : `SER-${String(Math.floor(Math.random() * 900000) + 100000)}`
        }
    });

    return {
        id,
        type: isImport ? "Import" : "Export",
        name: isImport ? `Phiếu Nhập ${id}` : `Phiếu Xuất ${id}`,
        quantity: isImport ? totalQuantity : -totalQuantity,
        date: date,
        details: details
    }
});


export default function ListingPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const filterType = searchParams.get('type');
    
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const itemsPerPage = 10;
    
    const filteredData = useMemo(() => {
        if (!filterType) return inventoryItems;
        return inventoryItems.filter(item => item.type.toLowerCase() === filterType.toLowerCase());
    }, [filterType]);
    
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

    const fabLink = filterType === 'import' ? '/import' : '/export';

  return (
    <div className="p-4 animate-in fade-in-0 duration-500">
      <Card className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-white/50">
        <Table>
            <thead className="bg-gray-800">
                <TableRow className="hover:bg-gray-800">
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">#</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Tên phiếu</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Số lượng</TableHead>
                </TableRow>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.map((item, index) => (
                <TableRow key={item.id} onClick={() => handleRowClick(item)} className="hover:bg-gray-100/50 cursor-pointer transition duration-200">
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">
                    <Badge variant={item.type === "Import" ? "default" : "secondary"} className={`${item.type === 'Import' ? 'bg-blue-500' : 'bg-red-500'} text-white`}>
                        {item.quantity > 0 ? `+${item.quantity}` : item.quantity}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
      </Card>
      
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm font-medium text-white">
            Tổng cộng: {filteredData.length}
        </span>
        <div className="flex justify-center items-center space-x-2">
            <Button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-xl hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-md"
            >
              Trước
            </Button>
            <span className="text-sm font-medium text-white">
              Trang {currentPage} của {totalPages}
            </span>
            <Button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-xl hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-md"
            >
              Sau
            </Button>
        </div>
      </div>

      {filterType && (
        <Button asChild className="fixed bottom-20 right-4 h-16 w-16 rounded-full bg-gray-800 hover:bg-gray-900 text-white shadow-lg z-20">
          <Link href={fabLink}>
            <ScanLine className="h-8 w-8" />
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
                        <Badge variant={selectedItem.type === "Import" ? "default" : "secondary"} className={`${selectedItem.type === 'Import' ? 'bg-blue-500' : 'bg-red-500'} text-white`}>
                            {selectedItem.type === "Import" ? "Nhập Kho" : "Xuất Kho"}
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
                                    <TableRow>
                                        {selectedItem.type === 'Export' && <TableHead className="text-gray-800">Series</TableHead>}
                                        <TableHead className="text-gray-800">DOT</TableHead>
                                        <TableHead className="text-gray-800">Số lượng</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedItem.details.map((detail, index) => (
                                        <TableRow key={index}>
                                            {selectedItem.type === 'Export' && <TableCell>{detail.series}</TableCell>}
                                            <TableCell>{detail.dot}</TableCell>
                                            <TableCell>{detail.quantity}</TableCell>
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
