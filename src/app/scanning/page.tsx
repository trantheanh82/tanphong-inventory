
"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Zap, ZapOff, ScanSearch, XCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useScanningStore, ScanItem } from '@/store/scanning-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function ScanningPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
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
          id: item.fields.dot || item.fields.series,
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

  const handleScan = async (valueToScan: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, noteType, value: valueToScan }),
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
          description: `Đã ghi nhận DOT ${result.dot} (${result.scanned}/${result.total})`,
        });

        if (checkAllScanned()) {
            toast({
                title: "Hoàn tất",
                description: "Bạn đã quét đủ số lượng cho tất cả các mục.",
                className: "bg-green-500 text-white"
            });
            router.push(`/listing?type=${noteType}`);
        }
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

      <div className="absolute inset-0 flex flex-col justify-between" style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.8) 100%)'}}>
        <div className="flex justify-between p-4">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="text-white bg-black/50 hover:bg-black/75 rounded-full">
                <ArrowLeft className="w-6 h-6" />
            </Button>
            {isFlashSupported && (
                <Button onClick={toggleFlash} variant="ghost" size="icon" className="text-white bg-black/50 hover:bg-black/75 rounded-full">
                    {isFlashOn ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
                </Button>
            )}
        </div>

        <div className="flex-grow flex flex-col justify-end p-4 space-y-4">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-lg h-[25%] border-4 border-white/80 rounded-2xl shadow-lg pointer-events-none flex items-center justify-center">
             <div className="w-full h-[2px] bg-red-500 animate-pulse" />
          </div>
          
          <Card className="bg-black/70 backdrop-blur-sm border-white/30 text-white max-h-[45vh] overflow-hidden flex flex-col">
            <CardHeader className="p-4">
              <CardTitle className="flex justify-between items-center text-lg">
                <span>Cần Scan ({items.length} loại)</span>
                <div className="text-right">
                  <div className="font-bold">{getTotalProgress().totalScanned} / {getTotalProgress().totalQuantity}</div>
                  <Progress value={(getTotalProgress().totalScanned / getTotalProgress().totalQuantity) * 100} className="w-24 h-2 mt-1 bg-white/30" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 overflow-y-auto">
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="p-3 bg-white/10 rounded-lg">
                    <div className="flex justify-between items-center">
                       <p className="font-semibold">{noteType === 'import' ? `DOT: ${item.dot}` : `Series: ${item.series}`}</p>
                       <div className="flex items-center gap-2">
                           <span className={`font-bold ${item.scanned === item.quantity ? 'text-green-400' : 'text-yellow-400'}`}>
                            {item.scanned} / {item.quantity}
                           </span>
                           {item.scanned === item.quantity && <CheckCircle className="w-5 h-5 text-green-400" />}
                       </div>
                    </div>
                    <Progress value={(item.scanned / item.quantity) * 100} className="h-1.5 mt-1 bg-white/30" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Mock Scan Buttons */}
          <div className="grid grid-cols-2 gap-4">
              {items.length > 0 && items.find(i => i.scanned < i.quantity) && (
                <Button onClick={() => handleScan(items.find(i => i.scanned < i.quantity)!.dot!)} className="bg-green-600 hover:bg-green-700 text-white h-14 text-base">
                  Scan DOT ({items.find(i => i.scanned < i.quantity)!.dot})
                </Button>
              )}
              <Button onClick={() => handleScan('0000')} className="bg-red-600 hover:bg-red-700 text-white h-14 text-base">
                Scan Sai DOT
              </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
