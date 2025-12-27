"use client";

import React, { useState, useRef, useEffect, useCallback, useId } from "react";
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

export const Combobox: React.FC<ComboboxProps> = ({
  value,
  onChange,
  options,
  placeholder = "Search or select...",
  label,
  disabled = false,
  searchable = true,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const comboboxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const inputId = useId();

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
    onChange?.(option.value);
    setSearchValue("");
    setIsOpen(false);
    setActiveIndex(-1);
  }, [onChange]);

  const handleInputChange = (newValue: string) => {
    setSearchValue(newValue);
    setActiveIndex(-1);
    if (!isOpen) setIsOpen(true);
  };

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
    <div className={cn(comboboxVariants({ className }))} ref={comboboxRef}>
      {label && (
        <Text
          as="label"
          htmlFor={inputId}
          variant="labelMedium"
          className="mb-2u block text-on-surface-variant font-medium opacity-70"
        >
          {label}
        </Text>
      )}

      <Surface
        tone="surface"
        className={cn(
          "relative w-full rounded-sm border-2 border-outline-variant/30 h-14u transition-all cursor-pointer",
          isOpen && "border-primary ring-1 ring-primary/30",
          disabled && "opacity-38 cursor-not-allowed"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
        tabIndex={searchable ? -1 : (disabled ? -1 : 0)}
      >
        <Ripple disabled={disabled} />

        <div className="flex items-center gap-2u px-4u h-full">
          {searchable ? (
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              value={
                searchValue || (selectedOption ? selectedOption.label : "")
              }
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => !disabled && setIsOpen(true)}
              placeholder={placeholder}
              disabled={disabled}
              className="flex-1 bg-transparent outline-none text-body-large text-on-surface placeholder-on-surface-variant/40"
              onClick={(e) => e.stopPropagation()}
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
              "text-on-surface-variant transition-transform duration-short ease-standard",
              isOpen && "rotate-180"
            )}
            aria-hidden="true"
          />
        </div>
      </Surface>

      {isOpen && !disabled && (
        <Surface
          tone="surface"
          elevation={3}
          className="absolute top-[calc(100%+var(--unit))] left-0 right-0 rounded-sm border border-outline-variant/30 z-50 max-h-60 overflow-y-auto bg-surface-container-high shadow-4"
          role="listbox"
          id={listboxId}
          aria-label={label || "Options"}
        >
          <div className="py-2u">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  id={`${listboxId}-option-${index}`}
                  className={cn(
                    "relative px-4u py-3u cursor-pointer flex items-center gap-3u transition-colors",
                    "hover:bg-on-surface/8",
                    value === option.value && "bg-primary/10",
                    activeIndex === index && "bg-on-surface/8",
                    option.disabled && "opacity-38 cursor-not-allowed"
                  )}
                  onClick={() => handleSelect(option)}
                  role="option"
                  aria-selected={value === option.value}
                  aria-disabled={option.disabled}
                >
                  <Ripple disabled={option.disabled} />

                  <Text
                    variant="bodyMedium"
                    className={cn(
                      "font-medium relative z-10",
                      value === option.value ? "text-primary" : "text-on-surface",
                      option.disabled && "text-on-surface-variant"
                    )}
                  >
                    {option.label}
                  </Text>

                  {value === option.value && (
                    <Icon symbol="check" size="xs" className="text-primary ml-auto relative z-10" aria-hidden="true" />
                  )}
                </div>
              ))
            ) : (
              <div className="px-4u py-3u" role="option" aria-disabled="true">
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
};
