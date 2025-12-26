"use client";

import React, { createContext, forwardRef, useContext, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

// Context for managing checkbox group state
interface CheckboxGroupContextValue {
  value: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(null);

const checkboxGroupVariants = cva("flex", {
  variants: {
    orientation: {
      horizontal: "flex-row flex-wrap",
      vertical: "flex-col",
    },
    gap: {
      sm: "gap-2u",
      md: "gap-4u",
      lg: "gap-6u",
    },
  },
  defaultVariants: {
    orientation: "vertical",
    gap: "md",
  },
});

// CheckboxGroup Root
interface CheckboxGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
    VariantProps<typeof checkboxGroupVariants> {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  disabled?: boolean;
}

export const CheckboxGroup = forwardRef<HTMLDivElement, CheckboxGroupProps>(
  (
    {
      value: controlledValue,
      defaultValue = [],
      onValueChange,
      disabled = false,
      orientation = "vertical",
      gap = "md",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState<string[]>(defaultValue);
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    const handleChange = (itemValue: string) => {
      if (disabled) return;

      const newValue = value.includes(itemValue)
        ? value.filter((v) => v !== itemValue)
        : [...value, itemValue];

      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    };

    return (
      <CheckboxGroupContext.Provider value={{ value, onChange: handleChange, disabled }}>
        <div
          ref={ref}
          role="group"
          className={cn(checkboxGroupVariants({ orientation, gap }), className)}
          {...props}
        >
          {children}
        </div>
      </CheckboxGroupContext.Provider>
    );
  }
);

CheckboxGroup.displayName = "CheckboxGroup";

// CheckboxGroupItem (enhanced Checkbox with label)
const checkboxIndicatorVariants = cva(
  "w-4.5u h-4.5u rounded-sm border-2 transition-all duration-short peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-primary peer-focus-visible:outline-offset-2",
  {
    variants: {
      checked: {
        true: "border-primary bg-primary",
        false: "border-on-surface-variant hover:border-on-surface",
      },
      disabled: {
        true: "opacity-38 cursor-not-allowed",
        false: "cursor-pointer",
      },
    },
    defaultVariants: {
      checked: false,
      disabled: false,
    },
  }
);

interface CheckboxGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  value: string;
  label?: string;
  description?: string;
}

export const CheckboxGroupItem = forwardRef<HTMLInputElement, CheckboxGroupItemProps>(
  ({ value: itemValue, label, description, disabled: itemDisabled, className, ...props }, ref) => {
    const context = useContext(CheckboxGroupContext);

    if (!context) {
      throw new Error("CheckboxGroupItem must be used within CheckboxGroup");
    }

    const { value, onChange, disabled: groupDisabled } = context;
    const disabled = itemDisabled || groupDisabled;
    const isChecked = value.includes(itemValue);
    const id = `checkbox-${itemValue}`;

    return (
      <div className={cn("flex items-start gap-3u", className)}>
        <div className="relative flex items-center justify-center pt-0.5u">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            value={itemValue}
            checked={isChecked}
            disabled={disabled}
            onChange={() => onChange(itemValue)}
            className="peer sr-only"
            {...props}
          />
          <div className={checkboxIndicatorVariants({ checked: isChecked, disabled })}>
            {isChecked && (
              <svg
                className="w-full h-full text-on-primary"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14.25 5.25L7.5 12L3.75 8.25"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>

        <label
          htmlFor={id}
          className={cn(
            "flex-1 cursor-pointer select-none",
            disabled && "opacity-38 cursor-not-allowed"
          )}
        >
          {label && (
            <div className="text-body-large text-on-surface font-medium">
              {label}
            </div>
          )}
          {description && (
            <div className="text-body-medium text-on-surface-variant mt-0.5u">
              {description}
            </div>
          )}
        </label>
      </div>
    );
  }
);

CheckboxGroupItem.displayName = "CheckboxGroupItem";