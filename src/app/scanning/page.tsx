
"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Zap, ZapOff, XCircle, CheckCircle, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useScanningStore, ScanItem } from '@/store/scanning-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function ScanningPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(true);
  const [isFlashSupported, setIsFlashSupported] = useState(false);
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


  const applyFlashConstraint = useCallback(async (track: MediaStreamTrack, enabled: boolean) => {
    try {
      await track.applyConstraints({ advanced: [{ torch: enabled }] });
      setIsFlashOn(enabled);
    } catch (error) {
      console.error('Error applying flash constraints:', error);
    }
  }, []);
  
  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);

        if (videoRef.current) videoRef.current.srcObject = stream;
        const track = stream.getVideoTracks()[0];
        if (track) {
            videoTrackRef.current = track;
            const capabilities = track.getCapabilities();
            if (capabilities.torch) {
                setIsFlashSupported(true);
                await applyFlashConstraint(track, true);
            }
        }
      } catch (error) {
        setHasCameraPermission(false);
      }
    };

    getCameraPermission();

    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
    }
  }, [applyFlashConstraint]);

  const toggleFlash = () => {
    if (videoTrackRef.current && isFlashSupported) {
        applyFlashConstraint(videoTrackRef.current, !isFlashOn);
    }
  };

  const handleScan = async () => {
    if (isSubmitting || !videoRef.current || !canvasRef.current) {
        return;
    };
    setIsSubmitting(true);
    
    // --- Image Cropping Logic ---
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) {
        setIsSubmitting(false);
        return;
    };

    // Dimensions of the video stream
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Dimensions of the video element on the page
    const viewWidth = video.clientWidth;
    const viewHeight = video.clientHeight;

    // Scanning area dimensions relative to the view
    const scanBoxWidth = viewWidth * 0.85; 
    const scanBoxHeight = viewHeight * 0.25;

    // Position of the scanning area relative to the view
    const scanBoxX = (viewWidth - scanBoxWidth) / 2;
    const scanBoxY = viewHeight * 0.35; // 35% from top

    // Calculate the source rect in the native video resolution
    const sx = (scanBoxX / viewWidth) * videoWidth;
    const sy = (scanBoxY / viewHeight) * videoHeight;
    const sWidth = (scanBoxWidth / viewWidth) * videoWidth;
    const sHeight = (scanBoxHeight / viewHeight) * videoHeight;
    
    // Set canvas size to match the cropped area
    canvas.width = sWidth;
    canvas.height = sHeight;

    // Draw the cropped portion of the video onto the canvas
    context.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
    
    const imageDataUri = canvas.toDataURL('image/jpeg', 0.9);
    // --- End of Image Cropping Logic ---

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, noteType, imageDataUri }),
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
        toast({ variant: 'destructive', title: "Lỗi", description: result.message });
      }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Lỗi hệ thống', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black">
      <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
      <canvas ref={canvasRef} className="hidden"></canvas>
      
      {hasCameraPermission === false && (
        <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/80">
            <Alert variant="destructive" className="max-w-sm">
                <AlertTitle>Yêu cầu truy cập Camera</AlertTitle>
                <AlertDescription>
                    Vui lòng cho phép truy cập camera để sử dụng tính năng này.
                </AlertDescription>
            </Alert>
        </div>
      )}

      <div className="absolute inset-0 flex flex-col justify-between" style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.8) 100%)'}}>
        <div className="flex justify-between items-center p-4">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="text-white bg-black/50 hover:bg-black/75 rounded-full h-10 w-10">
                <ArrowLeft className="w-6 h-6" />
            </Button>
            {isFlashSupported && (
                <Button onClick={toggleFlash} variant="ghost" size="icon" className="text-white bg-black/50 hover:bg-black/75 rounded-full h-10 w-10">
                    {isFlashOn ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
                </Button>
            )}
        </div>
        
        <div className="absolute left-1/2 -translate-x-1/2 w-[85%] h-[25%]" style={{top: '35%', transform: 'translateX(-50%) translateY(-50%)'}}>
          <div className="w-full h-full border-4 border-white/80 rounded-2xl shadow-lg pointer-events-none flex items-center justify-center">
             <div className="w-full h-[2px] bg-red-500 animate-pulse" />
          </div>
        </div>


        <div className="flex-grow flex flex-col justify-end p-4 space-y-4">
          <Card className="bg-black/70 backdrop-blur-sm border-white/30 text-white max-h-[35vh] overflow-hidden flex flex-col">
            <CardHeader className="p-3">
              <CardTitle className="flex justify-between items-center text-base">
                <span>Cần Scan ({items.length} loại)</span>
                <div className="text-right">
                  <div className="font-semibold text-sm">{getTotalProgress().totalScanned} / {getTotalProgress().totalQuantity}</div>
                  <Progress value={(getTotalProgress().totalScanned / getTotalProgress().totalQuantity) * 100 || 0} className="w-20 h-1.5 mt-1 bg-white/30" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 overflow-y-auto">
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="p-2 bg-white/10 rounded-md">
                    <div className="flex justify-between items-center text-sm">
                       <p className="font-medium">{noteType === 'import' ? `DOT: ${item.dot}` : `Series: ${item.series}`}</p>
                       <div className="flex items-center gap-2">
                           <span className={`font-semibold ${item.scanned === item.quantity ? 'text-green-400' : 'text-yellow-400'}`}>
                            {item.scanned}/{item.quantity}
                           </span>
                           {item.scanned === item.quantity && <CheckCircle className="w-4 h-4 text-green-400" />}
                       </div>
                    </div>
                    <Progress value={(item.scanned / item.quantity) * 100} className="h-1 mt-1 bg-white/30" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <div className="flex items-center justify-center gap-4 py-2">
              <div className="w-14 h-14" />

              <Button
                onClick={handleScan}
                disabled={isSubmitting}
                className="h-20 w-20 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-2xl flex items-center justify-center transition-transform transform active:scale-95 disabled:opacity-50"
              >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
                  ) : (
                    <Camera className="w-10 h-10" />
                  )}
              </Button>

               <div className="w-14 h-14" />
          </div>
        </div>
      </div>
    </div>
  );
}
