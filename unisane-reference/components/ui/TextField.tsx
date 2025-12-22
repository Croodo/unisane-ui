import React, { useId, useState, useEffect, useRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const textFieldContainerVariants = cva(
  "relative flex w-full transition-all duration-snappy ease-emphasized group cursor-text",
  {
    variants: {
      variant: {
        outlined: "rounded-xs border border-outline-variant bg-surface hover:border-outline focus-within:!border-primary focus-within:ring-1 focus-within:ring-primary/20",
        filled: "rounded-t-xs rounded-b-none border-b border-outline-variant bg-surface-container-low hover:bg-surface-container focus-within:bg-surface",
      },
      error: {
        true: "border-error focus-within:border-error hover:border-error ring-error/20",
      },
      disabled: {
        true: "opacity-40 cursor-not-allowed pointer-events-none grayscale",
      }
    },
    defaultVariants: {
      variant: "outlined",
      error: false,
    },
  }
);

export type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement> & VariantProps<typeof textFieldContainerVariants> & {
  label: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  multiline?: boolean;
  labelClassName?: string;
  labelBg?: string; 
};

export const TextField: React.FC<TextFieldProps> = ({
  label,
  variant = 'outlined',
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
}) => {
  const generatedId = useId();
  const inputId = id || `textfield-${generatedId}`;
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value || defaultValue || '');

  useEffect(() => { if (value !== undefined) setInternalValue(value); }, [value]);

  const handleFocus = (e: any) => { setIsFocused(true); onFocus?.(e); };
  const handleBlur = (e: any) => { setIsFocused(false); onBlur?.(e); };
  const handleChange = (e: any) => { setInternalValue(e.target.value); onChange?.(e); };

  const hasValue = internalValue !== undefined && internalValue !== null && internalValue !== '';
  const isFloating = isFocused || hasValue;

  return (
    <div className={cn("relative inline-flex flex-col w-full", className)}>
      <div className={cn(textFieldContainerVariants({ variant, error, disabled }), multiline ? "items-start py-0" : "items-center h-14u")}>
        {leadingIcon && (
          <span className={cn("pl-4u transition-colors flex-shrink-0 flex items-center justify-center", multiline ? "mt-4u" : "h-full", error ? "text-error" : isFocused ? "text-primary" : "text-on-surface-variant")}>
            <div className="w-5u h-5u flex items-center justify-center">{leadingIcon}</div>
          </span>
        )}
        <div className="relative flex-1 h-full min-w-0">
            {multiline ? (
              <textarea ref={inputRef as any} id={inputId} value={value} defaultValue={defaultValue} disabled={disabled} onFocus={handleFocus} onBlur={handleBlur} onChange={handleChange} className={cn("w-full h-full bg-transparent px-4u outline-none border-none focus:ring-0 text-on-surface text-[13px] font-bold caret-primary placeholder-transparent resize-none py-5u min-h-[120px]", variant === 'filled' ? 'pt-7u pb-3u' : '')} placeholder=" " {...props as any} />
            ) : (
              <input ref={inputRef as any} id={inputId} value={value} defaultValue={defaultValue} disabled={disabled} onFocus={handleFocus} onBlur={handleBlur} onChange={handleChange} className={cn("w-full h-full bg-transparent px-4u outline-none border-none focus:ring-0 text-on-surface text-[13px] font-bold caret-primary placeholder-transparent", variant === 'filled' ? 'pt-7u pb-1u' : '')} placeholder=" " {...props as any} />
            )}
            <label htmlFor={inputId} className={cn("absolute pointer-events-none truncate max-w-[calc(100%-16px)] transition-all duration-standard ease-emphasized origin-left left-4u", !isFloating && ["text-[13px] font-bold text-on-surface-variant", multiline ? "top-5u" : "top-1/2 -translate-y-1/2"], isFloating && ["scale-[0.8] font-black uppercase tracking-widest", variant === 'outlined' && ["top-0 -translate-y-1/2 px-1u -ml-1u", labelBg || "bg-white", labelClassName], variant === 'filled' && "top-2u translate-y-0", error ? "text-error" : isFocused ? "text-primary" : "text-on-surface-variant"], leadingIcon && !isFloating && "left-1u")}>
              {label}
            </label>
        </div>
        {trailingIcon && (
          <span className={cn("pr-4u transition-colors flex-shrink-0 flex items-center justify-center", multiline ? "mt-4u" : "h-full", error ? "text-error" : "text-on-surface-variant")}>
            <div className="w-5u h-5u flex items-center justify-center">{trailingIcon}</div>
          </span>
        )}
      </div>
      {helperText && <span className={cn("text-[9px] mt-1.5u px-4u font-black uppercase tracking-tight", error ? "text-error" : "text-on-surface-variant")}>{helperText}</span>}
    </div>
  );
};