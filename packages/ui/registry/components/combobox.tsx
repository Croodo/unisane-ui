"use client";

import React, { useState, useRef, useEffect } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@ui/lib/utils";
import { Surface } from "@ui/primitives/surface";
import { Text } from "@ui/primitives/text";
import { Icon } from "@ui/primitives/icon";
import { StateLayer } from "@ui/primitives/state-layer";

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
  const comboboxRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        comboboxRef.current &&
        !comboboxRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelect = (option: ComboboxOption) => {
    if (option.disabled) return;
    onChange?.(option.value);
    setSearchValue("");
    setIsOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    setSearchValue(newValue);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div className={cn(comboboxVariants({ className }))} ref={comboboxRef}>
      {label && (
        <Text
          variant="labelMedium"
          className="mb-2u block text-on-surface-variant font-medium opacity-70"
        >
          {label}
        </Text>
      )}

      <Surface
        tone="surface"
        className={cn(
          "relative w-full rounded-sm border-2 border-outline-variant/30 h-14u transition-all",
          isOpen && "border-primary ring-1 ring-primary/30",
          disabled && "opacity-38 cursor-not-allowed"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <StateLayer />

        <div className="flex items-center gap-2u px-4u h-full">
          {searchable ? (
            <input
              type="text"
              value={
                searchValue || (selectedOption ? selectedOption.label : "")
              }
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className="flex-1 bg-transparent outline-none text-body-large text-on-surface placeholder-on-surface-variant/40"
              onClick={(e) => e.stopPropagation()}
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
          />
        </div>
      </Surface>

      {isOpen && !disabled && (
        <Surface
          tone="surface"
          elevation={3}
          className="absolute top-[calc(100%+var(--unit))] left-0 right-0 rounded-sm border border-outline-variant/30 z-50 max-h-60 overflow-y-auto bg-surface-container-high shadow-4"
        >
          <div className="py-2u">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "relative px-4u py-3u cursor-pointer flex items-center gap-3u transition-colors",
                    "hover:bg-on-surface/8",
                    value === option.value && "bg-primary/10",
                    option.disabled && "opacity-38 cursor-not-allowed"
                  )}
                  onClick={() => handleSelect(option)}
                >
                  <StateLayer />

                  <Text
                    variant="bodyMedium"
                    className={cn(
                      "font-medium",
                      value === option.value ? "text-primary" : "text-on-surface",
                      option.disabled && "text-on-surface-variant"
                    )}
                  >
                    {option.label}
                  </Text>
                  
                  {value === option.value && (
                    <Icon symbol="check" size="xs" className="text-primary ml-auto" />
                  )}
                </div>
              ))
            ) : (
              <div className="px-4u py-3u">
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
