"use client";

import React, { useState, useRef, useEffect, useCallback, useId, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@ui/lib/utils";
import { Surface } from "@ui/primitives/surface";
import { Text } from "@ui/primitives/text";
import { Icon } from "@ui/primitives/icon";
import { Ripple } from "./ripple";

const comboboxVariants = cva("relative w-full", {
  variants: {
    variant: {
      default: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type ComboboxOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type ComboboxProps = VariantProps<typeof comboboxVariants> & {
  value?: string;
  onChange?: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
};

export const Combobox = forwardRef<HTMLDivElement, ComboboxProps>(
  (
    {
      value,
      onChange,
      options,
      placeholder = "Search or select...",
      label,
      disabled = false,
      searchable = true,
      className,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const comboboxRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const blurTimeoutRef = useRef<number | null>(null);
    const listboxId = useId();
    const inputId = useId();

    // Merge refs
    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        comboboxRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    // Cleanup blur timeout on unmount
    useEffect(() => {
      return () => {
        if (blurTimeoutRef.current) {
          clearTimeout(blurTimeoutRef.current);
        }
      };
    }, []);

    const selectedOption = options.find((opt) => opt.value === value);

    const filteredOptions = options.filter((option) =>
      option.label.toLowerCase().includes(searchValue.toLowerCase())
    );

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          comboboxRef.current &&
          !comboboxRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setActiveIndex(-1);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
      if (!isOpen) {
        setActiveIndex(-1);
      }
    }, [isOpen]);

    const handleSelect = useCallback((option: ComboboxOption) => {
      if (option.disabled) return;
      // Clear any pending blur timeout since we're selecting
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
      onChange?.(option.value);
      setSearchValue("");
      setIsSearching(false);
      setIsOpen(false);
      setActiveIndex(-1);
    }, [onChange]);

    const handleInputChange = (newValue: string) => {
      setSearchValue(newValue);
      setIsSearching(true);
      setActiveIndex(-1);
      if (!isOpen) setIsOpen(true);
    };

    const handleBlur = useCallback(() => {
      // Clear any existing timeout
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
      // Use requestAnimationFrame + setTimeout for more reliable timing
      blurTimeoutRef.current = window.setTimeout(() => {
        if (!comboboxRef.current?.contains(document.activeElement)) {
          setIsSearching(false);
          setSearchValue("");
        }
      }, 100);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setActiveIndex((prev) => {
              const nextIndex = prev + 1;
              return nextIndex < filteredOptions.length ? nextIndex : 0;
            });
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (isOpen) {
            setActiveIndex((prev) => {
              const nextIndex = prev - 1;
              return nextIndex >= 0 ? nextIndex : filteredOptions.length - 1;
            });
          }
          break;
        case "Enter":
          e.preventDefault();
          if (isOpen && activeIndex >= 0 && filteredOptions[activeIndex]) {
            handleSelect(filteredOptions[activeIndex]);
          } else if (!isOpen) {
            setIsOpen(true);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setActiveIndex(-1);
          break;
        case "Home":
          if (isOpen) {
            e.preventDefault();
            setActiveIndex(0);
          }
          break;
        case "End":
          if (isOpen) {
            e.preventDefault();
            setActiveIndex(filteredOptions.length - 1);
          }
          break;
      }
    }, [disabled, isOpen, activeIndex, filteredOptions, handleSelect]);

    return (
      <div className={cn(comboboxVariants({ className }))} ref={setRefs}>
        {label && (
          <Text
            as="label"
            htmlFor={inputId}
            variant="labelMedium"
            className="mb-2 block text-on-surface-variant font-medium"
          >
            {label}
          </Text>
        )}

        <Surface
          tone="surfaceContainerHighest"
          className={cn(
            "relative w-full rounded-sm border border-outline h-14 transition-all",
            isOpen && "border-primary ring-2 ring-primary/20",
            disabled && "opacity-38 cursor-not-allowed",
            !searchable && "cursor-pointer"
          )}
          onClick={() => {
            if (!disabled && !searchable) {
              setIsOpen(!isOpen);
            }
          }}
          onKeyDown={!searchable ? handleKeyDown : undefined}
          role={!searchable ? "combobox" : undefined}
          aria-expanded={!searchable ? isOpen : undefined}
          aria-haspopup={!searchable ? "listbox" : undefined}
          aria-controls={!searchable ? listboxId : undefined}
          aria-activedescendant={!searchable && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          tabIndex={!searchable && !disabled ? 0 : -1}
        >
          {!searchable && <Ripple disabled={disabled} />}

          <div className="flex items-center gap-2 px-4 h-full">
            {searchable ? (
              <input
                ref={inputRef}
                id={inputId}
                type="text"
                value={
                  isSearching ? searchValue : (selectedOption ? selectedOption.label : "")
                }
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (!disabled) {
                    setIsOpen(true);
                    setIsSearching(true);
                    setSearchValue("");
                  }
                }}
                onBlur={handleBlur}
                placeholder={placeholder}
                disabled={disabled}
                className="flex-1 bg-transparent outline-none text-body-large text-on-surface placeholder:text-on-surface-variant/60 cursor-text"
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-controls={listboxId}
                aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
                aria-autocomplete="list"
              />
            ) : (
              <Text
                variant="bodyLarge"
                className={cn(!selectedOption && "text-on-surface-variant/40")}
              >
                {selectedOption ? selectedOption.label : placeholder}
              </Text>
            )}

            <Icon
              symbol="arrow_drop_down"
              size="sm"
              className={cn(
                "text-on-surface-variant transition-transform duration-short ease-standard cursor-pointer",
                isOpen && "rotate-180"
              )}
              aria-hidden="true"
              onClick={() => {
                if (!disabled) {
                  setIsOpen(!isOpen);
                  if (searchable && inputRef.current) {
                    inputRef.current.focus();
                  }
                }
              }}
            />
          </div>
        </Surface>

        {isOpen && !disabled && (
          <Surface
            tone="surfaceContainerLow"
            elevation={2}
            className="absolute top-[calc(100%+var(--unit))] left-0 right-0 rounded-lg border border-outline-variant/50 z-50 max-h-60 overflow-y-auto"
            role="listbox"
            id={listboxId}
            aria-label={label || "Options"}
          >
            <div className="py-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <div
                    key={option.value}
                    id={`${listboxId}-option-${index}`}
                    className={cn(
                      "relative px-4 h-12 cursor-pointer flex items-center gap-3 transition-colors",
                      "hover:bg-on-surface/8",
                      value === option.value && "bg-secondary-container",
                      activeIndex === index && value !== option.value && "bg-on-surface/8",
                      option.disabled && "opacity-38 cursor-not-allowed"
                    )}
                    onClick={() => handleSelect(option)}
                    role="option"
                    aria-selected={value === option.value}
                    aria-disabled={option.disabled}
                  >
                    <Ripple disabled={option.disabled} />

                    <Text
                      variant="bodyLarge"
                      className={cn(
                        "relative z-10",
                        value === option.value ? "text-on-secondary-container font-semibold" : "text-on-surface font-medium",
                        option.disabled && "text-on-surface-variant"
                      )}
                    >
                      {option.label}
                    </Text>

                    {value === option.value && (
                      <Icon symbol="check" size="xs" className="text-on-secondary-container ml-auto relative z-10" aria-hidden="true" />
                    )}
                  </div>
                ))
              ) : (
                <div className="px-4 py-3" role="option" aria-disabled="true">
                  <Text variant="bodyMedium" className="text-on-surface-variant italic">
                    No matching records
                  </Text>
                </div>
              )}
            </div>
          </Surface>
        )}
      </div>
    );
  }
);

Combobox.displayName = "Combobox";
