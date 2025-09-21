'use client';

import { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Camera, CheckCircle, LoaderCircle, Scan, Zap, ZapOff, Send, ScanText, Combine, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useScanningStore, ScanItem } from '@/store/scanning-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { recognizeTireInfo } from '@/ai/flows/export-scan-flow';

type ActiveScanMode = 'dot' | 'series' | 'both' | 'none';

interface ScanResultData {
  success: boolean;
  message: string;
  dot?: string;
  fullDotNumber?: string;
  series?: string;
  scanned?: number;
  total?: number;
  isCompleted?: boolean;
  warning?: boolean;
}

function ScanningComponent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(true);
  const [manualInputValue, setManualInputValue] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);

  // State for the new "Both" scan flow
  const [activeScanMode, setActiveScanMode] = useState<ActiveScanMode>('none');
  const [scannedDotForBoth, setScannedDotForBoth] = useState<string | null>(null);
  const [scannedSeriesForBoth, setScannedSeriesForBoth] = useState<string | null>(null);

  const noteId = searchParams.get('noteId');
  const noteType = searchParams.get('type') as 'import' | 'export' | 'warranty';

  const {
    items,
    setItems,
    getTotalProgress,
    reset,
    updateItemWithScan,
  } = useScanningStore();

  useEffect(() => {
    return () => {
      reset();
      if (trackRef.current && trackRef.current.getCapabilities().torch) {
        trackRef.current.applyConstraints({ advanced: [{ torch: false }] });
      }
    };
  }, [reset]);
  
  const applyFlash = useCallback(async (track: MediaStreamTrack, turnOn: boolean) => {
    try {
      if (track.getCapabilities().torch) {
        await track.applyConstraints({
          advanced: [{ torch: turnOn }],
        });
      }
    } catch (error) {
      console.error('Error applying flash constraints:', error);
    }
  }, []);

  const toggleFlash = () => {
    if (trackRef.current) {
        setIsFlashOn(prev => {
            const newState = !prev;
            applyFlash(trackRef.current!, newState);
            return newState;
        });
    }
  };

  const fetchNoteDetails = useCallback(async () => {
    if (!noteId || !noteType) return;
    try {
      const response = await fetch(`/api/note-detail?type=${noteType}&noteId=${noteId}`);
      if (!response.ok) throw new Error('Failed to fetch note details');
      const data = await response.json();
      const scanItems: ScanItem[] = data.map((item: any) => ({
        id: item.id, dot: item.fields.dot, series: item.fields.series,
        quantity: item.fields.quantity || 1, scanned: item.fields.scanned || 0,
        tire_type: item.fields.tire_type
      }));
      setItems(scanItems);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể tải chi tiết phiếu.' });
    }
  }, [noteId, noteType, setItems, toast]);


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
    if (noteType === 'export') {
      setActiveScanMode('none');
    } else if (noteType === 'import') {
      setActiveScanMode('dot');
    } else if (noteType === 'warranty') {
      setActiveScanMode('series');
    }
    fetchNoteDetails();
  }, [noteId, noteType, router, toast, fetchNoteDetails]);
  
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
        const track = stream.getVideoTracks()[0];
        trackRef.current = track;
        if (track.getCapabilities().torch) {
            await track.applyConstraints({ advanced: [{ torch: isFlashOn }] });
        }
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
  }, [isFlashOn]);

  const captureImage = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return null;

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    const isSeriesScan = noteType === 'warranty' || activeScanMode === 'series' || activeScanMode === 'both';
    const overlayWidthPercent = 0.95; 
    const overlayHeightPercent = isSeriesScan ? 0.40 : 0.50;

    const cropWidth = videoWidth * overlayWidthPercent;
    const cropHeight = videoHeight * overlayHeightPercent;

    const cropX = (videoWidth - cropWidth) / 2;
    const cropY = (videoHeight - cropHeight) / 2;
    
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    context.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    return canvas.toDataURL('image/jpeg', 0.8);
  }

  const handleScanResponse = async (result: ScanResultData) => {
    if (result.success) {
        toast({
            title: result.warning ? 'Quét thành công (Đã đủ)' : 'Quét thành công',
            description: result.message,
            className: result.warning ? "bg-yellow-100 border-yellow-500 text-yellow-800" : "bg-green-100 border-green-500 text-green-800"
        });

        await fetchNoteDetails();

        const latestItems = useScanningStore.getState().items;
        const allScanned = latestItems.every(item => (item.scanned || 0) >= item.quantity);

        if (allScanned) {
            toast({ title: "Hoàn tất", description: "Bạn đã quét đủ số lượng cho tất cả các mục.", className: "bg-green-500 text-white" });
            setTimeout(() => router.push(`/listing?type=${noteType}`), 2000);
        }

    } else {
        toast({ variant: 'destructive', title: "Thất bại", description: result.message });
    }
  }

  const handleCapture = async () => {
    if (isSubmitting || hasCameraPermission !== true) return;
    setIsSubmitting(true);
    
    const imageDataUri = captureImage();
    if (!imageDataUri) {
        toast({ variant: 'destructive', title: "Lỗi", description: "Không thể xử lý hình ảnh." });
        setIsSubmitting(false);
        return;
    }

    if (activeScanMode === 'both') {
      await handleBothModeScan(imageDataUri);
    } else {
      await handleSimpleScan(activeScanMode, imageDataUri);
    }

    setIsSubmitting(false);
  };
  
  const handleSimpleScan = async (scanMode: ActiveScanMode, imageDataUri: string) => {
    if (scanMode === 'none') return;
    
    let endpoint = '/api/scan';
    let body: any = { noteId, noteType, imageDataUri };

    if (noteType === 'export') {
      endpoint = '/api/export-scan';
      body = { noteId, imageDataUri, scanMode };
    } else if (noteType === 'warranty') {
      await handleWarrantyScan({ imageDataUri });
      return;
    }
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      await handleScanResponse(result);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Lỗi hệ thống', description: error.message });
    }
  };

  const handleBothModeScan = async (imageDataUri: string) => {
    try {
      if (scannedDotForBoth && scannedSeriesForBoth) {
        return; // Already submitted, wait for reset
      }

      const recognizedInfo = await recognizeTireInfo(imageDataUri);

      let newDot = scannedDotForBoth;
      let newSeries = scannedSeriesForBoth;

      if (recognizedInfo?.dotNumber && !newDot) {
        newDot = recognizedInfo.dotNumber;
        setScannedDotForBoth(newDot);
        toast({ title: 'Thông tin', description: `Đã nhận DOT: ${newDot}. Hãy quét Series.` });
      }
      if (recognizedInfo?.seriesNumber && !newSeries) {
        newSeries = recognizedInfo.seriesNumber;
        setScannedSeriesForBoth(newSeries);
        toast({ title: 'Thông tin', description: `Đã nhận Series: ${newSeries}. Hãy quét DOT.` });
      }
      
      if (!recognizedInfo?.dotNumber && !recognizedInfo?.seriesNumber) {
        toast({ variant: 'destructive', title: 'Không tìm thấy', description: 'Không nhận dạng được DOT hay Series. Vui lòng thử lại.' });
        return;
      }

      if (newDot && newSeries) {
        toast({ title: 'Đã có đủ thông tin', description: `DOT: ${newDot}, Series: ${newSeries}. Đang xử lý...` });
        const response = await fetch('/api/export-scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                noteId,
                scanMode: 'both',
                dotNumber: newDot,
                seriesNumber: newSeries,
            }),
        });
        const result = await response.json();
        await handleScanResponse(result);
        
        // Reset for next scan
        setScannedDotForBoth(null);
        setScannedSeriesForBoth(null);

      }

    } catch (aiError) {
        console.error("AI recognition error:", aiError);
        toast({ variant: 'destructive', title: 'Lỗi AI', description: 'AI processing failed. Please try again.' });
    }
  };
  
  const handleWarrantyScan = async (scanPayload: { imageDataUri?: string; seriesNumber?: string }) => {
    try {
      const response = await fetch('/api/warranty-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, ...scanPayload }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || 'Quét bảo hành thất bại');
      
      if (result.success) {
        toast({ title: 'Thành công', description: result.message, className: 'bg-green-100 border-green-500 text-green-800' });
        setManualInputValue("");
        updateItemWithScan(result.updatedRecordId, result.series, result.dot);
        
        if (result.isCompleted) {
          toast({ title: 'Hoàn tất', description: 'Đã scan đủ số lượng cho phiếu bảo hành.', className: 'bg-green-500 text-white' });
          setTimeout(() => router.push(`/listing?type=${noteType}`), 2000);
        }
      } else {
        toast({ variant: 'destructive', title: 'Thất bại', description: result.message });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Lỗi hệ thống', description: error.message });
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !manualInputValue) return;
    setIsSubmitting(true);
    
    if (noteType === 'warranty') {
        await handleWarrantyScan({ seriesNumber: manualInputValue });
    } else if (noteType === 'import') {
        const response = await fetch('/api/manual-scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ noteId, noteType, valueToScan: manualInputValue })
        });
        const result = await response.json();
        await handleScanResponse(result);
        setManualInputValue("");
    }
    
    setIsSubmitting(false);
  };

  const getPageTitle = () => {
      if (activeScanMode === 'both') return 'Quét DOT & Series';
      if (noteType === 'warranty' || activeScanMode === 'series') return 'Quét Series';
      if (noteType === 'import' || activeScanMode === 'dot') return 'Quét DOT';
      if (noteType === 'export') return 'Chọn Chế Độ Quét';
      return 'Quét Mã';
  }

  const handleModeButtonClick = (mode: ActiveScanMode) => {
    setActiveScanMode(mode);
    setScannedDotForBoth(null);
    setScannedSeriesForBoth(null);
    if (mode === 'both') {
      toast({ title: "Chế độ quét đôi", description: "Hãy quét DOT và Series." });
    }
  };

  const renderMainScanButtons = () => {
    if (activeScanMode !== 'none') {
        const isCaptureDisabled = isSubmitting || hasCameraPermission !== true;
        return (
            <div className="flex flex-col items-center gap-4">
                {activeScanMode === 'both' && (
                    <div className="text-white text-sm bg-black/30 px-3 py-1 rounded-full">
                       {scannedDotForBoth ? `DOT: ${scannedDotForBoth}`: '...'} | {scannedSeriesForBoth ? `Series: ${scannedSeriesForBoth}` : '...'}
                    </div>
                )}
                 <Button
                    onClick={handleCapture}
                    disabled={isCaptureDisabled}
                    className="h-20 w-20 bg-blue-600 text-white rounded-full text-xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 disabled:bg-gray-500 shadow-lg"
                >
                    {isSubmitting ? (
                        <LoaderCircle className="w-10 h-10 animate-spin" />
                    ) : (
                        <Camera className="w-10 h-10" />
                    )}
                </Button>
                <span className="text-white font-semibold">
                    Quét
                </span>
                {noteType === 'export' && (
                     <Button variant="ghost" size="sm" className='text-white' onClick={() => setActiveScanMode('none')}>Chọn lại</Button>
                )}
            </div>
        );
    }
    
    if (noteType === 'export') {
      return (
        <div className="flex justify-center gap-4 w-full">
          <Button onClick={() => handleModeButtonClick('dot')} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex-col h-auto p-3 flex-1">
            <Camera className="w-8 h-8" />
            <span className="text-xs mt-1">Scan DOT</span>
          </Button>
          <Button onClick={() => handleModeButtonClick('series')} className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex-col h-auto p-3 flex-1">
            <ScanText className="w-8 h-8" />
            <span className="text-xs mt-1">Scan Series</span>
          </Button>
          <Button onClick={() => handleModeButtonClick('both')} className="bg-green-600 hover:bg-green-700 text-white rounded-lg flex-col h-auto p-3 flex-1">
            <Combine className="w-8 h-8" />
            <span className="text-xs mt-1">Cả hai</span>
          </Button>
        </div>
      );
    }
    return null;
  }


  return (
    <div className="flex flex-col h-full bg-gray-900">
      <header className="bg-gray-800 text-white p-4 flex items-center justify-between shadow-md sticky top-0 z-20">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="mr-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold text-center flex-1 truncate">{getPageTitle()}</h1>
        <Button onClick={toggleFlash} variant="ghost" size="icon" className="ml-2">
          {isFlashOn ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
        </Button>
      </header>
      
      <canvas ref={canvasRef} className="hidden"></canvas>
      
      <main className="flex-grow overflow-y-auto flex flex-col">
        <div className="relative flex-grow w-full bg-black flex items-center justify-center text-white/50">
             <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
             <div className="absolute inset-0 bg-black/40"></div>
             
             <div className={cn(
                "absolute border-4 border-dashed border-white/50 rounded-lg",
                "w-[95%]",
                noteType === 'warranty' || activeScanMode === 'series' || activeScanMode === 'both' ? "h-[40%]" : "h-[50%]"
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

        <div className='p-4 space-y-4'>
            {(noteType === 'warranty' || noteType === 'import') && (
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                    <Input 
                        placeholder={noteType === 'warranty' ? 'Hoặc nhập tay số series...' : 'Hoặc nhập tay DOT (2 số)...'}
                        value={manualInputValue}
                        onChange={(e) => setManualInputValue(e.target.value.toUpperCase())}
                        className='bg-white/20 text-white placeholder:text-gray-300 border-white/30'
                    />
                    <Button type="submit" size="icon" disabled={isSubmitting || !manualInputValue}>
                        <Send className='w-5 h-5'/>
                    </Button>
                </form>
            )}

            <Card className="bg-white/10 backdrop-blur-sm shadow-lg rounded-xl border border-white/20">
                <CardHeader className="p-3">
                    <CardTitle className="flex justify-between items-center text-xs text-white">
                    <span>Cần Ghi Nhận ({items.length > 0 ? items.length : '...'})</span>
                    <div className="text-right">
                        <div className="font-semibold text-xs text-gray-300">{getTotalProgress().totalScanned} / {getTotalProgress().totalQuantity}</div>
                        <Progress value={(getTotalProgress().totalScanned / getTotalProgress().totalQuantity) * 100 || 0} className="w-20 h-1.5 mt-1 bg-gray-700" />
                    </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[20vh] overflow-y-auto px-3 pb-3">
                    <div className="space-y-2">
                    {items.length > 0 ? items.map(item => (
                        <div key={item.id} className={cn(
                            "p-2 rounded-lg border transition-all",
                            item.scanned >= item.quantity ? "bg-green-500/10 border-green-500/30" : "bg-gray-700/20 border-gray-600/50",
                            )}>
                            <div className="flex justify-between items-center">
                                <p className="font-semibold text-xs text-white">
                                    {noteType === 'warranty' ? `Series: ${item.series || '...'}` : `DOT: ${item.dot !== undefined ? item.dot : '...'}`}
                                </p>
                                <div className="flex items-center gap-2">
                                <span className={cn(
                                    "font-bold text-sm",
                                    item.scanned >= item.quantity ? 'text-green-400' : 'text-yellow-400'
                                    )}>
                                    {item.scanned}/{item.quantity}
                                </span>
                                {item.scanned >= item.quantity && <CheckCircle className="w-3 h-3 text-green-400" />}
                                </div>
                            </div>
                            <Progress value={(item.scanned / item.quantity) * 100} className="h-1 mt-1.5 bg-gray-700" />
                            {noteType === 'export' && <p className="text-xs text-gray-400 mt-1 truncate">Series: {item.series || '-'}</p>}
                        </div>
                    )) : (
                        <div className="text-center text-gray-400 text-xs py-3">Chưa có dữ liệu...</div>
                    )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </main>

      <footer className="p-4 flex justify-center sticky bottom-0 z-20">
        {renderMainScanButtons()}
      </footer>

    </div>
  );
}

export default function ScanningPage() {
    return (
        <Suspense fallback={<div className='flex justify-center items-center h-screen bg-gray-900'><LoaderCircle className='w-12 h-12 text-white animate-spin' /></div>}>
            <ScanningComponent />
        </Suspense>
    )
}
