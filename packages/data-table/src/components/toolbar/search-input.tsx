"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "@unisane/ui";
import { useFiltering } from "../../context";
import { useDebounce } from "../../hooks/use-debounce";

const SEARCH_DEBOUNCE_MS = 300;

export function SearchInput() {
  const { searchText, setSearch } = useFiltering();
  // Local state for immediate UI feedback
  const [localValue, setLocalValue] = useState(searchText);
  // Debounced value for actual filtering
  const debouncedValue = useDebounce(localValue, SEARCH_DEBOUNCE_MS);
  // Track previous searchText to detect external clears
  const prevSearchTextRef = useRef(searchText);

  // Sync debounced value to context
  useEffect(() => {
    if (debouncedValue !== searchText) {
      setSearch(debouncedValue);
    }
  }, [debouncedValue, searchText, setSearch]);

  // Sync external changes (e.g., clear from filter chips)
  // Only reset when searchText was externally changed to empty
  useEffect(() => {
    // Check if searchText was externally cleared (not by us typing)
    if (prevSearchTextRef.current !== "" && searchText === "") {
      setLocalValue("");
    }
    prevSearchTextRef.current = searchText;
  }, [searchText]);

  const handleClear = () => {
    setLocalValue("");
    setSearch("");
  };

  return (
    <div className="relative flex items-center w-56 h-9 bg-surface border border-outline-variant rounded focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
      {/* Search icon - positioned with padding */}
      <span className="flex items-center justify-center w-9 h-full shrink-0">
        <Icon
          symbol="search"
          className="w-[18px] h-[18px] text-[18px] text-on-surface-variant"
        />
      </span>
      <input
        type="text"
        placeholder="Search..."
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        className="flex-1 min-w-0 h-full pr-2 text-body-medium bg-transparent text-on-surface placeholder:text-on-surface-variant/70 outline-none"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="flex items-center justify-center w-8 h-full shrink-0 hover:bg-on-surface/8 transition-colors"
          aria-label="Clear search"
        >
          <Icon
            symbol="close"
            className="w-4 h-4 text-[16px] text-on-surface-variant"
          />
        </button>
      )}
    </div>
  );
}
