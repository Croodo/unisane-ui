"use client";

import React, { useState, useRef, useEffect, useId, useCallback } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@ui/lib/utils";

// ─── SEGMENT-BASED DATE INPUT ────────────────────────────────────────────────
// HeroUI-style segment-based date input with M3 styling
// Each date unit (month, day, year) is an individually focusable and editable segment

const dateInputVariants = cva("relative w-full", {
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

const inputContainerVariants = cva(
  "relative flex w-full transition-all duration-snappy ease-emphasized group cursor-text",
  {
    variants: {
      variant: {
        outlined:
          "rounded-sm border border-outline-variant bg-surface hover:border-outline focus-within:border-primary! focus-within:ring-1 focus-within:ring-primary/20",
        filled:
          "rounded-t-sm rounded-b-none border-b border-outline-variant bg-surface-container-low hover:bg-surface-container focus-within:bg-surface",
      },
      error: {
        true: "border-error focus-within:border-error hover:border-error ring-error/20",
      },
      disabled: {
        true: "opacity-38 cursor-not-allowed pointer-events-none",
      },
    },
    defaultVariants: {
      variant: "outlined",
      error: false,
    },
  }
);

type DateSegment = "month" | "day" | "year";

interface DateSegmentValue {
  month: number | null;
  day: number | null;
  year: number | null;
}

export type DateInputProps = VariantProps<typeof dateInputVariants> & {
  /** The selected date value */
  value?: Date;
  /** Callback when date changes */
  onChange?: (date: Date | undefined) => void;
  /** Label text for the input field */
  label?: string;
  /** Whether the date input is disabled */
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
  /** Trailing icon/element */
  trailingIcon?: React.ReactNode;
  /** Called when a segment receives focus */
  onFocus?: () => void;
  /** Called when all segments lose focus */
  onBlur?: () => void;
  /** Custom ID for the input */
  id?: string;
};

// Get max days for a given month/year
const getMaxDays = (month: number | null, year: number | null): number => {
  if (month === null) return 31;
  const y = year ?? 2024; // Use leap year as default
  return new Date(y, month, 0).getDate();
};

// Segment component
interface SegmentProps {
  type: DateSegment;
  value: number | null;
  onChange: (value: number | null) => void;
  onNext: () => void;
  onPrev: () => void;
  disabled?: boolean;
  placeholder: string;
  min?: number;
  max?: number;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isFocused: boolean;
  onFocusChange: (focused: boolean) => void;
  id?: string;
  describedBy?: string;
}

const Segment: React.FC<SegmentProps> = ({
  type,
  value,
  onChange,
  onNext,
  onPrev,
  disabled,
  placeholder,
  min = 1,
  max,
  inputRef,
  isFocused,
  onFocusChange,
  id,
  describedBy,
}) => {
  const [enteredDigits, setEnteredDigits] = useState("");
  const maxValue = max ?? (type === "month" ? 12 : type === "day" ? 31 : 9999);
  const minValue = min;
  const digitCount = type === "year" ? 4 : 2;

  // Format display value
  const getDisplayValue = () => {
    if (isFocused && enteredDigits) {
      // Show what user is typing without padding (like HeroUI)
      return enteredDigits;
    }
    if (value !== null) {
      return value.toString().padStart(digitCount, "0");
    }
    return placeholder;
  };

  // Reset entered digits when focus changes
  useEffect(() => {
    if (!isFocused) {
      setEnteredDigits("");
    }
  }, [isFocused]);

  const commitValue = (digits: string) => {
    if (!digits) {
      onChange(null);
      return;
    }
    const numVal = parseInt(digits, 10);
    const clampedVal = Math.max(minValue, Math.min(maxValue, numVal));
    onChange(clampedVal);
    setEnteredDigits("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        setEnteredDigits("");
        if (value === null) {
          onChange(minValue);
        } else {
          onChange(value >= maxValue ? minValue : value + 1);
        }
        break;

      case "ArrowDown":
        e.preventDefault();
        setEnteredDigits("");
        if (value === null) {
          onChange(maxValue);
        } else {
          onChange(value <= minValue ? maxValue : value - 1);
        }
        break;

      case "ArrowLeft":
        e.preventDefault();
        if (enteredDigits) {
          commitValue(enteredDigits);
        }
        onPrev();
        break;

      case "ArrowRight":
        e.preventDefault();
        if (enteredDigits) {
          commitValue(enteredDigits);
        }
        onNext();
        break;

      case "Tab":
        // Commit any entered digits before tabbing
        if (enteredDigits) {
          commitValue(enteredDigits);
        }
        // Let default tab behavior work
        break;

      case "Backspace":
        e.preventDefault();
        if (enteredDigits) {
          // Remove last entered digit while typing
          setEnteredDigits(enteredDigits.slice(0, -1));
        } else if (value !== null) {
          // Convert current value to string and remove last digit
          const strVal = value.toString();
          if (strVal.length > 1) {
            // Remove last digit (e.g., 2026 -> 202)
            const newVal = parseInt(strVal.slice(0, -1), 10);
            onChange(newVal);
            // Put remaining digits into enteredDigits so user can continue editing
            setEnteredDigits(strVal.slice(0, -1));
          } else {
            // Only one digit left, clear it
            onChange(null);
          }
        } else {
          // Already empty, move to previous segment
          onPrev();
        }
        break;

      case "Delete":
        e.preventDefault();
        onChange(null);
        setEnteredDigits("");
        break;

      default:
        // Handle numeric input
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();

          // Start fresh or append
          const newDigits = enteredDigits + e.key;

          // Check if we've completed entering all digits
          if (newDigits.length >= digitCount) {
            commitValue(newDigits);
            onNext();
          } else {
            // Check if we should auto-advance (e.g., typing "5" for month)
            const numVal = parseInt(newDigits, 10);
            const multiplier = Math.pow(10, digitCount - newDigits.length);
            const minPossibleFinal = numVal * multiplier;

            if (minPossibleFinal > maxValue) {
              // Can't possibly make a valid number, commit now
              commitValue(newDigits);
              onNext();
            } else {
              // Keep building
              setEnteredDigits(newDigits);
            }
          }
        }
    }
  };

  const handleFocus = () => {
    onFocusChange(true);
    setEnteredDigits("");
  };

  const handleBlur = () => {
    // Commit any entered digits
    if (enteredDigits) {
      commitValue(enteredDigits);
    }
    onFocusChange(false);
  };

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="numeric"
      role="spinbutton"
      value={getDisplayValue()}
      onChange={() => {}} // Controlled by keydown
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled}
      className={cn(
        "bg-transparent outline-none border-none focus:ring-0 text-center caret-transparent select-none",
        "text-on-surface text-body-large font-medium tabular-nums",
        type === "year" ? "w-12" : "w-7",
        value === null && !enteredDigits && "text-on-surface-variant",
        isFocused && "bg-primary/10 rounded-xs"
      )}
      aria-label={type}
      aria-valuenow={value ?? undefined}
      aria-valuemin={minValue}
      aria-valuemax={maxValue}
      aria-describedby={describedBy}
      readOnly={disabled}
    />
  );
};

export const DateInput = React.forwardRef<HTMLDivElement, DateInputProps>(
  (
    {
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
      trailingIcon,
      onFocus,
      onBlur,
      id,
    },
    ref
  ) => {
  const generatedId = useId();
  const inputId = id || `dateinput-${generatedId}`;
  const helperId = `${inputId}-helper`;
  const containerRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  const [focusedSegment, setFocusedSegment] = useState<DateSegment | null>(null);
  const [segments, setSegments] = useState<DateSegmentValue>(() => ({
    month: value ? value.getMonth() + 1 : null,
    day: value ? value.getDate() : null,
    year: value ? value.getFullYear() : null,
  }));

  // Sync with external value
  useEffect(() => {
    if (value) {
      setSegments({
        month: value.getMonth() + 1,
        day: value.getDate(),
        year: value.getFullYear(),
      });
    } else {
      setSegments({ month: null, day: null, year: null });
    }
  }, [value]);

  // Handle focus/blur callbacks
  useEffect(() => {
    if (focusedSegment !== null) {
      onFocus?.();
    }
  }, [focusedSegment, onFocus]);

  const handleContainerBlur = useCallback((e: React.FocusEvent) => {
    // Check if focus is moving outside the container
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setFocusedSegment(null);
      onBlur?.();

      // Validate and emit date on blur
      if (segments.month !== null && segments.day !== null && segments.year !== null) {
        const date = new Date(segments.year, segments.month - 1, segments.day);
        // Validate the date is real (handles invalid dates like Feb 30)
        if (
          date.getFullYear() === segments.year &&
          date.getMonth() === segments.month - 1 &&
          date.getDate() === segments.day
        ) {
          // Check min/max constraints
          if (min && date < min) {
            onChange?.(undefined);
            return;
          }
          if (max && date > max) {
            onChange?.(undefined);
            return;
          }
          onChange?.(date);
        }
      } else if (segments.month === null && segments.day === null && segments.year === null) {
        onChange?.(undefined);
      }
    }
  }, [segments, onChange, onBlur, min, max]);

  const updateSegment = useCallback((segment: DateSegment, newValue: number | null) => {
    setSegments(prev => {
      const updated = { ...prev, [segment]: newValue };

      // Auto-correct day if it exceeds month's max days
      if (segment === "month" || segment === "year") {
        const maxDays = getMaxDays(updated.month, updated.year);
        if (updated.day !== null && updated.day > maxDays) {
          updated.day = maxDays;
        }
      }

      return updated;
    });
  }, []);

  const focusSegment = useCallback((segment: DateSegment) => {
    const ref = segment === "month" ? monthRef : segment === "day" ? dayRef : yearRef;
    ref.current?.focus();
  }, []);

  const handleContainerClick = () => {
    if (!disabled && focusedSegment === null) {
      monthRef.current?.focus();
    }
  };

  // For segment-based inputs, label is ALWAYS floated since placeholders are visible
  const isFloating = true;

  // Combine refs
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );

  return (
    <div className={cn(dateInputVariants({ variant }), className)} ref={setRefs}>
      <div className="relative inline-flex flex-col w-full">
        <div
          className={cn(
            inputContainerVariants({ variant, error, disabled }),
            "items-center h-14"
          )}
          onClick={handleContainerClick}
          onBlur={handleContainerBlur}
        >
          <div className="relative flex-1 h-full min-w-0 flex items-center px-4 gap-0.5">
            {/* Month segment */}
            <Segment
              type="month"
              value={segments.month}
              onChange={(v) => updateSegment("month", v)}
              onNext={() => focusSegment("day")}
              onPrev={() => {}}
              disabled={disabled}
              placeholder="MM"
              min={1}
              max={12}
              inputRef={monthRef}
              isFocused={focusedSegment === "month"}
              onFocusChange={(f) => setFocusedSegment(f ? "month" : null)}
              id={inputId}
              describedBy={helperText ? helperId : undefined}
            />

            <span className="text-on-surface-variant text-body-large">/</span>

            {/* Day segment */}
            <Segment
              type="day"
              value={segments.day}
              onChange={(v) => updateSegment("day", v)}
              onNext={() => focusSegment("year")}
              onPrev={() => focusSegment("month")}
              disabled={disabled}
              placeholder="DD"
              min={1}
              max={getMaxDays(segments.month, segments.year)}
              inputRef={dayRef}
              isFocused={focusedSegment === "day"}
              onFocusChange={(f) => setFocusedSegment(f ? "day" : null)}
            />

            <span className="text-on-surface-variant text-body-large">/</span>

            {/* Year segment */}
            <Segment
              type="year"
              value={segments.year}
              onChange={(v) => updateSegment("year", v)}
              onNext={() => {}}
              onPrev={() => focusSegment("day")}
              disabled={disabled}
              placeholder="YYYY"
              min={1}
              max={9999}
              inputRef={yearRef}
              isFocused={focusedSegment === "year"}
              onFocusChange={(f) => setFocusedSegment(f ? "year" : null)}
            />

            {/* Floating label */}
            <label
              htmlFor={inputId}
              className={cn(
                "absolute pointer-events-none truncate transition-all duration-medium ease-emphasized origin-left left-4",
                !isFloating && [
                  "text-body-large text-on-surface-variant",
                  "top-1/2 -translate-y-1/2",
                ],
                isFloating && [
                  "text-label-small font-medium",
                  variant === "outlined" && [
                    "top-0 -translate-y-1/2 px-1 -ml-1",
                    labelBg || "bg-surface",
                  ],
                  variant === "filled" && "top-2 translate-y-0",
                  error
                    ? "text-error"
                    : focusedSegment !== null
                      ? "text-primary"
                      : "text-on-surface-variant",
                ]
              )}
            >
              {label}
            </label>
          </div>

          {/* Trailing icon */}
          {trailingIcon && (
            <span
              className={cn(
                "pr-4 transition-colors shrink-0 flex items-center justify-center h-full",
                error ? "text-error" : "text-on-surface-variant"
              )}
            >
              <div className="size-icon-sm flex items-center justify-center">
                {trailingIcon}
              </div>
            </span>
          )}
        </div>

        {/* Helper text */}
        {helperText && (
          <span
            id={helperId}
            className={cn(
              "text-label-small mt-1.5 px-4 font-medium",
              error ? "text-error" : "text-on-surface-variant"
            )}
          >
            {helperText}
          </span>
        )}
      </div>
    </div>
  );
});

DateInput.displayName = "DateInput";
