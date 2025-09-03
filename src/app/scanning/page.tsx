'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Camera, CheckCircle, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useScanningStore, ScanItem } from '@/store/scanning-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';


export default function ScanningPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);


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

  // Reset store on component unmount
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  // Fetch note details
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
  
  // Get camera permission
  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };

    getCameraPermission();
    
    return () => {
        // Stop camera stream on cleanup
        if(videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, []);

  const handleScan = async () => {
    if (!videoRef.current || !canvasRef.current || isSubmitting) return;

    setIsSubmitting(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
        toast({ variant: 'destructive', title: "Lỗi", description: "Không thể xử lý hình ảnh." });
        setIsSubmitting(false);
        return;
    }
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUri = canvas.toDataURL('image/jpeg', 0.9);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, noteType, imageDataUri }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast({ variant: 'destructive', title: "Lỗi", description: result.message || "Quét thất bại" });
        return;
      }

      if (result.success) {
         if (result.warning) {
            toast({
                title: "Cảnh báo",
                description: result.message,
                className: "bg-yellow-100 border-yellow-500 text-yellow-800"
            });
         } else {
            toast({
                title: "Thành công",
                description: result.message,
            });
         }
        
        incrementScanCount(result.dot);

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
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <header className="bg-gray-800 text-white p-4 flex items-center shadow-md sticky top-0 z-20">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="mr-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">Quét DOT</h1>
      </header>
      
      <canvas ref={canvasRef} className="hidden"></canvas>
      
      <main className="flex-grow p-4 overflow-y-auto flex flex-col gap-4">
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center text-white/50">
             <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
             <div className="absolute inset-0 bg-black/40"></div>
             {/* Scanning box overlay */}
             <div className="absolute w-[80%] h-[30%] border-4 border-dashed border-white/50 rounded-lg animate-pulse"></div>

             {hasCameraPermission === false && (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <Alert variant="destructive">
                      <AlertTitle>Camera Access Denied</AlertTitle>
                      <AlertDescription>
                        Please enable camera permissions in your browser settings to use this app.
                      </AlertDescription>
                    </Alert>
                </div>
            )}
            {hasCameraPermission === null && (
                 <div className="absolute inset-0 flex items-center justify-center">
                    <LoaderCircle className="w-12 h-12 text-white animate-spin" />
                 </div>
            )}
        </div>

        <Card className="bg-white/10 backdrop-blur-sm shadow-lg rounded-xl border border-white/20">
          <CardHeader>
            <CardTitle className="flex justify-between items-center text-lg text-white">
              <span>Cần Ghi Nhận ({items.length} loại)</span>
              <div className="text-right">
                <div className="font-semibold text-sm text-gray-300">{getTotalProgress().totalScanned} / {getTotalProgress().totalQuantity}</div>
                <Progress value={(getTotalProgress().totalScanned / getTotalProgress().totalQuantity) * 100 || 0} className="w-24 h-2 mt-1 bg-gray-700" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[30vh] overflow-y-auto">
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className={cn(
                    "p-3 rounded-lg border",
                    item.scanned === item.quantity ? "bg-green-500/10 border-green-500/30" : "bg-gray-700/20 border-gray-600/50"
                    )}>
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-white">{`DOT: ${item.dot}`}</p>
                    <div className="flex items-center gap-2">
                       <span className={cn(
                           "font-bold text-lg",
                           item.scanned === item.quantity ? 'text-green-400' : 'text-yellow-400'
                        )}>
                        {item.scanned}/{item.quantity}
                       </span>
                       {item.scanned === item.quantity && <CheckCircle className="w-5 h-5 text-green-400" />}
                    </div>
                  </div>
                  <Progress value={(item.scanned / item.quantity) * 100} className="h-1.5 mt-2 bg-gray-700" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="p-4 sticky bottom-0 z-20">
        <Button
          onClick={handleScan}
          disabled={isSubmitting || hasCameraPermission !== true}
          className="w-full h-16 bg-blue-600 text-white rounded-xl text-xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 disabled:bg-gray-500"
        >
          {isSubmitting ? (
            <LoaderCircle className="w-8 h-8 animate-spin" />
          ) : (
            <>
              <Camera className="w-8 h-8" />
              <span>Capture DOT</span>
            </>
          )}
        </Button>
      </footer>
    </div>
  );
}
