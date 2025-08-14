
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function WarrantyPage() {
  return (
    <div className="p-4 animate-in fade-in-0 duration-500">
      <Card className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg border border-white/50">
        <CardHeader>
          <CardTitle className="text-[#333] flex items-center gap-2">
            <ShieldCheck className="w-6 h-6" />
            <span>Bảo hành</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            This is the warranty page. Content will be added here soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
