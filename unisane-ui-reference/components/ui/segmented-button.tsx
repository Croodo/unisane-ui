import React, { forwardRef } from "react";
import { cva } from "class-variance-authority";
import { Ripple } from "./ripple";
import { cn } from "../../lib/utils";

const segmentedButtonItemVariants = cva(
  "relative flex-1 inline-flex items-center justify-center gap-2u h-10u px-4u text-label-large font-medium transition-all duration-short ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary overflow-hidden group select-none",
  {
    variants: {
      selected: {
        true: "bg-secondary-container text-on-secondary-container",
        false: "bg-transparent text-on-surface hover:bg-on-surface/8",
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
);

interface SegmentedButtonOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedButtonProps {
  options: SegmentedButtonOption[];
  value: string;
  onChange: (value: string) => void;
  fullWidth?: boolean;
  className?: string;
}

export const SegmentedButton = forwardRef<HTMLDivElement, SegmentedButtonProps>(
  ({ options, value, onChange, fullWidth = false, className = "" }, ref) => {
    return (
      <div
        ref={ref}
        role="group"
        className={cn(
          "inline-flex border border-outline rounded-full overflow-hidden",
          fullWidth && "w-full",
          className
        )}
      >
        {options.map((option, index) => {
          const isSelected = value === option.value;
          const isFirst = index === 0;
          const isLast = index === options.length - 1;

          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={cn(
                segmentedButtonItemVariants({ selected: isSelected }),
                !isFirst && "border-l border-outline"
              )}
            >
              {/* Ripple effect */}
              <Ripple />

              {/* Content */}
              <span className="relative z-10 inline-flex items-center justify-center gap-2u">
                {option.icon}
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }
);

SegmentedButton.displayName = "SegmentedButton";