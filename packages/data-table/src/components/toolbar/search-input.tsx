"use client";

import { useState, useEffect, useRef, useCallback, useId } from "react";
import { cn, Icon, Button } from "@unisane/ui";
import { useFiltering } from "../../context";
import { useDebounce } from "../../hooks/utilities/use-debounce";
import { useI18n } from "../../i18n";

const SEARCH_DEBOUNCE_MS = 300;

interface SearchInputProps {
  /** Additional class names */
  className?: string;
  /** Placeholder text - if not provided, uses i18n default */
  placeholder?: string;
}

/**
 * Responsive search input component using container queries.
 *
 * Container breakpoints (based on parent @container):
 * - < @3xl: Icon button that opens full-width overlay within toolbar
 * - @3xl+: Fixed-width inline input field (240px)
 *
 * This follows the dataflow-extract ReviewHeader pattern where
 * search adapts to container width, not viewport width.
 */
export function SearchInput({
  className,
  placeholder,
}: SearchInputProps) {
  const { t } = useI18n();
  const { searchText, setSearch } = useFiltering();
  const effectivePlaceholder = placeholder ?? t("searchPlaceholder");
  const searchId = useId();
  const descriptionId = `${searchId}-desc`;
  // Local state for immediate UI feedback
  const [localValue, setLocalValue] = useState(searchText);
  // Overlay expanded state (for smaller containers)
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  // Debounced value for actual filtering
  const debouncedValue = useDebounce(localValue, SEARCH_DEBOUNCE_MS);
  // Track previous searchText to detect external clears
  const prevSearchTextRef = useRef(searchText);
  // Input ref for focus management
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayInputRef = useRef<HTMLInputElement>(null);

  // Sync debounced value to context
  useEffect(() => {
    if (debouncedValue !== searchText) {
      setSearch(debouncedValue);
    }
  }, [debouncedValue, searchText, setSearch]);

  // Sync external changes (e.g., clear from filter chips)
  useEffect(() => {
    if (prevSearchTextRef.current !== "" && searchText === "") {
      setLocalValue("");
    }
    prevSearchTextRef.current = searchText;
  }, [searchText]);

  // Focus overlay input when expanded
  useEffect(() => {
    if (isOverlayOpen) {
      setTimeout(() => overlayInputRef.current?.focus(), 50);
    }
  }, [isOverlayOpen]);

  const handleClear = useCallback(() => {
    setLocalValue("");
    setSearch("");
  }, [setSearch]);

  const handleOverlayClose = useCallback(() => {
    setIsOverlayOpen(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Escape") {
        if (isOverlayOpen) {
          handleOverlayClose();
        } else {
          inputRef.current?.blur();
        }
      }
    },
    [isOverlayOpen, handleOverlayClose]
  );

  // Check if there's an active search (to show indicator on icon)
  const hasActiveSearch = searchText.length > 0;

  return (
    <>
      {/* Small/Medium containers (< @3xl): Icon button that opens overlay */}
      <button
        onClick={() => setIsOverlayOpen(true)}
        className={cn(
          "@3xl:hidden flex items-center justify-center w-11 h-11 rounded-lg relative",
          "text-on-surface-variant hover:text-on-surface hover:bg-on-surface/8",
          "transition-colors",
          className
        )}
        aria-label={t("openSearch")}
      >
        <Icon symbol="search" className="w-5 h-5" />
        {/* Active search indicator */}
        {hasActiveSearch && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        )}
      </button>

      {/* Search overlay (takes full toolbar width) - visible when isOverlayOpen */}
      {isOverlayOpen && (
        <div
          className={cn(
            "@3xl:hidden absolute left-0 right-0 top-0 bottom-0 bg-surface border-b-2 border-primary z-50 flex items-center px-3 gap-2",
            "animate-in fade-in duration-150"
          )}
        >
          <Icon symbol="search" className="w-5 h-5 text-on-surface-variant shrink-0" />
          <input
            ref={overlayInputRef}
            type="text"
            inputMode="search"
            enterKeyHint="search"
            placeholder={effectivePlaceholder}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label={t("searchPlaceholder")}
            className={cn(
              "flex-1 min-w-0 h-full bg-transparent border-none outline-none",
              "text-body-medium text-on-surface placeholder:text-on-surface-variant/70"
            )}
          />
          {localValue && (
            <button
              onClick={handleClear}
              className="px-2 py-1 rounded text-label-medium text-primary hover:bg-primary/8 transition-colors shrink-0"
            >
              {t("clear")}
            </button>
          )}
          <button
            onClick={handleOverlayClose}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-on-surface/8 transition-colors shrink-0"
            aria-label={t("clearSearch")}
          >
            <Icon symbol="close" className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Large containers (@3xl+): Inline input field */}
      <div
        role="search"
        aria-label={t("searchPlaceholder")}
        className={cn(
          "hidden @3xl:flex relative items-center h-9 bg-surface border border-outline-variant rounded",
          "focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20",
          "transition-all duration-200 w-60",
          className
        )}
      >
        <span id={descriptionId} className="sr-only">
          {effectivePlaceholder}
        </span>
        <span className="flex items-center justify-center w-9 h-full shrink-0" aria-hidden="true">
          <Icon symbol="search" className="w-5 h-5 text-on-surface-variant" />
        </span>
        <input
          id={searchId}
          ref={inputRef}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          placeholder={effectivePlaceholder}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-describedby={descriptionId}
          aria-label={t("searchPlaceholder")}
          className={cn(
            "flex-1 min-w-0 h-full pr-2 text-body-medium bg-transparent",
            "text-on-surface placeholder:text-on-surface-variant/70 outline-none"
          )}
        />
        {localValue && (
          <button
            onClick={handleClear}
            className={cn(
              "flex items-center justify-center w-8 h-full shrink-0",
              "hover:bg-on-surface/8 transition-colors rounded-r"
            )}
            aria-label={t("clearSearch")}
          >
            <Icon symbol="close" className="w-4 h-4 text-on-surface-variant" />
          </button>
        )}
      </div>
    </>
  );
}

// ─── MOBILE SEARCH OVERLAY ──────────────────────────────────────────────────

interface MobileSearchOverlayProps {
  /** Whether the overlay is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Placeholder text - if not provided, uses i18n default */
  placeholder?: string;
}

/**
 * Full-screen search overlay for mobile devices.
 * Based on the dataflow-extract ReviewHeader pattern.
 */
export function MobileSearchOverlay({
  isOpen,
  onClose,
  placeholder,
}: MobileSearchOverlayProps) {
  const { t } = useI18n();
  const { searchText, setSearch } = useFiltering();
  const effectivePlaceholder = placeholder ?? t("searchPlaceholder");
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    },
    [handleClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 bg-surface z-50 flex items-center px-2",
        "animate-in fade-in slide-in-from-top-2 duration-200"
      )}
    >
      <div className="flex-1 max-w-2xl mx-auto flex items-center gap-2 w-full">
        <Icon
          symbol="search"
          className="w-5 h-5 text-on-surface-variant ml-2 shrink-0"
        />
        <input
          ref={inputRef}
          autoFocus
          type="text"
          inputMode="search"
          enterKeyHint="search"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={effectivePlaceholder}
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
              {t("clear")}
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
