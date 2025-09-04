
"use client";

import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { ScanLine, ShieldCheck, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RecordItem, InventoryItemDetail } from "@/models/inventory";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchInput } from "@/components/search-input";
import { useDebounce } from "@/hooks/use-debounce";
import { NoteDetailRecord } from "@/models/note-detail";
import { cn } from "@/lib/utils";


const mapApiDetailToInventoryDetail = (apiDetail: NoteDetailRecord, type: "import" | "export" | "warranty"): InventoryItemDetail => {
    return {
        dot: apiDetail.fields.DOT || apiDetail.fields.dot,
        quantity: apiDetail.fields.quantity,
        scanned: apiDetail.fields.scanned || 0,
        series: apiDetail.fields.series,
        reason: apiDetail.fields.reason,
    };
};

const StatusCircle = ({ status }: { status: string }) => {
    const statusColor = {
      "Mới tạo": "bg-gray-400",
      "Đã scan đủ": "bg-green-500",
      "Chưa scan đủ": "bg-red-500",
    }[status];
  
    return <div className={cn("w-3 h-3 rounded-full mr-2 flex-shrink-0", statusColor || "bg-gray-400")} />;
};

function ListingComponent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const filterType = searchParams.get('type') as "import" | "export" | "warranty" | null;
    
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState<RecordItem | null>(null);
    const [selectedItemDetails, setSelectedItemDetails] = useState<InventoryItemDetail[]>([]);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const itemsPerPage = 10;
    const [loading, setLoading] = useState(true);
    const [inventoryItems, setInventoryItems] = useState<RecordItem[]>([]);
    
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
                setInventoryItems(data);
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
    
    const handleRowClick = async (item: RecordItem) => {
        if (!filterType) return;
        setSelectedItem(item);
        setSelectedItemDetails([]);
        setIsFetchingDetails(true);
        try {
            const response = await fetch(`/api/note-detail?type=${filterType}&noteId=${item.id}`);
            if(response.ok) {
                const detailsData: NoteDetailRecord[] = await response.json();
                const mappedDetails = detailsData.map(d => mapApiDetailToInventoryDetail(d, filterType));
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
    };

    const getFabLink = () => {
        switch(filterType) {
            case 'import': return '/import';
            case 'export': return '/export';
            case 'warranty': return '/warranty';
            default: return '/';
        }
    }
    
    const getBadgeStyling = (type: "import" | "export" | "warranty" | null) => {
        if (!type) return "bg-gray-500";
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

    const getFabStyling = () => {
        switch(filterType) {
            case 'import': return 'bg-blue-600 hover:bg-blue-700';
            case 'export': return 'bg-red-600 hover:bg-red-700';
            case 'warranty': return 'bg-yellow-500 hover:bg-yellow-600';
            default: return 'bg-gray-800 hover:bg-gray-900';
        }
    }

    const getQuantityForRecord = (item: RecordItem) => {
        if (filterType === 'warranty') {
            return item.fields.total_warranty_note || 0;
        }
        return item.fields.total_quantity || 0;
    }

  return (
    <div className="p-4 pb-20 animate-in fade-in-0 duration-500 flex flex-col">
      <Card className="bg-white rounded-xl shadow-lg overflow-hidden flex-grow flex flex-col">
        <div className="p-4 border-b">
            <SearchInput 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                placeholder="Tìm kiếm phiếu (tối thiểu 3 ký tự)..."
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
                    <TableRow className="bg-gray-800 hover:bg-gray-800 border-b-2 border-gray-700">
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">#</TableHead>
                        <TableHead className="sticky left-0 bg-gray-800 px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Tên phiếu</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Số lượng</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Ngày tạo</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {paginatedData.map((item, index) => (
                    <TableRow key={item.id} onClick={() => handleRowClick(item)} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 cursor-pointer transition duration-200 border-b border-gray-200 group">
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell className="sticky left-0 odd:bg-white even:bg-gray-50 group-hover:bg-gray-100 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        <div className="flex items-center">
                            <StatusCircle status={item.fields.status} />
                            <span>{item.fields.name}</span>
                        </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">
                         <Badge variant={"secondary"} className={`${getBadgeStyling(filterType)} text-white`}>
                            {item.fields.scanned || 0} / {getQuantityForRecord(item)}
                        </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                      {new Date(item.createdTime).toLocaleDateString('vi-VN')}
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
                    size="icon"
                    className="h-8 w-8 text-white bg-gray-800 rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-md"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <span className="text-sm font-medium text-white">
                  {currentPage} / {totalPages}
                </span>
                <Button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    size="icon"
                    className="h-8 w-8 text-white bg-gray-800 rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-md"
                >
                  <ChevronRight className="h-5 w-5" />
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
                    <DialogTitle className="text-2xl text-[#333]">Phiếu {selectedItem.fields.name}</DialogTitle>
                    <DialogDescription className="text-gray-600">
                        Thông tin chi tiết cho phiếu.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-4">
                    <div className="flex">
                        <span className="font-semibold w-1/2">Tên Phiếu:</span>
                        <span className="w-1/2">{selectedItem.fields.name}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="font-semibold w-1/2">Loại:</span>
                        <div className="w-1/2">
                            <Badge variant={"secondary"} className={`${getBadgeStyling(filterType)} text-white`}>
                               {getDialogTypeLabel(filterType)}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex">
                        <span className="font-semibold w-1/2">Trạng thái:</span>
                        <span className="w-1/2">{selectedItem.fields.status}</span>
                    </div>
                    <div className="flex">
                        <span className="font-semibold w-1/2">Ngày tạo:</span>
                        <span className="w-1/2">{new Date(selectedItem.createdTime).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex">
                        <span className="font-semibold w-1/2">Tổng số lượng:</span>
                        <span className="w-1/2">{selectedItem.fields.scanned || 0} / {getQuantityForRecord(item)}</span>
                    </div>
                    <div className="space-y-2 pt-2">
                        <h4 className="font-semibold text-gray-800">Chi tiết lốp:</h4>
                        <div className="overflow-y-auto rounded-lg border p-2 bg-gray-50/50 max-h-48">
                           <Table>
                                <TableHeader>
                                    <TableRow className="border-b-gray-300">
                                        <TableHead className="text-gray-800">#</TableHead>
                                        <TableHead className="text-gray-800">DOT</TableHead>
                                        {(filterType === 'export' || filterType === 'warranty') && <TableHead className="text-gray-800">Series</TableHead>}
                                        <TableHead className="text-gray-800">Đã scan</TableHead>
                                        <TableHead className="text-gray-800">Số lượng</TableHead>
                                        {filterType === 'warranty' && <TableHead className="text-gray-800">Lý do</TableHead>}
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
                                            <TableCell>{detail.dot}</TableCell>
                                            {(filterType === 'export' || filterType === 'warranty') && <TableCell>{detail.series || 'N/A'}</TableCell>}
                                            <TableCell>{detail.scanned}</TableCell>
                                            <TableCell>{detail.quantity}</TableCell>
                                            {filterType === 'warranty' && <TableCell>{detail.reason}</TableCell>}
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
                <DialogFooter>
                    {(selectedItem.fields.scanned || 0) < getQuantityForRecord(item) && (
                        <Button asChild className="w-full bg-gray-800 hover:bg-gray-900 text-white">
                            <Link href={`/scanning?noteId=${selectedItem.id}&type=${filterType}`}>
                                <ScanLine className="w-5 h-5 mr-2" />
                                Tiếp tục quét
                            </Link>
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function ListingPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ListingComponent />
        </Suspense>
    )
}
