"use client";

import { useState, useEffect } from "react";
import { TextField } from "@unisane/ui/components/text-field";
import { Icon } from "@unisane/ui/primitives/icon";

interface SettingsSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SettingsSearch({
  onSearch,
  placeholder = "Search settings...",
}: SettingsSearchProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 300); // Debounce

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <TextField
      label="Search"
      variant="outlined"
      placeholder={placeholder}
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      leadingIcon={<Icon symbol="search" />}
      trailingIcon={
        query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="hover:text-on-surface transition-colors"
          >
            <Icon symbol="close" size="sm" />
          </button>
        ) : undefined
      }
      className="max-w-md"
    />
  );
}
