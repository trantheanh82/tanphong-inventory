
"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function ScanningPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const router = useRouter();
  const { toast } = useToast();

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
  }, [toast]);

  return (
    <div className="relative w-screen h-screen bg-black">
      <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
      
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        {/* Top left back button */}
        <div className="flex justify-start">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="text-white bg-black/50 hover:bg-black/75 rounded-full">
                <ArrowLeft className="w-6 h-6" />
            </Button>
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

        {/* Bottom buttons */}
        <div className="flex justify-center gap-4 mb-8">
            <Button className="bg-white/80 text-black hover:bg-white backdrop-blur-sm font-semibold text-lg px-8 py-6 rounded-xl">Nội địa</Button>
            <Button className="bg-white/80 text-black hover:bg-white backdrop-blur-sm font-semibold text-lg px-8 py-6 rounded-xl">Nước ngoài</Button>
        </div>
      </div>
    </div>
  );
}
