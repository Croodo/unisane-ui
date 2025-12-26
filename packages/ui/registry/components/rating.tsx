"use client";

import React, { useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@ui/lib/utils";
import { Surface } from "@ui/primitives/surface";
import { Text } from "@ui/primitives/text";
import { StateLayer } from "@ui/primitives/state-layer";

const ratingVariants = cva("flex items-center gap-1", {
  variants: {
    size: {
      sm: "text-label-medium",
      md: "text-body-medium",
      lg: "text-body-large",
    },
    disabled: {
      true: "opacity-38 cursor-not-allowed",
      false: "cursor-pointer",
    },
  },
  defaultVariants: {
    size: "md",
    disabled: false,
  },
});

export type RatingProps = VariantProps<typeof ratingVariants> & {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  allowHalf?: boolean;
  showValue?: boolean;
  className?: string;
  disabled?: boolean;
};

export const Rating: React.FC<RatingProps> = ({
  value,
  onChange,
  max = 5,
  allowHalf = false,
  showValue = false,
  className,
  disabled = false,
  size = "md",
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue ?? value;

  const handleStarClick = (starValue: number) => {
    if (disabled) return;
    onChange?.(starValue);
  };

  const handleStarMouseEnter = (starValue: number) => {
    if (disabled) return;
    setHoverValue(starValue);
  };

  const handleStarMouseLeave = () => {
    setHoverValue(null);
  };

  const getStarFill = (starIndex: number) => {
    if (allowHalf) {
      if (displayValue >= starIndex + 1) return "full";
      if (displayValue >= starIndex + 0.5) return "half";
      return "empty";
    }
    return displayValue >= starIndex + 1 ? "full" : "empty";
  };

  return (
    <div className={cn(ratingVariants({ size, disabled, className }))}>
      {Array.from({ length: max }, (_, index) => {
        const fill = getStarFill(index);

        return (
          <button
            key={index}
            className="relative p-1 rounded-sm hover:bg-on-surface/10 transition-colors"
            onClick={() => handleStarClick(index + 1)}
            onMouseEnter={() => handleStarMouseEnter(index + 1)}
            onMouseLeave={handleStarMouseLeave}
            disabled={disabled}
            aria-label={`Rate ${index + 1} out of ${max} stars`}
          >
            <StateLayer />
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              className={cn(
                "w-6 h-6",
                fill === "full" && "text-primary",
                fill === "half" && "text-primary",
                fill === "empty" && "text-outline"
              )}
            >
              {fill === "half" ? (
                <defs>
                  <linearGradient id={`half-gradient-${index}`}>
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="transparent" />
                  </linearGradient>
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill={`url(#half-gradient-${index})`}
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </defs>
              ) : (
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill={fill === "full" ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="1"
                />
              )}
            </svg>
          </button>
        );
      })}

      {showValue && (
        <Text variant="bodyMedium" className="ml-2 text-on-surface-variant">
          {value.toFixed(allowHalf ? 1 : 0)} / {max}
        </Text>
      )}
    </div>
  );
};
