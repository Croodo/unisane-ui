import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@ui/lib/utils";
import { Ripple } from "./ripple";

interface SegmentedButtonOption {
  value: string;
  label?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedButtonProps {
  options?: SegmentedButtonOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  multiSelect?: boolean;
  className?: string;
  density?: "default" | "high";
  children?: React.ReactNode;
}

export const SegmentedButton: React.FC<SegmentedButtonProps> = ({
  options,
  value,
  onChange,
  multiSelect = false,
  className,
  density = "default",
  children,
}) => {
  if (!options || !onChange || value === undefined) {
    return (
      <div
        className={cn(
          "inline-flex max-w-full rounded-xs border border-outline-variant relative isolate overflow-hidden",
          density === "high" ? "h-8u" : "h-10u",
          className
        )}
        role="group"
      >
        {children}
      </div>
    );
  }

  const isSelected = (val: string) => {
    if (multiSelect && Array.isArray(value)) {
      return value.includes(val);
    }
    return value === val;
  };

  const handleSelect = (val: string) => {
    const option = options.find((item) => item.value === val);
    if (option?.disabled) return;

    if (multiSelect && Array.isArray(value)) {
      const newValue = value.includes(val)
        ? value.filter((item) => item !== val)
        : [...value, val];
      onChange(newValue);
      return;
    }

    onChange(val);
  };

  return (
    <div
      className={cn(
        "inline-flex max-w-full rounded-xs border border-outline-variant relative isolate overflow-hidden",
        density === "high" ? "h-8u" : "h-10u",
        className
      )}
      role={multiSelect ? "group" : "radiogroup"}
      aria-multiselectable={multiSelect}
    >
      {options.map((option, index) => {
        const selected = isSelected(option.value);
        const isLast = index === options.length - 1;

        return (
          <button
            key={option.value}
            disabled={option.disabled}
            onClick={() => handleSelect(option.value)}
            role={multiSelect ? "checkbox" : "radio"}
            aria-checked={selected}
            aria-disabled={option.disabled}
            className={cn(
              "flex-1 px-4u min-w-fit whitespace-nowrap text-label-small font-black uppercase tracking-widest flex items-center justify-center gap-2u transition-all relative focus-visible:outline-2 focus-visible:outline-primary focus-visible:z-10 select-none",
              !isLast && "border-r border-outline-variant/60",
              option.disabled &&
                "opacity-38 cursor-not-allowed bg-transparent text-on-surface",
              selected && !option.disabled
                ? "bg-secondary-container text-on-secondary-container"
                : "text-on-surface-variant bg-surface hover:bg-surface-variant/40"
            )}
          >
            <Ripple disabled={option.disabled} />
            <div
              className={cn(
                "flex items-center justify-center transition-all duration-medium ease-emphasized overflow-hidden",
                selected ? "w-4.5u opacity-100" : "w-0 opacity-0"
              )}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            {option.icon && !selected && (
              <span className="w-4.5u h-4.5u flex items-center justify-center relative z-10">
                {option.icon}
              </span>
            )}

            <span className="truncate relative z-10 leading-none">
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

const segmentedButtonItemVariants = cva(
  "flex-1 px-4u min-w-fit whitespace-nowrap text-label-small font-black uppercase tracking-widest flex items-center justify-center gap-2u transition-all relative select-none",
  {
    variants: {
      active: {
        true: "bg-secondary-container text-on-secondary-container",
        false: "text-on-surface-variant bg-surface hover:bg-surface-variant/40",
      },
      disabled: {
        true: "opacity-38 cursor-not-allowed",
        false: "cursor-pointer",
      },
    },
    defaultVariants: {
      active: false,
      disabled: false,
    },
  }
);

export type SegmentedButtonItemProps = VariantProps<
  typeof segmentedButtonItemVariants
> & {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};

export const SegmentedButtonItem: React.FC<SegmentedButtonItemProps> = ({
  children,
  active,
  disabled,
  onClick,
  className,
}) => {
  return (
    <button
      className={cn(segmentedButtonItemVariants({ active, disabled, className }))}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      role="button"
      aria-pressed={active}
    >
      <Ripple disabled={disabled} />
      <span className="relative z-10 leading-none">{children}</span>
    </button>
  );
};
