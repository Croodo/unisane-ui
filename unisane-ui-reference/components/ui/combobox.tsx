"use client";

import React, { useState, useRef, useEffect } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { useDebounce } from "../../hooks/use-debounce";
import { stateLayers } from "../../utils/state-layers";

interface ComboboxOption {
  value: string;
  label: string;
}

const comboboxOptionVariants = cva(
  `w-full flex items-center justify-between px-4u h-12u text-body-medium text-left transition-colors duration-short ${stateLayers.hover}`,
  {
    variants: {
      selected: {
        true: "bg-secondary-container text-on-secondary-container",
        false: "text-on-surface",
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
);

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const Combobox = ({
  options,
  value,
  onChange,
  placeholder = "Search...",
  className,
}: ComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className={cn("relative", className)}>
      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={open ? search : selectedOption?.label || ""}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full h-12u px-4u pr-10u bg-surface-container-highest border border-outline rounded-sm text-body-large text-on-surface outline-none focus:border-primary transition-colors"
        />
        <button
          onClick={() => setOpen(!open)}
          className="absolute right-2u top-1/2 -translate-y-1/2 w-6u h-6u flex items-center justify-center text-on-surface-variant"
        >
          <span className="material-symbols-outlined w-5u h-5u">
            {open ? "expand_less" : "expand_more"}
          </span>
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          ref={listRef}
          className="absolute top-full left-0 right-0 mt-1u bg-surface-container rounded-sm shadow-2 max-h-75u overflow-y-auto py-2u z-popover animate-in fade-in zoom-in-95 duration-short"
        >
          {filteredOptions.length === 0 ? (
            <div className="px-4u py-3u text-body-medium text-on-surface-variant text-center">
              No results found
            </div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setSearch("");
                  setOpen(false);
                }}
                className={comboboxOptionVariants({ selected: value === option.value })}
              >
                <span>{option.label}</span>
                {value === option.value && (
                  <span className="material-symbols-outlined w-5u h-5u">check</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};