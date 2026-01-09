"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Input primitive - a basic styled input element.
 *
 * For most cases, use TextField which includes a label and follows Material 3 guidelines.
 * Use this Input primitive when you need lower-level control or custom compositions.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-medium text-on-surface ring-offset-surface file:border-0 file:bg-transparent file:text-body-small file:font-medium file:text-on-surface placeholder:text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
