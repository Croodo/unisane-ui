"use client";

import React, { useEffect } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@ui/lib/utils";

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-sm bg-surface-container-highest",
  {
    variants: {
      variant: {
        linear: "h-1u",
        circular: "w-16u h-16u",
      },
      indeterminate: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      variant: "linear",
      indeterminate: false,
    },
  }
);

export type ProgressProps = VariantProps<typeof progressVariants> & {
  value?: number;
  variant?: "linear" | "circular";
  indeterminate?: boolean;
  className?: string;
};

export const Progress: React.FC<ProgressProps> = ({
  value = 0,
  variant = "linear",
  indeterminate = false,
  className,
}) => {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const styleId = "unisane-progress-indeterminate";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes indeterminate {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(300%);
        }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const clampedValue = Math.max(0, Math.min(100, value));

  if (variant === "circular") {
    const circumference = 2 * Math.PI * 30;
    const strokeDashoffset = indeterminate
      ? undefined
      : circumference - (clampedValue / 100) * circumference;

    return (
      <div
        className={cn("relative w-16u h-16u", className)}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : clampedValue}
      >
        <svg className="w-full h-full" viewBox="0 0 64 64">
          <circle
            className="text-surface-container-highest"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            r="30"
            cx="32"
            cy="32"
          />
          <circle
            className={cn(
              "text-primary transition-all duration-emphasized",
              indeterminate && "animate-spin"
            )}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            r="30"
            cx="32"
            cy="32"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
              animation: indeterminate ? "spin 1s linear infinite" : undefined,
            }}
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={cn(progressVariants({ variant, indeterminate, className }))}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : clampedValue}
    >
      <div
        className={cn(
          "h-full bg-primary transition-all duration-emphasized",
          indeterminate && "animate-pulse"
        )}
        style={{
          width: indeterminate ? "100%" : `${clampedValue}%`,
        }}
      >
        {indeterminate && (
          <div className="h-full w-1/3 bg-primary animate-[indeterminate_1.5s_ease-in-out_infinite]" />
        )}
      </div>
    </div>
  );
};
