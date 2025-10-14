
'use client';

import { useEffect, useState, useRef, Suspense, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Camera, CheckCircle, LoaderCircle, Scan, Zap, ZapOff, Send, ScanText, Combine, AlertTriangle, X, RefreshCw, Check, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useScanningStore, ScanItem } from '@/store/scanning-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import Image from 'next/image';

type ActiveScanMode = 'dot' | 'series' | 'both' | 'none';
type ScanStep = 'dot' | 'series' | 'waiting' | 'done';

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
  partial?: boolean;
  dotImageUploaded?: boolean;
  seriesImageUploaded?: boolean;
  recordId?: string;
}

interface ConfirmationData {
  imageUri: string;
  scannedDot: string | null;
  scannedSeries: string | null;
  expectedDot: string | null;
  isMatch: boolean | null;
  scanMode: ActiveScanMode;
}


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

  const [activeScanMode, setActiveScanMode] = useState<ActiveScanMode>('none');
  const [scannedDotForBoth, setScannedDotForBoth] = useState<string | null>(null);
  const [scannedSeriesForBoth, setScannedSeriesForBoth] = useState<string | null>(null);
  const [rescanningItemId, setRescanningItemId] = useState<string | null>(null);
  const [recordIdForBoth, setRecordIdForBoth] = useState<string | null>(null);

  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);


  const noteId = searchParams.get('noteId');
  const noteType = searchParams.get('type') as 'import' | 'export' | 'warranty';

  const {
    items,
    setItems,
    getTotalProgress,
    reset,
    checkAllScanned
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
        tire_type: item.fields.tire_type, has_dot: item.fields.has_dot
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
    
    fetchNoteDetails();
  }, [noteId, noteType, router, toast, fetchNoteDetails]);

  const availableScanModes = useMemo(() => {
    if (noteType !== 'export') return [];
    const modes = new Set<ActiveScanMode>();
    items.forEach(item => {
        if ((item.scanned || 0) < item.quantity) {
            if (item.has_dot) {
                modes.add('both');
            } else if (item.tire_type === 'Nội địa') {
                modes.add('dot');
            } else if (item.tire_type === 'Nước ngoài' && !item.has_dot) {
                modes.add('series');
            }
        }
    });
    return Array.from(modes);
  }, [items, noteType]);

  useEffect(() => {
    // Do not change mode if we are in rescan mode
    if (rescanningItemId) return;

    if (noteType === 'import') {
      setActiveScanMode('dot');
    } else if (noteType === 'warranty') {
      setActiveScanMode('series');
    } else if (noteType === 'export') {
        if (checkAllScanned()) {
             setActiveScanMode('none');
        } else {
            const currentAvailableModes = availableScanModes;
            if (currentAvailableModes.length === 1) {
                setActiveScanMode(currentAvailableModes[0]);
            } else if (currentAvailableModes.length > 1) {
                if (!currentAvailableModes.includes(activeScanMode)) {
                     setActiveScanMode('none');
                }
            } else {
                setActiveScanMode('none');
            }
        }
    }
  }, [noteType, availableScanModes, items, activeScanMode, checkAllScanned, rescanningItemId]);

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
    
    const overlayWidthPercent = 0.80;
    const overlayHeightPercent = 0.20;

    const cropWidth = videoWidth * overlayWidthPercent;
    const cropHeight = videoHeight * overlayHeightPercent;

    const cropX = (videoWidth - cropWidth) / 2;
    const cropY = (videoHeight - cropHeight) / 2;
    
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    context.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    return canvas.toDataURL('image/jpeg', 0.9);
  }

  const resetBothScanState = () => {
    setScannedDotForBoth(null);
    setScannedSeriesForBoth(null);
    setRecordIdForBoth(null);
  };

  const handleScanResponse = async (result: ScanResultData) => {
    if (result.success && !result.partial) {
        toast({
            title: result.warning ? 'Quét thành công (Đã đủ)' : 'Quét thành công',
            description: result.message,
            className: result.warning ? "bg-yellow-100 border-yellow-500 text-yellow-800" : "bg-green-100 border-green-500 text-green-800"
        });
        
        if(result.dotImageUploaded) toast({ title: 'Thông báo', description: 'Đã tải lên hình ảnh DOT.' });
        if(result.seriesImageUploaded) toast({ title: 'Thông báo', description: 'Đã tải lên hình ảnh Series.' });
        
        if (rescanningItemId) setRescanningItemId(null);
        if (activeScanMode === 'both') {
            resetBothScanState();
        }

        await fetchNoteDetails(); 
        
    } else if (result.success && result.partial) {
        // This is for the first step of a 'both' scan
        setRecordIdForBoth(result.recordId!);
        if (result.dot) {
            setScannedDotForBoth(result.dot);
            toast({ title: "Bước 1 Thành công", description: result.message });
        } else if (result.series) {
            setScannedSeriesForBoth(result.series);
             toast({ title: "Bước 1 Thành công", description: result.message });
        }
        if(result.dotImageUploaded) toast({ title: 'Thông báo', description: 'Đã tải lên hình ảnh DOT.' });
        if(result.seriesImageUploaded) toast({ title: 'Thông báo', description: 'Đã tải lên hình ảnh Series.' });

    } else if (!result.success) {
        toast({ variant: 'destructive', title: "Thất bại", description: result.message });
        // Don't reset state if it was a partial success on the server that client rejected
        if (activeScanMode === 'both' && !result.partial) {
             if (scannedDotForBoth) {
             } else {
                resetBothScanState();
             }
        }
    }
  }

  const proceedWithScan = async (data: ConfirmationData) => {
    setIsSubmitting(true);
    let endpoint = '/api/scan';
    let scanTypeForApi: 'dot' | 'series' | undefined = undefined;

    // This is the second step of a "both" scan.
    const isSecondStepOfBoth = data.scanMode === 'both' && (scannedDotForBoth || scannedSeriesForBoth);
    
    if (isSecondStepOfBoth) {
      scanTypeForApi = scannedDotForBoth ? 'series' : 'dot';
    }
    
    let body: any = { 
        noteId, 
        noteType, 
        imageDataUri: data.imageUri, 
        dotNumber: data.scannedDot || scannedDotForBoth, 
        seriesNumber: data.scannedSeries || scannedSeriesForBoth,
        rescanRecordId: rescanningItemId,
        scanType: scanTypeForApi,
        recordId: recordIdForBoth,
    };

    if (noteType === 'export') {
      endpoint = '/api/export-scan';
      body.scanMode = data.scanMode;
    } else if (noteType === 'warranty') {
      await handleWarrantyScan({ imageDataUri: data.imageUri, seriesNumber: data.scannedSeries! });
      setIsSubmitting(false);
      return;
    }
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result: ScanResultData = await response.json();
      await handleScanResponse(result);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Lỗi hệ thống', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleCapture = async () => {
    if (isSubmitting || hasCameraPermission !== true || activeScanMode === 'none') return;
    
    const imageDataUri = captureImage();
    if (!imageDataUri) {
        toast({ variant: 'destructive', title: "Lỗi", description: "Không thể xử lý hình ảnh." });
        return;
    }
    
    setIsSubmitting(true);
    
    try {
      const recogResponse = await fetch('/api/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUri }),
      });

      const recogResult = await recogResponse.json();
      if (!recogResult.success) {
        throw new Error(recogResult.message || 'Không nhận dạng được thông tin.');
      }
      
      const scannedDot = recogResult.dotNumber || null;
      const scannedSeries = recogResult.seriesNumber || null;

      let expectedDot: string | null = null;
      let isMatch: boolean | null = null;
      
      let isReadyToProceed = false;

      // Handle the first scan of a "both" process
      if (activeScanMode === 'both' && !scannedDotForBoth && !scannedSeriesForBoth) {
          if (scannedDot) {
              const lastTwoDigits = scannedDot.slice(-2);
              const targetItem = items.find(item => item.has_dot && String(item.dot) === lastTwoDigits && item.scanned < item.quantity);
              isMatch = !!targetItem;
              expectedDot = targetItem ? String(targetItem.dot) : lastTwoDigits;
              isReadyToProceed = true;
          } else if (scannedSeries) {
              isMatch = true; // For series, we can't pre-match, so we assume it's okay to proceed
              isReadyToProceed = true;
          } else {
               throw new Error('Không nhận dạng được DOT hay Series.');
          }
      // Handle the second scan of a "both" process
      } else if (activeScanMode === 'both' && (scannedDotForBoth || scannedSeriesForBoth)) {
          if (scannedDotForBoth && scannedSeries) { // Have DOT, now scanning Series
               isMatch = true; // Can't pre-match series
               isReadyToProceed = true;
          } else if (scannedSeriesForBoth && scannedDot) { // Have Series, now scanning DOT
              const lastTwoDigits = scannedDot.slice(-2);
              const targetItem = items.find(item => item.id === recordIdForBoth);
              expectedDot = targetItem ? String(targetItem.dot) : null;
              isMatch = expectedDot === lastTwoDigits;
              isReadyToProceed = true;
          } else {
               throw new Error('Không nhận dạng được thông tin cần thiết cho bước 2.');
          }
      }
      // Handle single DOT scan modes
      else if (activeScanMode === 'dot') {
          if (!scannedDot) {
              throw new Error('Không nhận dạng được DOT 4 chữ số.');
          }
          const lastTwoDigits = scannedDot.slice(-2);
          const targetItem = items.find(item => String(item.dot) === lastTwoDigits && item.scanned < item.quantity);
          expectedDot = targetItem ? String(targetItem.dot) : lastTwoDigits;
          isMatch = !!targetItem;
          isReadyToProceed = true;
      }
      // Handle single Series scan modes or warranty
      else if (activeScanMode === 'series') {
          if (!scannedSeries) {
              throw new Error('Không nhận dạng được Series.');
          }
          isMatch = true; // Can't pre-match series
          isReadyToProceed = true;
      }
      
      if (isReadyToProceed) {
          setConfirmationData({
              imageUri: imageDataUri,
              scannedDot: scannedDot,
              scannedSeries: scannedSeries,
              expectedDot: expectedDot,
              isMatch: isMatch,
              scanMode: activeScanMode
          });
          setIsConfirmationOpen(true);
      } else {
          throw new Error('Chế độ quét không hợp lệ hoặc không có thông tin nhận dạng.');
      }

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Lỗi Nhận Dạng', description: error.message });
    }

    setIsSubmitting(false);
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
      
      await handleScanResponse(result);

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Lỗi hệ thống', description: error.message });
    }
  };
  
  const handleRescanClick = (item: ScanItem) => {
    setRescanningItemId(item.id);
    let description = "";
    if (item.has_dot) {
      setActiveScanMode('both');
      description = "Vui lòng quét lại DOT & Series cho mục đã chọn.";
    } else if (item.tire_type === 'Nước ngoài' && !item.has_dot) {
      setActiveScanMode('series');
      description = "Vui lòng quét lại Series cho mục đã chọn.";
    } else {
      setActiveScanMode('dot');
      description = "Vui lòng quét lại DOT cho mục đã chọn.";
    }

    toast({
        title: "Chế độ quét lại",
        description: description,
    });
  };

  const getPageTitle = () => {
      if (checkAllScanned() && !rescanningItemId) return "Đã hoàn tất";
      if (rescanningItemId) {
          const item = items.find(i => i.id === rescanningItemId);
          if (item?.has_dot) return 'Quét lại DOT & Series';
          if (item?.tire_type === 'Nước ngoài' && !item.has_dot) return 'Quét lại Series';
          return 'Quét lại DOT';
      }
      if (noteType === 'export') {
          if (activeScanMode === 'none') return 'Chọn Chế Độ Quét';
          if (activeScanMode === 'dot') return 'Quét DOT';
          if (activeScanMode === 'series') return 'Quét Series';
          if (activeScanMode === 'both') {
              if (scannedDotForBoth) return 'Bước 2: Quét Series';
              if (scannedSeriesForBoth) return 'Bước 2: Quét DOT';
              return 'Bước 1: Quét DOT hoặc Series';
          }
      }
      if (noteType === 'import') return 'Quét Mã DOT';
      if (noteType === 'warranty') return 'Quét Mã Series';
      return 'Quét Mã';
  }

  const handleModeButtonClick = (mode: ActiveScanMode) => {
    setActiveScanMode(mode);
    resetBothScanState();
  };
  
  const cancelScan = () => {
    if (rescanningItemId) {
      setRescanningItemId(null);
      // Reset activeScanMode to what it should be based on remaining items
      const currentAvailableModes = availableScanModes;
      if (currentAvailableModes.length === 1) {
          setActiveScanMode(currentAvailableModes[0]);
      } else {
          setActiveScanMode('none');
      }
    } else if (activeScanMode === 'both' && (scannedDotForBoth || scannedSeriesForBoth)) {
      setScannedDotForBoth(null);
      setScannedSeriesForBoth(null);
      setRecordIdForBoth(null);
    }
  }

  const handleBack = () => {
    if (noteType) {
        router.push(`/listing?type=${noteType}`);
    } else {
        router.back();
    }
  };

  const renderMainScanButtons = () => {
    if (rescanningItemId) {
      const isCaptureDisabled = isSubmitting || hasCameraPermission !== true;
      return (
            <div className="flex flex-col items-center gap-4">
                 <Button
                    onClick={handleCapture}
                    disabled={isCaptureDisabled}
                    className="h-20 w-20 bg-blue-600 text-white rounded-full text-xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 disabled:bg-gray-500 shadow-lg"
                >
                    {isSubmitting ? <LoaderCircle className="w-10 h-10 animate-spin" /> : <Camera className="w-10 h-10" />}
                </Button>
                <span className="text-white font-semibold">Quét lại</span>
                <Button variant="ghost" size="sm" className="text-yellow-400" onClick={() => setRescanningItemId(null)}>Hủy quét lại</Button>
            </div>
      );
    }
    
    if (checkAllScanned()) {
        return (
            <Button onClick={handleBack} className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-3">
                <CheckCircle className="w-5 h-5 mr-2" />
                Hoàn tất, quay lại danh sách
            </Button>
        );
    }

    if (activeScanMode !== 'none') {
        const isCaptureDisabled = isSubmitting || hasCameraPermission !== true;
        return (
            <div className="flex flex-col items-center gap-4">
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
                {noteType === 'export' && !rescanningItemId && availableScanModes.length > 1 && (
                     <Button variant="ghost" size="sm" className='text-white' onClick={() => { setActiveScanMode('none'); cancelScan(); }}>Chọn lại chế độ</Button>
                )}
                {(rescanningItemId || (activeScanMode === 'both' && (scannedDotForBoth || scannedSeriesForBoth))) && (
                    <Button variant="ghost" size="sm" className="text-yellow-400" onClick={cancelScan}>Hủy</Button>
                )}
            </div>
        );
    }
    
    if (noteType === 'export') {
      return (
        <div className="flex justify-center gap-4 w-full">
          {availableScanModes.includes('dot') && (
            <Button onClick={() => handleModeButtonClick('dot')} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex-col h-auto p-3 flex-1">
              <Scan className="w-8 h-8" />
              <span className="text-xs mt-1">Quét DOT</span>
            </Button>
          )}
          {availableScanModes.includes('series') && (
            <Button onClick={() => handleModeButtonClick('series')} className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex-col h-auto p-3 flex-1">
              <ScanText className="w-8 h-8" />
              <span className="text-xs mt-1">Quét Series</span>
            </Button>
          )}
          {availableScanModes.includes('both') && (
            <Button onClick={() => handleModeButtonClick('both')} className="bg-green-600 hover:bg-green-700 text-white rounded-lg flex-col h-auto p-3 flex-1">
              <Combine className="w-8 h-8" />
              <span className="text-xs mt-1">Cả hai</span>
            </Button>
          )}
        </div>
      );
    }
    return null;
  }


  return (
    <div className="flex flex-col h-full bg-gray-900">
      <header className="bg-gray-800 text-white p-4 flex items-center justify-between shadow-md sticky top-0 z-20">
        <Button onClick={handleBack} variant="ghost" size="icon" className="mr-2">
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
             
             <div className="absolute border-4 border-dashed border-white/50 rounded-lg w-[80%] h-[20%]"></div>

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
             {(scannedDotForBoth || scannedSeriesForBoth) && (
                <Alert variant="default" className="bg-blue-500/10 border-blue-500/30 text-blue-300 flex justify-between items-center">
                    <div>
                        <AlertTitle>Đã ghi nhận:</AlertTitle>
                        <AlertDescription>
                            {scannedDotForBoth && `DOT: ${scannedDotForBoth}`}
                            {scannedDotForBoth && scannedSeriesForBoth && <br />}
                            {scannedSeriesForBoth && `Series: ${scannedSeriesForBoth}`}
                        </AlertDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="text-blue-300" onClick={cancelScan}>
                        <X className="h-4 w-4"/>
                    </Button>
                </Alert>
            )}
            
            {rescanningItemId && (
                <Alert variant="default" className="bg-yellow-500/10 border-yellow-500/30 text-yellow-300">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <AlertTitle>Chế độ quét lại</AlertTitle>
                    <AlertDescription>
                        Quét thông tin mới để cập nhật cho mục đã chọn.
                    </AlertDescription>
                </Alert>
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
                            rescanningItemId === item.id ? "bg-yellow-500/20 border-yellow-500" :
                            (item.scanned || 0) >= item.quantity ? "bg-green-500/10 border-green-500/30" : "bg-gray-700/20 border-gray-600/50",
                            )}>
                            <div className="flex justify-between items-center">
                                <div className='flex-1 min-w-0'>
                                <p className="font-semibold text-xs text-white truncate">
                                    {item.has_dot ? `DOT: ${item.dot} & Series` :
                                     item.tire_type === 'Nội địa' ? `DOT: ${item.dot}` :
                                     item.tire_type === 'Nước ngoài' && !item.has_dot ? `Series` :
                                     noteType === 'warranty' ? `Series: ${item.series || '...'}` : `DOT: ${item.dot !== undefined ? item.dot : '...'}`}
                                </p>
                                { (noteType === 'export' || noteType === 'warranty') && item.series && <p className="text-xs text-gray-400 mt-1 truncate">Series: {item.series}</p>}
                                </div>
                                <div className="flex items-center gap-2 pl-2">
                                    {noteType === 'export' && (item.has_dot || (item.tire_type === 'Nước ngoài' && !item.has_dot)) && (item.scanned || 0) > 0 && item.quantity === 1 && (
                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-yellow-400" onClick={() => handleRescanClick(item)}>
                                            <RefreshCw className="w-4 h-4"/>
                                        </Button>
                                    )}
                                    <span className={cn(
                                        "font-bold text-sm",
                                        (item.scanned || 0) >= item.quantity ? 'text-green-400' : 'text-yellow-400'
                                        )}>
                                        {item.scanned}/{item.quantity}
                                    </span>
                                    {(item.scanned || 0) >= item.quantity && <CheckCircle className="w-3 h-3 text-green-400" />}
                                </div>
                            </div>
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

      {confirmationData && (
        <Dialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
            <DialogContent className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg border-white/50 text-gray-800">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-[#333]">Xác Nhận Thông Tin Quét</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="relative w-full aspect-video rounded-md overflow-hidden border">
                        <Image src={confirmationData.imageUri} alt="Captured scan" layout="fill" objectFit="contain" />
                    </div>
                    <div className="space-y-2 text-sm">
                        {confirmationData.scannedDot && (
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-600">DOT quét được:</span>
                                <span className="font-bold text-lg text-black">{confirmationData.scannedDot}</span>
                            </div>
                        )}
                        {confirmationData.scannedSeries && (
                             <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-600">Series quét được:</span>
                                <span className="font-bold text-base text-black break-all">{confirmationData.scannedSeries}</span>
                            </div>
                        )}
                         {confirmationData.expectedDot && (
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-600">DOT cần quét:</span>
                                <span className="font-bold text-lg text-black">{confirmationData.expectedDot}</span>
                            </div>
                        )}
                        {confirmationData.isMatch !== null && (
                            <div className={cn("flex justify-between items-center p-2 rounded-md", confirmationData.isMatch ? "bg-green-100" : "bg-red-100")}>
                                <span className={cn("font-semibold", confirmationData.isMatch ? "text-green-800" : "text-red-800")}>
                                    Kết quả:
                                </span>
                                <div className="flex items-center gap-2">
                                     <span className={cn("font-bold text-lg", confirmationData.isMatch ? "text-green-800" : "text-red-800")}>
                                        {confirmationData.isMatch ? "TRÙNG KHỚP" : "KHÔNG KHỚP"}
                                    </span>
                                    {confirmationData.isMatch ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsConfirmationOpen(false)}>Hủy</Button>
                    <Button 
                        onClick={() => {
                            setIsConfirmationOpen(false);
                            proceedWithScan(confirmationData);
                        }}
                        disabled={confirmationData.isMatch === false}
                        className="bg-gray-800 hover:bg-gray-900 text-white disabled:bg-gray-400"
                    >
                        Xác nhận
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

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
