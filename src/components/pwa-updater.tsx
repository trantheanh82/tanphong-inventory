"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Rocket } from "lucide-react";

export function PwaUpdater() {
    const { toast } = useToast();
    const [updateWaiting, setUpdateWaiting] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator && window.workbox !== undefined) {
            const wb = window.workbox;

            const promptUserToUpdate = () => {
                setUpdateWaiting(true);
            };

            // Lắng nghe sự kiện khi có service worker mới đang chờ để kích hoạt
            wb.addEventListener("waiting", promptUserToUpdate);

            // Đăng ký service worker
            wb.register();
        }
    }, []);

    const handleUpdate = () => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator && window.workbox !== undefined) {
            const wb = window.workbox;
            // Gửi thông điệp yêu cầu service worker mới bỏ qua trạng thái chờ và kích hoạt ngay lập tức
            wb.messageSkipWaiting(); 
            // Sau khi kích hoạt, trang sẽ tự động tải lại do có một listener khác
            // trong next.config.js (`runtimeCaching`... `clientsClaim: true`)
            // hoặc chúng ta có thể thêm một listener 'controlling' để reload.
            // Để chắc chắn, chúng ta sẽ reload ở đây.
            wb.addEventListener('controlling', () => {
                window.location.reload();
            });
        }
    };

    if (!updateWaiting) {
        return null;
    }

    return (
         <div className="fixed bottom-4 right-4 z-[200]">
            <Alert className="bg-gray-800 text-white border-gray-700 shadow-lg">
                <Rocket className="h-4 w-4" />
                <AlertTitle>Cập nhật mới!</AlertTitle>
                <AlertDescription className="flex flex-col gap-2 mt-2">
                   Một phiên bản mới của ứng dụng đã sẵn sàng.
                    <Button onClick={handleUpdate} size="sm" className="bg-white text-gray-800 hover:bg-gray-200">
                        Tải lại ngay
                    </Button>
                </AlertDescription>
            </Alert>
        </div>
    );
}
