"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  variant?: "filled" | "outlined";
  error?: boolean;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onChange,
  variant = "outlined",
  error,
  disabled,
  className,
  labelClassName,
  placeholder = "Select an option",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listboxId = useId();
  const labelId = useId();
  const triggerId = useId();

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedLabel = options[selectedIndex]?.label;
  const displayLabel = selectedLabel || (!label ? placeholder : "");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getNextEnabledIndex = (startIndex: number, direction: 1 | -1) => {
    if (!options.length) return -1;
    let index = startIndex;
    for (let i = 0; i < options.length; i += 1) {
      index = (index + direction + options.length) % options.length;
      if (!options[index]?.disabled) return index;
    }
    return -1;
  };

  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(-1);
      return;
    }

    const initialIndex =
      selectedIndex !== -1 && !options[selectedIndex]?.disabled
        ? selectedIndex
        : getNextEnabledIndex(-1, 1);
    setHighlightedIndex(initialIndex);
  }, [isOpen, options, selectedIndex]);

  const handleSelect = (val: string, isDisabled?: boolean) => {
    if (isDisabled) return;
    onChange?.(val);
    setIsOpen(false);
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) setIsOpen(true);
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const baseIndex =
        highlightedIndex !== -1
          ? highlightedIndex
          : selectedIndex !== -1
            ? selectedIndex
            : direction === 1
              ? -1
              : 0;
      setHighlightedIndex(getNextEnabledIndex(baseIndex, direction));
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      const option = options[highlightedIndex];
      if (option && !option.disabled) {
        handleSelect(option.value, option.disabled);
      }
      return;
    }

    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  const isFloating = Boolean(value) || isOpen;
  const activeDescendantId =
    highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined;

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-flex flex-col w-full min-w-[calc(var(--uni-sys-u)*40)]", className)}
    >
      <button
        id={triggerId}
        type="button"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          "relative flex items-center w-full transition-colors cursor-pointer select-none group h-14u",
          variant === "outlined"
            ? "rounded-sm border border-outline-variant bg-surface"
            : "rounded-t-sm border-b border-outline bg-surface-container-low",
          !disabled &&
            !isOpen &&
            (variant === "outlined"
              ? "hover:border-outline"
              : "hover:bg-surface-container hover:border-outline"),
          isOpen &&
            (variant === "outlined"
              ? "!border-primary border-2"
              : "bg-surface"),
          error && "border-error",
          disabled && "opacity-38 cursor-not-allowed"
        )}
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={isOpen ? activeDescendantId : undefined}
        aria-labelledby={label ? labelId : undefined}
        aria-label={!label ? placeholder : undefined}
      >
        {variant === "filled" && (
          <div
            className={cn(
              "absolute bottom-[calc(var(--uni-sys-u)*-0.25)] left-0 right-0 h-0_5u scale-x-0 transition-transform duration-snappy ease-out origin-center",
              error ? "bg-error scale-x-100" : "bg-primary",
              isOpen && "scale-x-100"
            )}
          />
        )}

        <div className="relative w-full h-full flex items-center px-4u">
            <span
              className={cn(
              "text-on-surface text-body-small font-medium w-full truncate",
              variant === "filled" && "pt-5u pb-1u"
            )}
            >
              {displayLabel}
            </span>

          {label && (
            <label
              htmlFor={triggerId}
              id={labelId}
              className={cn(
                "absolute pointer-events-none truncate max-w-[calc(100%-calc(var(--uni-sys-u)*12))] transition-all duration-snappy ease-emphasized origin-left left-4u",
                !isFloating &&
                  "text-body-medium -translate-y-1/2 top-1/2 text-on-surface-variant",
                isFloating && [
                  "text-label-small font-medium",
                  variant === "outlined" && [
                    "top-0 -translate-y-1/2 bg-surface px-1u -ml-1u",
                    labelClassName ? labelClassName : "bg-surface",
                  ],
                  variant === "filled" && "top-2u -translate-y-0",
                  error ? "text-error" : "text-primary",
                ],
                !value && isOpen && "text-primary"
              )}
            >
              {label}
            </label>
          )}

          <div className="absolute right-3u text-on-surface-variant">
            <Icon
              symbol="keyboard_arrow_down"
              size={20}
              className={cn(
                "transition-transform duration-snappy",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </div>
      </button>

      {isOpen && !disabled && (
        <div
          id={listboxId}
          role="listbox"
          aria-labelledby={label ? labelId : undefined}
          className="absolute top-[calc(100%+var(--uni-sys-u))] left-0 w-full bg-surface border border-outline-variant rounded-sm shadow-3 py-1u max-h-[calc(var(--uni-sys-u)*70)] overflow-y-auto z-[100] animate-in fade-in zoom-in-95 duration-snappy"
        >
          {options.length > 0 ? (
            options.map((option, index) => {
              const isDisabled = Boolean(option.disabled);
              const isHighlighted = index === highlightedIndex;
              return (
                <div
                  key={option.value}
                  id={`${listboxId}-option-${index}`}
                  onClick={() => handleSelect(option.value, isDisabled)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    "px-4u h-11u flex items-center text-body-small font-medium cursor-pointer transition-colors",
                    isHighlighted && !isDisabled && "bg-surface-container-high",
                    value === option.value
                      ? "bg-primary/5 text-primary"
                      : "text-on-surface hover:bg-surface-container-high",
                    isDisabled && "opacity-38 cursor-not-allowed"
                  )}
                  role="option"
                  aria-selected={value === option.value}
                  aria-disabled={isDisabled}
                >
                  {option.label}
                </div>
              );
            })
          ) : (
            <div className="px-4u py-3u text-label-medium text-on-surface-variant font-medium">
              No Options Available
            </div>
          )}
        </div>
      )}
    </div>
  );
};
