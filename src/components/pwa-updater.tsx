"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function PwaUpdater() {
    const { toast } = useToast();

    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator && window.workbox !== undefined) {
            const wb = window.workbox;
            
            const promptUserToUpdate = () => {
                 toast({
                    title: "Có bản cập nhật mới",
                    description: "Đang tải phiên bản mới nhất...",
                });
                
                // Don't wait for the user to click a button, just activate the new SW
                wb.messageSkipWaiting(); 
            };

            // Add an event listener to detect when a new service worker is waiting.
            wb.addEventListener("waiting", promptUserToUpdate);
            
            // Fires when the new service worker has taken control
            wb.addEventListener('controlling', (event) => {
                if (event.isUpdate) {
                    window.location.reload();
                }
            });

            // Register the service worker
            wb.register();
        }
    }, [toast]);

    return null;
}
