
"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchInputProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  placeholder: string;
  model: 'import_model' | 'export_model' | 'warranty_model';
}

export function SearchInput({ searchQuery, setSearchQuery, placeholder, model }: SearchInputProps) {
  // The 'model' prop is available for future use, e.g., to tailor search logic.
  // console.log("Current search model:", model);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
      <Input
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-10 pr-3 py-3 border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-gray-800 bg-white/80"
      />
    </div>
  );
}
