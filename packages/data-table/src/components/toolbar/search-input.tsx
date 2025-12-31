"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn, Icon, Button } from "@unisane/ui";
import { useFiltering } from "../../context";
import { useDebounce } from "../../hooks/utilities/use-debounce";

const SEARCH_DEBOUNCE_MS = 300;

interface SearchInputProps {
  /** Compact mode - icon only that expands on focus (for mobile) */
  compact?: boolean;
  /** Additional class names */
  className?: string;
  /** Placeholder text */
  placeholder?: string;
}

export function SearchInput({
  compact = false,
  className,
  placeholder = "Search..."
}: SearchInputProps) {
  const { searchText, setSearch } = useFiltering();
  // Local state for immediate UI feedback
  const [localValue, setLocalValue] = useState(searchText);
  // Expanded state for compact mode
  const [isExpanded, setIsExpanded] = useState(false);
  // Debounced value for actual filtering
  const debouncedValue = useDebounce(localValue, SEARCH_DEBOUNCE_MS);
  // Track previous searchText to detect external clears
  const prevSearchTextRef = useRef(searchText);
  // Input ref for focus management
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleClear = useCallback(() => {
    setLocalValue("");
    setSearch("");
    if (compact) {
      setIsExpanded(false);
    }
  }, [compact, setSearch]);

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    // Focus input after state update
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleBlur = useCallback(() => {
    // Only collapse if empty
    if (compact && !localValue) {
      setIsExpanded(false);
    }
  }, [compact, localValue]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      if (compact) {
        handleClear();
      } else {
        inputRef.current?.blur();
      }
    }
  }, [compact, handleClear]);

  // Compact mode: icon-only button that expands
  if (compact && !isExpanded && !localValue) {
    return (
      <button
        onClick={handleExpand}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg",
          "text-on-surface-variant hover:text-on-surface hover:bg-on-surface/8",
          "transition-colors",
          className
        )}
        aria-label="Open search"
      >
        <Icon symbol="search" className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "relative flex items-center h-10 bg-surface border border-outline-variant rounded-lg",
        "focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20",
        "transition-all duration-200",
        // Responsive width using container query from toolbar container
        "w-56",
        // Expanded compact mode
        compact && isExpanded && "absolute right-0 top-0 z-10 w-64 shadow-lg",
        className
      )}
    >
      {/* Search icon - touch-friendly size */}
      <span className="flex items-center justify-center w-10 h-full shrink-0">
        <Icon
          symbol="search"
          className="w-5 h-5 text-on-surface-variant"
        />
      </span>
      <input
        ref={inputRef}
        type="text"
        inputMode="search"
        enterKeyHint="search"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={cn(
          "flex-1 min-w-0 h-full pr-2 text-body-medium bg-transparent",
          "text-on-surface placeholder:text-on-surface-variant/70 outline-none"
        )}
      />
      {localValue && (
        <button
          onClick={handleClear}
          className={cn(
            "flex items-center justify-center w-10 h-full shrink-0",
            "hover:bg-on-surface/8 transition-colors rounded-r-lg"
          )}
          aria-label="Clear search"
        >
          <Icon
            symbol="close"
            className="w-5 h-5 text-on-surface-variant"
          />
        </button>
      )}
    </div>
  );
}

// ─── MOBILE SEARCH OVERLAY ──────────────────────────────────────────────────

interface MobileSearchOverlayProps {
  /** Whether the overlay is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Full-screen search overlay for mobile devices.
 * Based on the dataflow-extract ReviewHeader pattern.
 */
export function MobileSearchOverlay({
  isOpen,
  onClose,
  placeholder = "Search within this data..."
}: MobileSearchOverlayProps) {
  const { searchText, setSearch } = useFiltering();
  const [localValue, setLocalValue] = useState(searchText);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedValue = useDebounce(localValue, SEARCH_DEBOUNCE_MS);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Sync debounced value to context
  useEffect(() => {
    if (debouncedValue !== searchText) {
      setSearch(debouncedValue);
    }
  }, [debouncedValue, searchText, setSearch]);

  // Sync external clears
  useEffect(() => {
    if (searchText === "" && localValue !== "") {
      setLocalValue("");
    }
  }, [searchText, localValue]);

  const handleClear = useCallback(() => {
    setLocalValue("");
    setSearch("");
  }, [setSearch]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  }, [handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 bg-surface z-50 flex items-center px-2",
        "animate-in fade-in slide-in-from-top-2 duration-200"
      )}
    >
      <div className="flex-1 max-w-2xl mx-auto flex items-center gap-2 w-full">
        <Icon symbol="search" className="w-5 h-5 text-on-surface-variant ml-2 shrink-0" />
        <input
          ref={inputRef}
          autoFocus
          type="text"
          inputMode="search"
          enterKeyHint="search"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "flex-1 bg-transparent border-none outline-none",
            "text-body-large text-on-surface placeholder:text-on-surface-variant h-12"
          )}
        />
        <div className="flex items-center gap-2 shrink-0">
          {localValue && (
            <button
              onClick={handleClear}
              className="px-2 py-1 rounded text-label-medium text-on-surface-variant hover:text-on-surface hover:bg-on-surface/8 transition-colors"
            >
              Clear
            </button>
          )}
          <Button
            variant="text"
            size="sm"
            onClick={handleClose}
            className="w-10 h-10 p-0"
          >
            <Icon symbol="close" className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
