import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const linearProgressVariants = cva(
  "w-full bg-surface-container-highest rounded-full overflow-hidden",
  {
    variants: {
      size: {
        sm: "h-1u",
        md: "h-1.5u",
        lg: "h-2u",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

interface LinearProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof linearProgressVariants> {
  value?: number; // 0-100
  indeterminate?: boolean;
}

export const LinearProgress = forwardRef<HTMLDivElement, LinearProgressProps>(
  ({ value = 0, indeterminate = false, size, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(linearProgressVariants({ size }), className)}
        {...props}
      >
        <div
          className={cn(
            "h-full bg-primary rounded-full transition-all duration-short",
            indeterminate && "animate-indeterminate-progress"
          )}
          style={{
            width: indeterminate ? "40%" : `${Math.min(100, Math.max(0, value))}%`,
          }}
        />
      </div>
    );
  }
);

LinearProgress.displayName = "LinearProgress";

// Circular Progress
interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0-100
  indeterminate?: boolean;
  size?: number; // diameter in pixels
  strokeWidth?: number;
}

export const CircularProgress = forwardRef<HTMLDivElement, CircularProgressProps>(
  ({ value = 0, indeterminate = false, size = 48, strokeWidth = 4, className = "", ...props }, ref) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = indeterminate ? 25 : Math.min(100, Math.max(0, value));
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`inline-flex ${className}`}
        {...props}
      >
        <svg
          width={size}
          height={size}
          className={indeterminate ? "animate-spin" : ""}
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-surface-container-highest"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-primary transition-all duration-short"
          />
        </svg>
      </div>
    );
  }
);

CircularProgress.displayName = "CircularProgress";

// Skeleton loader
const skeletonVariants = cva("bg-surface-container-highest animate-pulse", {
  variants: {
    variant: {
      text: "rounded h-4u",
      circular: "rounded-full",
      rectangular: "rounded-lg",
    },
  },
  defaultVariants: {
    variant: "text",
  },
});

interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  width?: string | number;
  height?: string | number;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = "text", width, height, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant }), className)}
        style={{
          width: width || (variant === "circular" ? height : "100%"),
          height: height || (variant === "text" ? undefined : "100%"),
        }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";