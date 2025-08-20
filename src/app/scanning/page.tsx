
"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Zap, ZapOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function ScanningPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(true);
  const [isFlashSupported, setIsFlashSupported] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const applyFlashConstraint = useCallback(async (track: MediaStreamTrack, enabled: boolean) => {
    try {
      await track.applyConstraints({ advanced: [{ torch: enabled }] });
      setIsFlashOn(enabled);
    } catch (error) {
      console.error('Error applying flash constraints:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi Flash',
        description: 'Không thể thay đổi trạng thái đèn flash.',
      });
    }
  }, [toast]);
  
  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Camera API is not available in this browser.');
        setHasCameraPermission(false);
        toast({
            variant: 'destructive',
            title: 'Lỗi Camera',
            description: 'Trình duyệt của bạn không hỗ trợ truy cập camera.',
        });
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const track = stream.getVideoTracks()[0];
        if (track) {
            videoTrackRef.current = track;
            const capabilities = track.getCapabilities();
            if (capabilities.torch) {
                setIsFlashSupported(true);
                // Apply default flash state
                applyFlashConstraint(track, true);
            }
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Từ chối Truy cập Camera',
          description: 'Vui lòng cho phép truy cập camera trong cài đặt trình duyệt để sử dụng tính năng này.',
        });
      }
    };

    getCameraPermission();

    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast, applyFlashConstraint]);

  const toggleFlash = () => {
    if (videoTrackRef.current && isFlashSupported) {
        applyFlashConstraint(videoTrackRef.current, !isFlashOn);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black">
      <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
      
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        {/* Top controls */}
        <div className="flex justify-between">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="text-white bg-black/50 hover:bg-black/75 rounded-full">
                <ArrowLeft className="w-6 h-6" />
            </Button>
            {isFlashSupported && (
                <Button onClick={toggleFlash} variant="ghost" size="icon" className="text-white bg-black/50 hover:bg-black/75 rounded-full">
                    {isFlashOn ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
                </Button>
            )}
        </div>

        {hasCameraPermission === false && (
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <Alert variant="destructive" className="max-w-sm bg-destructive/90 text-destructive-foreground border-destructive-foreground/50">
                    <AlertTitle>Yêu cầu truy cập Camera</AlertTitle>
                    <AlertDescription>
                        Vui lòng cho phép truy cập camera để sử dụng tính năng này. Bạn có thể cần phải thay đổi quyền trong cài đặt trình duyệt của mình.
                    </AlertDescription>
                </Alert>
            </div>
        )}
      </div>
    </div>
  );
}
