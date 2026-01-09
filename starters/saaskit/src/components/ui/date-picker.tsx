"use client";

import React, { useState, useRef, useEffect, useId, useCallback } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";
import { Calendar } from "./calendar";
import { DateInput } from "./date-input";

// ─── M3 DOCKED DATE PICKER (HeroUI-STYLE SEGMENTS) ───────────────────────────
// Combines HeroUI's segment-based input with Material Design 3 styling
// - Each date unit (month, day, year) is individually focusable and editable
// - Calendar popover for visual date selection
// - Full keyboard navigation support

const datePickerVariants = cva("relative w-full", {
  variants: {
    variant: {
      outlined: "",
      filled: "",
    },
  },
  defaultVariants: {
    variant: "outlined",
  },
});

export type DatePickerProps = VariantProps<typeof datePickerVariants> & {
  /** The selected date value */
  value?: Date;
  /** Callback when date changes */
  onChange?: (date: Date | undefined) => void;
  /** Label text for the input field */
  label?: string;
  /** Whether the date picker is disabled */
  disabled?: boolean;
  /** Whether to show error state */
  error?: boolean;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Additional class name */
  className?: string;
  /** Minimum selectable date */
  min?: Date;
  /** Maximum selectable date */
  max?: Date;
  /** Background color class for the label (outlined variant) */
  labelBg?: string;
  /** Whether to show the calendar button */
  showCalendarButton?: boolean;
};

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label = "Date",
  disabled = false,
  error = false,
  helperText,
  className,
  variant = "outlined",
  min,
  max,
  labelBg,
  showCalendarButton = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  // Handle date selection from calendar
  const handleDateSelect = useCallback((date: Date) => {
    onChange?.(date);
    setIsOpen(false);
  }, [onChange]);

  // Calendar toggle button handler
  const handleCalendarButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  }, [disabled]);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  // Calendar button icon
  const calendarButton = showCalendarButton ? (
    <button
      type="button"
      disabled={disabled}
      onClick={handleCalendarButtonClick}
      aria-label="Open calendar"
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      aria-controls={popoverId}
      tabIndex={-1}
      className={cn(
        "p-1 -mr-1 rounded-full transition-colors",
        "hover:bg-on-surface/8 focus-visible:bg-on-surface/8 focus-visible:outline-none",
        error ? "text-error" : "text-on-surface-variant"
      )}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
      </svg>
    </button>
  ) : undefined;

  return (
    <div className={cn(datePickerVariants({ variant, className }))} ref={containerRef}>
      <DateInput
        value={value}
        onChange={onChange}
        label={label}
        disabled={disabled}
        error={error}
        helperText={helperText}
        variant={variant}
        min={min}
        max={max}
        labelBg={labelBg}
        trailingIcon={calendarButton}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      {/* Dropdown calendar */}
      {isOpen && (
        <div
          ref={calendarRef}
          id={popoverId}
          role="dialog"
          aria-modal="true"
          aria-label="Choose date"
          className={cn(
            "absolute z-modal top-[calc(100%+8px)] left-0",
            "animate-in fade-in zoom-in-95 duration-short ease-standard"
          )}
        >
          <Calendar
            selectedDate={value}
            onDateSelect={handleDateSelect}
            min={min}
            max={max}
          />
        </div>
      )}
    </div>
  );
};

DatePicker.displayName = "DatePicker";
