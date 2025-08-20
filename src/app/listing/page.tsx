
"use client";

import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { ScanLine } from "lucide-react";
import Link from "next/link";

const inventoryItems = Array.from({ length: 40 }, (_, i) => {
    const isImport = Math.random() > 0.5;
    const date = new Date(2023, 9, 26 - i).toISOString().split('T')[0];
    return { 
        id: `${isImport ? 'PNK' : 'PXK'}-${String(i + 1).padStart(3, '0')}`,
        type: isImport ? "Import" : "Export", 
        name: isImport ? `Lốp Michelin 205/55R16` : `Lốp Bridgestone 185/65R15`,
        quantity: isImport ? 50 : -20,
        date: date
    }
});


export default function ListingPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const filterType = searchParams.get('type');
    
    const [currentPage, setCurrentPage] = useState(1);
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
    
    const fabLink = filterType === 'import' ? '/import' : '/export';

  return (
    <div className="p-4 animate-fade-in h-full flex flex-col">
      <Card className="flex-grow bg-white/50 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-white/50">
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
                <TableRow key={item.id} className="hover:bg-gray-200/50 cursor-pointer transition duration-200">
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
      
      <div className="flex justify-center items-center mt-4 space-x-2">
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

      {filterType && (
        <Button asChild className="fixed bottom-20 right-4 h-16 w-16 rounded-full bg-gray-800 hover:bg-gray-900 text-white shadow-lg z-20">
          <Link href={fabLink}>
            <ScanLine className="h-8 w-8" />
          </Link>
        </Button>
      )}
    </div>
  );
}
