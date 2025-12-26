"use client";

import React, { createContext, forwardRef, useContext, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Ripple } from "./ripple";

// Context for managing toggle group state
interface ToggleGroupContextValue {
  value: string | string[];
  onChange: (value: string) => void;
  type: "single" | "multiple";
  disabled?: boolean;
}

const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null);

const toggleGroupVariants = cva("inline-flex", {
  variants: {
    orientation: {
      horizontal: "flex-row",
      vertical: "flex-col",
    },
    size: {
      sm: "gap-1u",
      md: "gap-2u",
      lg: "gap-3u",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
    size: "md",
  },
});

// ToggleGroup Root
interface ToggleGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
    VariantProps<typeof toggleGroupVariants> {
  type?: "single" | "multiple";
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  disabled?: boolean;
}

export const ToggleGroup = forwardRef<HTMLDivElement, ToggleGroupProps>(
  (
    {
      type = "single",
      value: controlledValue,
      defaultValue,
      onValueChange,
      disabled = false,
      orientation = "horizontal",
      size = "md",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState<string | string[]>(
      defaultValue || (type === "single" ? "" : [])
    );

    const value = controlledValue !== undefined ? controlledValue : internalValue;

    const handleChange = (itemValue: string) => {
      if (disabled) return;

      let newValue: string | string[];

      if (type === "single") {
        newValue = value === itemValue ? "" : itemValue;
      } else {
        const currentArray = Array.isArray(value) ? value : [];
        newValue = currentArray.includes(itemValue)
          ? currentArray.filter((v) => v !== itemValue)
          : [...currentArray, itemValue];
      }

      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    };

    return (
      <ToggleGroupContext.Provider value={{ value, onChange: handleChange, type, disabled }}>
        <div
          ref={ref}
          role="group"
          className={cn(toggleGroupVariants({ orientation, size }), className)}
          {...props}
        >
          {children}
        </div>
      </ToggleGroupContext.Provider>
    );
  }
);

ToggleGroup.displayName = "ToggleGroup";

// ToggleGroupItem
const toggleGroupItemVariants = cva(
  "relative overflow-hidden inline-flex items-center justify-center gap-2u px-6u h-10u rounded-sm text-label-large font-medium transition-all duration-short border border-outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 select-none",
  {
    variants: {
      selected: {
        true: "bg-secondary-container text-on-secondary-container border-secondary",
        false: "bg-surface text-on-surface hover:bg-on-surface/8",
      },
      disabled: {
        true: "opacity-38 pointer-events-none cursor-not-allowed",
        false: "cursor-pointer",
      },
    },
    defaultVariants: {
      selected: false,
      disabled: false,
    },
  }
);

interface ToggleGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  ariaLabel?: string;
}

export const ToggleGroupItem = forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ value: itemValue, ariaLabel, children, className, disabled: itemDisabled, ...props }, ref) => {
    const context = useContext(ToggleGroupContext);

    if (!context) {
      throw new Error("ToggleGroupItem must be used within ToggleGroup");
    }

    const { value, onChange, type, disabled: groupDisabled } = context;
    const disabled = itemDisabled || groupDisabled;

    const isSelected =
      type === "single" ? value === itemValue : Array.isArray(value) && value.includes(itemValue);

    return (
      <button
        ref={ref}
        type="button"
        role={type === "single" ? "radio" : "checkbox"}
        aria-checked={isSelected}
        aria-label={ariaLabel}
        disabled={disabled}
        data-state={isSelected ? "on" : "off"}
        className={cn(toggleGroupItemVariants({ selected: isSelected, disabled }), className)}
        onClick={() => onChange(itemValue)}
        {...props}
      >
        <Ripple disabled={disabled} />
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);

ToggleGroupItem.displayName = "ToggleGroupItem";