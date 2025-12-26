"use client";

import React, { forwardRef, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const ratingStarVariants = cva(
  "transition-all duration-short focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 rounded-sm",
  {
    variants: {
      size: {
        sm: "w-5u h-5u",
        md: "w-6u h-6u",
        lg: "w-8u h-8u",
        xl: "w-10u h-10u",
      },
      interactive: {
        true: "cursor-pointer hover:scale-110",
        false: "cursor-default",
      },
      disabled: {
        true: "opacity-38",
        false: "",
      },
      filled: {
        true: "text-warning",
        false: "text-on-surface-variant",
      },
    },
    defaultVariants: {
      size: "md",
      interactive: true,
      disabled: false,
      filled: false,
    },
  }
);

interface RatingProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  max?: number;
  precision?: 0.5 | 1;
  size?: "sm" | "md" | "lg" | "xl";
  readOnly?: boolean;
  disabled?: boolean;
  showValue?: boolean;
  emptyIcon?: React.ReactNode;
  filledIcon?: React.ReactNode;
  halfIcon?: React.ReactNode;
}

export const Rating = forwardRef<HTMLDivElement, RatingProps>(
  (
    {
      value: controlledValue,
      defaultValue = 0,
      onChange,
      max = 5,
      precision = 1,
      size = "md",
      readOnly = false,
      disabled = false,
      showValue = false,
      emptyIcon,
      filledIcon,
      halfIcon,
      className = "",
      ...props
    },
    ref
  ) => {
    const [hoverValue, setHoverValue] = useState<number | null>(null);
    const [internalValue, setInternalValue] = useState(defaultValue);

    const value = controlledValue !== undefined ? controlledValue : internalValue;
    const displayValue = hoverValue ?? value;

    const handleClick = (newValue: number) => {
      if (readOnly || disabled) return;

      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    };

    const handleMouseMove = (index: number, e: React.MouseEvent<HTMLButtonElement>) => {
      if (readOnly || disabled) return;

      const { left, width } = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - left) / width;

      if (precision === 0.5) {
        setHoverValue(index + (percent > 0.5 ? 1 : 0.5));
      } else {
        setHoverValue(index + 1);
      }
    };

    const handleMouseLeave = () => {
      if (readOnly || disabled) return;
      setHoverValue(null);
    };

    const getIconForPosition = (position: number) => {
      const diff = displayValue - position;

      if (diff >= 1) {
        return (
          filledIcon || (
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          )
        );
      }

      if (diff >= 0.5 && precision === 0.5) {
        return (
          halfIcon || (
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>
          )
        );
      }

      return (
        emptyIcon || <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>star</span>
      );
    };

    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center gap-1u", className)}
        {...props}
      >
        <div
          className="inline-flex items-center gap-0.5u"
          role="radiogroup"
          aria-label="Rating"
          onMouseLeave={handleMouseLeave}
        >
          {Array.from({ length: max }, (_, index) => (
            <button
              key={index}
              type="button"
              role="radio"
              aria-checked={value === index + 1}
              aria-label={`${index + 1} star${index + 1 > 1 ? "s" : ""}`}
              disabled={disabled}
              className={cn(
                ratingStarVariants({
                  size,
                  interactive: !readOnly && !disabled,
                  disabled,
                  filled: displayValue > index,
                })
              )}
              onClick={() => handleClick(index + 1)}
              onMouseMove={(e) => handleMouseMove(index, e)}
            >
              {getIconForPosition(index)}
            </button>
          ))}
        </div>

        {showValue && (
          <span className="text-label-large text-on-surface-variant ml-2u">
            {value.toFixed(precision === 0.5 ? 1 : 0)}
          </span>
        )}
      </div>
    );
  }
);

Rating.displayName = "Rating";

// RatingDisplay - Read-only compact rating display
const ratingDisplayStarVariants = cva("material-symbols-outlined", {
  variants: {
    size: {
      sm: "w-4u h-4u text-[16px]",
      md: "w-5u h-5u text-[20px]",
      lg: "w-6u h-6u text-[24px]",
    },
    filled: {
      true: "text-warning",
      false: "text-on-surface-variant",
    },
  },
  defaultVariants: {
    size: "sm",
    filled: false,
  },
});

interface RatingDisplayProps {
  value: number;
  max?: number;
  showValue?: boolean;
  count?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const RatingDisplay = ({
  value,
  max = 5,
  showValue = true,
  count,
  size = "sm",
  className,
}: RatingDisplayProps) => {
  const filledStars = Math.floor(value);
  const hasHalfStar = value % 1 >= 0.5;
  const emptyStars = max - filledStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={cn("inline-flex items-center gap-1u", className)}>
      <div className="inline-flex items-center gap-0.5u">
        {Array.from({ length: filledStars }, (_, i) => (
          <span
            key={`filled-${i}`}
            className={cn(ratingDisplayStarVariants({ size, filled: true }))}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            star
          </span>
        ))}
        {hasHalfStar && (
          <span 
            className={cn(ratingDisplayStarVariants({ size, filled: true }))}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            star_half
          </span>
        )}
        {Array.from({ length: emptyStars }, (_, i) => (
          <span
            key={`empty-${i}`}
            className={cn(ratingDisplayStarVariants({ size, filled: false }))}
            style={{ fontVariationSettings: "'FILL' 0" }}
          >
            star
          </span>
        ))}
      </div>

      {showValue && (
        <span className="text-label-medium text-on-surface-variant">
          {value.toFixed(1)}
        </span>
      )}

      {count !== undefined && (
        <span className="text-label-medium text-on-surface-variant">
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
};
