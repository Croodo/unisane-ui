"use client";

import React, { createContext, forwardRef, useContext, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

// Context for managing radio group state
interface RadioGroupContextValue {
  value: string;
  onChange: (value: string) => void;
  name: string;
  disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

const radioGroupVariants = cva("flex", {
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

// RadioGroup Root
interface RadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
    VariantProps<typeof radioGroupVariants> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name: string;
  disabled?: boolean;
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      value: controlledValue,
      defaultValue = "",
      onValueChange,
      name,
      disabled = false,
      orientation = "vertical",
      gap = "md",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState<string>(defaultValue);
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    const handleChange = (newValue: string) => {
      if (disabled) return;
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    };

    return (
      <RadioGroupContext.Provider value={{ value, onChange: handleChange, name, disabled }}>
        <div
          ref={ref}
          role="radiogroup"
          className={cn(radioGroupVariants({ orientation, gap }), className)}
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    );
  }
);

RadioGroup.displayName = "RadioGroup";

// RadioGroupItem (enhanced Radio with label)
const radioIndicatorVariants = cva(
  "w-5u h-5u rounded-full border-2 transition-all duration-short peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-primary peer-focus-visible:outline-offset-2",
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

interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  value: string;
  label?: string;
  description?: string;
}

export const RadioGroupItem = forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ value: itemValue, label, description, disabled: itemDisabled, className, ...props }, ref) => {
    const context = useContext(RadioGroupContext);

    if (!context) {
      throw new Error("RadioGroupItem must be used within RadioGroup");
    }

    const { value, onChange, name, disabled: groupDisabled } = context;
    const disabled = itemDisabled || groupDisabled;
    const isChecked = value === itemValue;
    const id = `${name}-${itemValue}`;

    return (
      <div className={cn("flex items-start gap-3u", className)}>
        <div className="relative flex items-center justify-center pt-0.5u">
          <input
            ref={ref}
            type="radio"
            id={id}
            name={name}
            value={itemValue}
            checked={isChecked}
            disabled={disabled}
            onChange={() => onChange(itemValue)}
            className="peer sr-only"
            {...props}
          />
          <div className={radioIndicatorVariants({ checked: isChecked, disabled })}>
            {isChecked && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2.5u h-2.5u rounded-full bg-on-primary" />
              </div>
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

RadioGroupItem.displayName = "RadioGroupItem";