import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Ripple } from "./ripple";
import { cn } from "../../lib/utils";
import { focusRing } from "../../utils/focus-ring";

const chipVariants = cva(
  "relative inline-flex items-center gap-2u h-8u px-4u rounded-sm text-label-large font-medium transition-all duration-short cursor-pointer overflow-hidden group select-none",
  {
    variants: {
      variant: {
        assist: "",
        filter: "",
        input: "",
        suggestion: "",
      },
      selected: {
        true: "bg-secondary-container text-on-secondary-container",
        false: "bg-surface-container-low border border-outline",
      },
      elevated: {
        true: "shadow-1 hover:shadow-2",
        false: "",
      },
      disabled: {
        true: "opacity-38 pointer-events-none cursor-not-allowed",
        false: "",
      },
    },
    compoundVariants: [
      // Assist variant
      {
        variant: "assist",
        selected: false,
        className: "text-on-surface",
      },
      // Filter variant
      {
        variant: "filter",
        selected: false,
        className: "text-on-surface-variant",
      },
      // Input variant (always unselected style)
      {
        variant: "input",
        className: "text-on-surface",
      },
      // Suggestion variant
      {
        variant: "suggestion",
        selected: false,
        className: "text-on-surface",
      },
    ],
    defaultVariants: {
      variant: "assist",
      selected: false,
      elevated: false,
      disabled: false,
    },
  }
);

interface ChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled">,
    VariantProps<typeof chipVariants> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onDelete?: () => void;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      variant = "assist",
      selected = false,
      elevated = false,
      disabled = false,
      leadingIcon,
      trailingIcon,
      onDelete,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={cn(
          chipVariants({ variant, selected, elevated, disabled }),
          focusRing.default,
          className
        )}
        {...props}
      >
        {/* State layer for non-selected chips */}
        {!selected && (
          <span className="absolute inset-0 pointer-events-none bg-on-surface opacity-0 transition-opacity duration-short group-hover:opacity-8 group-active:opacity-12 z-0" />
        )}

        {/* Ripple effect */}
        <Ripple disabled={disabled} />

        {/* Leading icon */}
        {leadingIcon && (
          <span className="w-4.5u h-4.5u flex items-center justify-center -ml-2u relative z-10">
            {leadingIcon}
          </span>
        )}

        {/* Selected checkmark (for filter variant) */}
        {variant === "filter" && selected && !leadingIcon && (
          <span className="material-symbols-outlined w-4.5u h-4.5u flex items-center justify-center -ml-2u relative z-10 text-[18px]">
            check
          </span>
        )}

        {/* Label */}
        <span className="truncate relative z-10">{children}</span>

        {/* Trailing icon or delete button */}
        {onDelete ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-4.5u h-4.5u flex items-center justify-center -mr-2u hover:bg-on-surface/12 rounded-full transition-colors relative z-10"
            aria-label="Remove"
          >
            <span className="material-symbols-outlined w-4.5u h-4.5u flex items-center justify-center text-[18px]">
              close
            </span>
          </button>
        ) : trailingIcon ? (
          <span className="w-4.5u h-4.5u flex items-center justify-center -mr-2u relative z-10">
            {trailingIcon}
          </span>
        ) : null}
      </button>
    );
  }
);

Chip.displayName = "Chip";

// Chip Group for managing multiple chips
interface ChipGroupProps {
  children: React.ReactNode;
  className?: string;
  wrap?: boolean;
}

export const ChipGroup = ({ children, className, wrap = true }: ChipGroupProps) => (
  <div className={cn("flex gap-2u", wrap && "flex-wrap", className)}>
    {children}
  </div>
);