"use client";

import * as React from "react";
import { cn } from "@ui/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * Textarea primitive - a basic styled textarea element.
 *
 * For most cases, use TextField with multiline={true} which includes a label
 * and follows Material 3 guidelines.
 * Use this Textarea primitive when you need lower-level control or custom compositions.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-medium text-on-surface ring-offset-surface placeholder:text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
