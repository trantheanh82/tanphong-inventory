
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useScanningStore, ScanItem } from '@/store/scanning-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';

export default function ScanningPage() {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const noteId = searchParams.get('noteId');
  const noteType = searchParams.get('type');

  const {
    items,
    setItems,
    incrementScanCount,
    checkAllScanned,
    reset,
    getTotalProgress,
  } = useScanningStore();

  useEffect(() => {
    // Reset store on component unmount
    return () => {
      reset();
    };
  }, [reset]);
  
  useEffect(() => {
    if (!noteId || !noteType) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không tìm thấy thông tin phiếu. Vui lòng thử lại.',
      });
      router.back();
      return;
    }

    const fetchNoteDetails = async () => {
      try {
        const response = await fetch(`/api/note-detail?type=${noteType}&noteId=${noteId}`);
        if (!response.ok) throw new Error('Failed to fetch note details');
        const data = await response.json();
        
        const scanItems: ScanItem[] = data.map((item: any) => ({
          id: item.fields.dot || item.fields.series || item.id,
          dot: item.fields.dot,
          series: item.fields.series,
          quantity: item.fields.quantity,
          scanned: item.fields.scanned || 0,
        }));
        setItems(scanItems);
      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể tải chi tiết phiếu.' });
      }
    };
    
    fetchNoteDetails();
  }, [noteId, noteType, router, toast, setItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/manual-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, noteType, valueToScan: inputValue }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast({ variant: 'destructive', title: "Lỗi", description: result.message });
        return;
      }
      
      if (result.success) {
        incrementScanCount(result.dot);
        toast({
          title: "Thành công",
          description: result.message,
        });

        if (checkAllScanned()) {
            toast({
                title: "Hoàn tất",
                description: "Bạn đã quét đủ số lượng cho tất cả các mục.",
                className: "bg-green-500 text-white"
            });
            setTimeout(() => router.push(`/listing?type=${noteType}`), 1000);
        }
      } else {
        toast({ variant: 'destructive', title: "Thất bại", description: result.message });
      }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Lỗi hệ thống', description: error.message });
    } finally {
        setIsSubmitting(false);
        setInputValue('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <header className="bg-gray-800 text-white p-4 flex items-center shadow-md">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="mr-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">Ghi nhận DOT</h1>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        <Card className="bg-white shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex justify-between items-center text-lg text-gray-800">
              <span>Cần Ghi Nhận ({items.length} loại)</span>
              <div className="text-right">
                <div className="font-semibold text-sm text-gray-700">{getTotalProgress().totalScanned} / {getTotalProgress().totalQuantity}</div>
                <Progress value={(getTotalProgress().totalScanned / getTotalProgress().totalQuantity) * 100 || 0} className="w-24 h-2 mt-1 bg-gray-200" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[55vh] overflow-y-auto">
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-gray-800">{`DOT: ${item.dot}`}</p>
                    <div className="flex items-center gap-2">
                       <span className={`font-bold text-lg ${item.scanned === item.quantity ? 'text-green-600' : 'text-yellow-600'}`}>
                        {item.scanned}/{item.quantity}
                       </span>
                       {item.scanned === item.quantity && <CheckCircle className="w-5 h-5 text-green-600" />}
                    </div>
                  </div>
                  <Progress value={(item.scanned / item.quantity) * 100} className="h-1.5 mt-2 bg-gray-200" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-white p-4 border-t border-gray-200 shadow-t-lg">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Nhập 4 chữ số DOT..."
            className="flex-grow bg-gray-100 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800"
            pattern="\d{4}"
            maxLength={4}
            required
          />
          <Button
            type="submit"
            disabled={isSubmitting || !inputValue}
            size="icon"
            className="h-10 w-10 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:bg-gray-400"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </footer>
    </div>
  );
}
