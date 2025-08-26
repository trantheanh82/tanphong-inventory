
"use client";

import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { ScanLine, ShieldCheck, Search } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InventoryItem, RecordItem, InventoryItemDetail } from "@/models/inventory";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchInput } from "@/components/search-input";
import { useDebounce } from "@/hooks/use-debounce";


const mapRecordToInventoryItem = (record: RecordItem, type: "Import" | "Export" | "Warranty"): InventoryItem => {
    let details: InventoryItemDetail[] = [];
    let quantity = 0;

    switch(type) {
        case "Import":
            quantity = record.fields.total_quantity || 0;
            // Assuming import_detail might contain more info if needed later
            break;
        case "Export":
            quantity = record.fields.total_quantity || 0;
            // Assuming export_note_detail might contain more info if needed later
            break;
        case "Warranty":
            quantity = record.fields.total_quarantine_note || 0;
            // Assuming quarantine_note_detail might contain more info if needed later
            break;
    }

    return {
        id: record.id,
        type: type,
        name: record.fields.name,
        quantity: quantity,
        date: record.createdTime,
        details: details, // Details are not fully mapped here as the dialog needs a separate fetch
    };
};


export default function ListingPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const filterType = searchParams.get('type') as "import" | "export" | "warranty" | null;
    
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const itemsPerPage = 10;
    const [loading, setLoading] = useState(true);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    
    const fetchData = useCallback(async (type: string | null, search: string) => {
        if (!type) return;

        if (search && search.length > 0 && search.length < 3) {
            setInventoryItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const url = search ? `/api/listing?type=${type}&search=${search}` : `/api/listing?type=${type}`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                const mappedData = data.map((record: RecordItem) => 
                    mapRecordToInventoryItem(
                        record, 
                        type.charAt(0).toUpperCase() + type.slice(1) as "Import" | "Export" | "Warranty"
                    )
                );
                setInventoryItems(mappedData);
            }
        } catch (error) {
            console.error("Failed to fetch listing data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(filterType, debouncedSearchQuery);
    }, [filterType, debouncedSearchQuery, fetchData]);


    const filteredData = useMemo(() => {
        return inventoryItems;
    }, [inventoryItems]);

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

    const getFabStyling = () => {
        switch(filterType) {
            case 'import': return 'bg-blue-600 hover:bg-blue-700';
            case 'export': return 'bg-red-600 hover:bg-red-700';
            case 'warranty': return 'bg-yellow-500 hover:bg-yellow-600';
            default: return 'bg-gray-800 hover:bg-gray-900';
        }
    }

    const getSearchModel = (): 'import_model' | 'export_model' | 'quarantine_model' => {
      switch(filterType) {
          case 'import': return 'import_model';
          case 'export': return 'export_model';
          case 'warranty': return 'quarantine_model';
          default: return 'import_model'; // Default case
      }
    }

  return (
    <div className="p-4 pb-20 animate-in fade-in-0 duration-500 flex flex-col">
      <Card className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-white/50 flex-grow flex flex-col">
        <div className="p-4 border-b border-white/50">
            <SearchInput 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                placeholder="Tìm kiếm phiếu (tối thiểu 3 ký tự)..."
                model={getSearchModel()}
            />
        </div>
        <div>
            {loading ? (
                 <div className="p-6 space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : (
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
            )}
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
        {!loading && (
        <span className="text-sm font-medium text-white">
            Tổng cộng: {filteredData.length}
        </span>
        )}
      </div>

      {filterType && (
        <Button asChild className={`fixed bottom-20 right-4 h-16 w-16 rounded-full text-white shadow-lg z-20 ${getFabStyling()}`}>
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
                        <div className="overflow-y-auto rounded-lg border p-2 bg-gray-50/50 max-h-48">
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
                                    {selectedItem.details.length > 0 ? selectedItem.details.map((detail, index) => (
                                        <TableRow key={index} className="border-none">
                                            {(selectedItem.type === 'Export' || selectedItem.type === 'Warranty') && <TableCell>{detail.series}</TableCell>}
                                            <TableCell>{detail.dot}</TableCell>
                                            <TableCell>{detail.quantity}</TableCell>
                                            {selectedItem.type === 'Warranty' && <TableCell>{detail.reason}</TableCell>}
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={selectedItem.type === 'Import' ? 2 : 3} className="text-center text-gray-500">
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

