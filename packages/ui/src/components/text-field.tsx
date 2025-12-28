"use client";

import React, { useId, useState, useEffect, useRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@ui/lib/utils";

const textFieldContainerVariants = cva(
  "relative flex w-full transition-all duration-snappy ease-emphasized group cursor-text",
  {
    variants: {
      variant: {
        outlined:
          "rounded-sm border border-outline-variant bg-surface hover:border-outline focus-within:!border-primary focus-within:ring-1 focus-within:ring-primary/20",
        filled:
          "rounded-t-sm rounded-b-none border-b border-outline-variant bg-surface-container-low hover:bg-surface-container focus-within:bg-surface",
      },
      error: {
        true: "border-error focus-within:border-error hover:border-error ring-error/20",
      },
      disabled: {
        true: "opacity-38 cursor-not-allowed pointer-events-none grayscale",
      },
    },
    defaultVariants: {
      variant: "outlined",
      error: false,
    },
  }
);

export type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement> &
  VariantProps<typeof textFieldContainerVariants> & {
    label: string;
    helperText?: string;
    leadingIcon?: React.ReactNode;
    trailingIcon?: React.ReactNode;
    multiline?: boolean;
    labelClassName?: string;
    labelBg?: string;
  };

export const TextField = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  TextFieldProps
>(
  (
    {
      label,
      variant = "outlined",
      error,
      helperText,
      leadingIcon,
      trailingIcon,
      className,
      labelClassName,
      labelBg,
      id,
      multiline = false,
      disabled,
      value,
      defaultValue,
      onFocus,
      onBlur,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || `textfield-${generatedId}`;
    const internalRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState(
      value || defaultValue || ""
    );

    useEffect(() => {
      if (value !== undefined) setInternalValue(value);
    }, [value]);

    const handleFocus = (e: any) => {
      setIsFocused(true);
      onFocus?.(e);
    };
    const handleBlur = (e: any) => {
      setIsFocused(false);
      onBlur?.(e);
    };
    const handleChange = (e: any) => {
      setInternalValue(e.target.value);
      onChange?.(e);
    };

    const hasValue =
      internalValue !== undefined &&
      internalValue !== null &&
      internalValue !== "";
    const isFloating = isFocused || hasValue;

    useEffect(() => {
      if (ref) {
        if (typeof ref === "function") {
          ref(internalRef.current);
        } else {
          (ref as React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>).current = internalRef.current;
        }
      }
    }, [ref]);

    return (
      <div className={cn("relative inline-flex flex-col w-full", className)}>
        <div
          className={cn(
            textFieldContainerVariants({ variant, error, disabled }),
            multiline ? "items-start py-0" : "items-center h-14"
          )}
        >
          {leadingIcon && (
            <span
              className={cn(
                "pl-4 transition-colors shrink-0 flex items-center justify-center",
                multiline ? "mt-4" : "h-full",
                error
                  ? "text-error"
                  : isFocused
                  ? "text-primary"
                  : "text-on-surface-variant"
              )}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                {leadingIcon}
              </div>
            </span>
          )}
          <div className="relative flex-1 h-full min-w-0">
            {multiline ? (
              <textarea
                ref={internalRef as any}
                id={inputId}
                value={value}
                defaultValue={defaultValue}
                disabled={disabled}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onChange={handleChange}
                className={cn(
                  "w-full h-full bg-transparent px-4 outline-none border-none focus:ring-0 text-on-surface text-body-large caret-primary placeholder-transparent resize-none py-5 min-h-[calc(var(--unit)*30)]",
                  variant === "filled" ? "pt-7 pb-3" : ""
                )}
                placeholder=" "
                {...(props as any)}
              />
            ) : (
              <input
                ref={internalRef as any}
                id={inputId}
                value={value}
                defaultValue={defaultValue}
                disabled={disabled}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onChange={handleChange}
                className={cn(
                  "w-full h-full bg-transparent px-4 outline-none border-none focus:ring-0 text-on-surface text-body-large caret-primary placeholder-transparent",
                  variant === "filled" ? "pt-7 pb-1" : ""
                )}
                placeholder=" "
                {...(props as any)}
              />
            )}
            <label
              htmlFor={inputId}
              className={cn(
                "absolute pointer-events-none truncate max-w-[calc(100%-calc(var(--unit)*4))] transition-all duration-medium ease-emphasized origin-left left-4",
                !isFloating && [
                  "text-body-large text-on-surface-variant",
                  multiline ? "top-5" : "top-1/2 -translate-y-1/2",
                ],
                isFloating && [
                  "text-label-small font-medium",
                  variant === "outlined" && [
                    "top-0 -translate-y-1/2 px-1 -ml-1",
                    labelBg || "bg-surface",
                    labelClassName,
                  ],
                  variant === "filled" && "top-2 translate-y-0",
                  error
                    ? "text-error"
                    : isFocused
                    ? "text-primary"
                    : "text-on-surface-variant",
                ],
                leadingIcon && !isFloating && "left-1"
              )}
            >
              {label}
            </label>
          </div>
          {trailingIcon && (
            <span
              className={cn(
                "pr-4 transition-colors shrink-0 flex items-center justify-center",
                multiline ? "mt-4" : "h-full",
                error ? "text-error" : "text-on-surface-variant"
              )}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                {trailingIcon}
              </div>
            </span>
          )}
        </div>
        {helperText && (
          <span
            className={cn(
              "text-label-small mt-1_5 px-4 font-medium",
              error ? "text-error" : "text-on-surface-variant"
            )}
          >
            {helperText}
          </span>
        )}
      </div>
    );
  }
);
TextField.displayName = "TextField";
