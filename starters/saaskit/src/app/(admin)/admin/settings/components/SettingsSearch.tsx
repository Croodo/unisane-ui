"use client";

import { useState, useEffect } from "react";
import { Input } from "@unisane/ui/primitives/input";
import { Icon } from "@unisane/ui/primitives/icon";

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
      <Icon symbol="search" size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}
