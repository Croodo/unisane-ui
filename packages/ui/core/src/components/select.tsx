"use client";

import React, { useState, useRef, useEffect, useId, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@ui/lib/utils";
import { Icon } from "@ui/primitives/icon";

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
  /** Use portal to render dropdown outside DOM hierarchy (escapes overflow:hidden) */
  portal?: boolean;
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
  portal = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const listboxId = useId();
  const labelId = useId();
  const triggerId = useId();

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedLabel = options[selectedIndex]?.label;
  const displayLabel = selectedLabel || (!label ? placeholder : "");

  // Calculate dropdown position for portal mode
  const updateDropdownPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + 4, // 4px gap
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (portal && isOpen) {
      updateDropdownPosition();
      window.addEventListener("scroll", updateDropdownPosition, true);
      window.addEventListener("resize", updateDropdownPosition);
      return () => {
        window.removeEventListener("scroll", updateDropdownPosition, true);
        window.removeEventListener("resize", updateDropdownPosition);
      };
    }
  }, [portal, isOpen, updateDropdownPosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideContainer = containerRef.current && !containerRef.current.contains(target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);

      if (portal) {
        // In portal mode, check both container and dropdown
        if (isOutsideContainer && isOutsideDropdown) {
          setIsOpen(false);
        }
      } else {
        // In non-portal mode, just check container
        if (isOutsideContainer) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [portal]);

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
      className={cn("relative inline-flex flex-col w-full min-w-40", className)}
    >
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          "relative flex items-center w-full transition-colors cursor-pointer select-none group h-10",
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
              ? "border-primary! border-2"
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
              "absolute bottom-[calc(var(--unit)*-0.25)] left-0 right-0 h-0.5 scale-x-0 transition-transform duration-snappy ease-out origin-center",
              error ? "bg-error scale-x-100" : "bg-primary",
              isOpen && "scale-x-100"
            )}
          />
        )}

        <div className="relative w-full h-full flex items-center px-4">
            <span
              className={cn(
              "text-on-surface text-body-large font-medium w-full truncate",
              variant === "filled" && "pt-4 pb-0.5"
            )}
            >
              {displayLabel}
            </span>

          {label && (
            <label
              htmlFor={triggerId}
              id={labelId}
              className={cn(
                "absolute pointer-events-none truncate max-w-[calc(100%-calc(var(--unit)*12))] transition-all duration-snappy ease-emphasized origin-left left-4",
                !isFloating &&
                  "text-body-medium -translate-y-1/2 top-1/2 text-on-surface-variant",
                isFloating && [
                  "text-label-small font-medium",
                  variant === "outlined" && [
                    "top-0 -translate-y-1/2 bg-surface px-1 -ml-1",
                    labelClassName ? labelClassName : "bg-surface",
                  ],
                  variant === "filled" && "top-1 translate-y-0",
                  error ? "text-error" : "text-primary",
                ],
                !value && isOpen && "text-primary"
              )}
            >
              {label}
            </label>
          )}

          <div className="absolute right-3 text-on-surface-variant">
            <Icon
              symbol="keyboard_arrow_down"
              size="sm"
              className={cn(
                "transition-transform duration-snappy",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </div>
      </button>

      {isOpen && !disabled && !portal && (
        <div
          ref={dropdownRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={label ? labelId : undefined}
          className="absolute top-[calc(100%+var(--unit))] left-0 w-full bg-surface border border-outline-variant rounded-sm shadow-2 py-1 max-h-70 overflow-y-auto z-100 animate-in fade-in zoom-in-95 duration-snappy"
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
                    "px-4 h-12 flex items-center text-body-large font-medium cursor-pointer transition-colors",
                    isHighlighted && !isDisabled && "bg-surface-container-high",
                    value === option.value
                      ? "bg-primary/8 text-primary"
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
            <div className="px-4 py-3 text-label-medium text-on-surface-variant font-medium">
              No Options Available
            </div>
          )}
        </div>
      )}

      {/* Portal mode dropdown */}
      {isOpen && !disabled && portal && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={label ? labelId : undefined}
            className="fixed bg-surface border border-outline-variant rounded-sm shadow-2 py-1 max-h-70 overflow-y-auto z-9999 animate-in fade-in zoom-in-95 duration-snappy"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
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
                      "px-4 h-12 flex items-center text-body-large font-medium cursor-pointer transition-colors",
                      isHighlighted && !isDisabled && "bg-surface-container-high",
                      value === option.value
                        ? "bg-primary/8 text-primary"
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
              <div className="px-4 py-3 text-label-medium text-on-surface-variant font-medium">
                No Options Available
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};
