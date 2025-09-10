
'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Camera, CheckCircle, LoaderCircle, Scan, Zap, ZapOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useScanningStore, ScanItem } from '@/store/scanning-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';


function ScanningComponent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);


  const noteId = searchParams.get('noteId');
  const noteType = searchParams.get('type');

  const {
    items,
    setItems,
    incrementScanCount,
    addSeriesToItem,
    checkAllScanned,
    activeSeriesScan,
    setActiveSeriesScan,
    reset,
    getTotalProgress,
  } = useScanningStore();

  // Reset store on component unmount
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);
  
  const applyFlash = async (track: MediaStreamTrack, turnOn: boolean) => {
    try {
      if (track.getCapabilities().torch) {
        await track.applyConstraints({
          advanced: [{ torch: turnOn }],
        });
      }
    } catch (error) {
      console.error('Error applying flash constraints:', error);
    }
  };

  const toggleFlash = () => {
    if (trackRef.current) {
        setIsFlashOn(prev => {
            const newState = !prev;
            applyFlash(trackRef.current!, newState);
            return newState;
        });
    }
  };

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
          tire_type: item.fields.tire_type
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
    let stream: MediaStream | null = null;
    
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        trackRef.current = stream.getVideoTracks()[0];
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };

    getCameraPermission();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => {
          if (track.getCapabilities().torch) {
            track.applyConstraints({ advanced: [{ torch: false }]});
          }
          track.stop();
        });
      }
    }
  }, []);

  // Apply flash when permission is granted
  useEffect(() => {
      if(hasCameraPermission && trackRef.current){
        applyFlash(trackRef.current, isFlashOn)
      }
  }, [hasCameraPermission, isFlashOn])

  const captureImage = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return null;

    // Dimensions of the video feed
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    // Determine the overlay dimensions based on scanning mode
    const isSeriesScan = !!activeSeriesScan;
    const overlayWidthPercent = 0.95; 
    const overlayHeightPercent = isSeriesScan ? 0.30 : 0.50;

    // Calculate the dimensions of the crop area in pixels
    const cropWidth = videoWidth * overlayWidthPercent;
    const cropHeight = videoHeight * overlayHeightPercent;

    // Calculate the top-left corner of the crop area to center it
    const cropX = (videoWidth - cropWidth) / 2;
    const cropY = (videoHeight - cropHeight) / 2;
    
    // Set canvas size to the size of the cropped area
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // Draw the cropped portion of the video onto the canvas
    context.drawImage(
        video,
        cropX,       // The x-coordinate where to start clipping from the video
        cropY,       // The y-coordinate where to start clipping from the video
        cropWidth,   // The width of the clipped image
        cropHeight,  // The height of the clipped image
        0,           // The x-coordinate where to place the image on the canvas
        0,           // The y-coordinate where to place the image on the canvas
        cropWidth,   // The width of the image to use (stretch or reduce the image)
        cropHeight   // The height of the image to use
    );

    // Return the cropped image as a data URI with reduced quality
    return canvas.toDataURL('image/jpeg', 0.8);
}

  const handleSeriesScan = async (imageDataUri: string) => {
      if (!activeSeriesScan) return;
      
      try {
          const response = await fetch('/api/scan-series', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ noteId, dot: activeSeriesScan, imageDataUri }),
          });
          const result = await response.json();

          if (!response.ok) throw new Error(result.message || "Quét series thất bại");

          if (result.success) {
              toast({ title: "Thành công", description: result.message });
              incrementScanCount(result.dot);
              addSeriesToItem(result.dot, result.series);
              setActiveSeriesScan(null); // Go back to DOT scanning mode
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
      }
  }

  const handleDotScan = async (imageDataUri: string) => {
      try {
          const response = await fetch('/api/scan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ noteId, noteType, imageDataUri }),
          });

          const result = await response.json();
          if (!response.ok) throw new Error(result.message || "Quét thất bại");

          if (result.success) {
              if (result.seriesScanRequired) {
                  setActiveSeriesScan(result.dot);
                  toast({ title: "Bước tiếp theo", description: result.message });
              } else {
                  if (result.warning) {
                      toast({ title: "Cảnh báo", description: result.message, className: "bg-yellow-100 border-yellow-500 text-yellow-800" });
                  } else {
                      toast({ title: "Thành công", description: result.message });
                  }
                  incrementScanCount(result.dot);
                  if (checkAllScanned()) {
                      toast({ title: "Hoàn tất", description: "Bạn đã quét đủ số lượng cho tất cả các mục.", className: "bg-green-500 text-white" });
                      setTimeout(() => router.push(`/listing?type=${noteType}`), 1000);
                  }
              }
          } else {
              toast({ variant: 'destructive', title: "Thất bại", description: result.message });
          }
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Lỗi hệ thống', description: error.message });
      }
  }

  const handleScan = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    const imageDataUri = captureImage();
    if (!imageDataUri) {
        toast({ variant: 'destructive', title: "Lỗi", description: "Không thể xử lý hình ảnh." });
        setIsSubmitting(false);
        return;
    }
    
    if (activeSeriesScan) {
        await handleSeriesScan(imageDataUri);
    } else {
        await handleDotScan(imageDataUri);
    }

    setIsSubmitting(false);
  };

  const getPageTitle = () => {
      if (activeSeriesScan) return `Quét Series cho DOT ${activeSeriesScan}`;
      if (noteType === 'import') return 'Quét DOT Nhập Kho';
      if (noteType === 'export') return 'Quét DOT Xuất Kho';
      return 'Quét Mã';
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <header className="bg-gray-800 text-white p-4 flex items-center justify-between shadow-md sticky top-0 z-20">
        <Button onClick={() => activeSeriesScan ? setActiveSeriesScan(null) : router.back()} variant="ghost" size="icon" className="mr-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">{getPageTitle()}</h1>
        <Button onClick={toggleFlash} variant="ghost" size="icon" className="ml-2">
          {isFlashOn ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
        </Button>
      </header>
      
      <canvas ref={canvasRef} className="hidden"></canvas>
      
      <main className="flex-grow overflow-y-auto flex flex-col">
        <div className="relative flex-grow w-full bg-black flex items-center justify-center text-white/50">
             <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
             <div className="absolute inset-0 bg-black/40"></div>
             {/* Scanning box overlay */}
             <div className={cn(
                "absolute border-4 border-dashed border-white/50 rounded-lg animate-pulse",
                activeSeriesScan ? "w-[95%] h-[30%]" : "w-[95%] h-[50%]"
             )}></div>

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

        <div className='p-4'>
            <Card className="bg-white/10 backdrop-blur-sm shadow-lg rounded-xl border border-white/20">
            <CardHeader className="p-3">
                <CardTitle className="flex justify-between items-center text-xs text-white">
                <span>Cần Ghi Nhận ({items.length} loại)</span>
                <div className="text-right">
                    <div className="font-semibold text-xs text-gray-300">{getTotalProgress().totalScanned} / {getTotalProgress().totalQuantity}</div>
                    <Progress value={(getTotalProgress().totalScanned / getTotalProgress().totalQuantity) * 100 || 0} className="w-20 h-1.5 mt-1 bg-gray-700" />
                </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[20vh] overflow-y-auto px-3 pb-3">
                <div className="space-y-2">
                {items.map(item => (
                    <div key={item.id} className={cn(
                        "p-2 rounded-lg border transition-all",
                        item.scanned === item.quantity ? "bg-green-500/10 border-green-500/30" : "bg-gray-700/20 border-gray-600/50",
                        activeSeriesScan === item.dot && "ring-2 ring-blue-500"
                        )}>
                        <div className="flex justify-between items-center">
                            <p className="font-semibold text-xs text-white">{`DOT: ${item.dot}`}</p>
                            <div className="flex items-center gap-2">
                            <span className={cn(
                                "font-bold text-sm",
                                item.scanned === item.quantity ? 'text-green-400' : 'text-yellow-400'
                                )}>
                                {item.scanned}/{item.quantity}
                            </span>
                            {item.scanned === item.quantity && <CheckCircle className="w-3 h-3 text-green-400" />}
                            </div>
                        </div>
                        <Progress value={(item.scanned / item.quantity) * 100} className="h-1 mt-1.5 bg-gray-700" />
                         {item.series && <p className="text-xs text-gray-400 mt-1 truncate">Series: {item.series || '-'}</p>}
                    </div>
                ))}
                </div>
            </CardContent>
            </Card>
        </div>

      </main>

      <footer className="p-4 flex justify-center sticky bottom-0 z-20">
        <Button
          onClick={handleScan}
          disabled={isSubmitting || hasCameraPermission !== true}
          className="h-20 w-20 bg-blue-600 text-white rounded-full text-xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 disabled:bg-gray-500 shadow-lg"
        >
          {isSubmitting ? (
            <LoaderCircle className="w-10 h-10 animate-spin" />
          ) : (
            activeSeriesScan ? <Scan className="w-10 h-10" /> : <Camera className="w-10 h-10" />
          )}
        </Button>
      </footer>
    </div>
  );
}

export default function ScanningPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ScanningComponent />
        </Suspense>
    )
}
