"use client";

import { useState, useEffect } from "react";
import { Input } from "@/src/components/ui/input";
import { Search } from "lucide-react";

interface SettingsSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SettingsSearch({ onSearch, placeholder = "Search settings..." }: SettingsSearchProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 300); // Debounce

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}
