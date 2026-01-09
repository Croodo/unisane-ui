import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Ripple } from "./ripple";
import { cn } from "@/src/lib/utils";

const iconButtonVariants = cva(
  "relative inline-flex items-center justify-center rounded-full transition-all duration-snappy ease-emphasized overflow-hidden disabled:opacity-38 disabled:cursor-not-allowed group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary select-none",
  {
    variants: {
      variant: {
        filled: "bg-primary text-on-primary",
        tonal: "bg-secondary-container text-on-secondary-container",
        outlined: "bg-transparent border border-outline text-on-surface-variant",
        standard: "bg-transparent text-on-surface-variant",
        // shadcn compatibility: text is an alias for standard
        text: "bg-transparent text-on-surface-variant",
        // shadcn compatibility: ghost is an alias for standard
        ghost: "bg-transparent text-on-surface-variant hover:bg-on-surface/8",
      },
      size: {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12",
      },
      selected: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "tonal",
        selected: true,
        className: "bg-secondary-container text-on-secondary-container",
      },
      {
        variant: "outlined",
        selected: true,
        className: "bg-primary/10 border-primary text-primary",
      },
      { variant: "standard", selected: true, className: "text-primary" },
    ],
    defaultVariants: {
      variant: "standard",
      size: "md",
      selected: false,
    },
  }
);

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  icon?: React.ReactNode;
  loading?: boolean;
  /** Accessible label for the button. Optional if aria-label is provided via props spread. */
  ariaLabel?: string;
  children?: React.ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      variant = "standard",
      size = "md",
      selected = false,
      disabled = false,
      loading = false,
      ariaLabel,
      className = "",
      type = "button",
      children,
      ...props
    },
    ref
  ) => {
    const iconSizeClasses = {
      sm: "size-icon-sm",
      md: "w-6 h-6",
      lg: "w-7 h-7",
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          iconButtonVariants({ variant, size, selected }),
          className
        )}
        disabled={disabled || loading}
        aria-label={ariaLabel}
        {...props}
      >
        <div className="absolute inset-0 pointer-events-none bg-current opacity-0 transition-opacity group-hover:opacity-hover group-focus-visible:opacity-focus group-active:opacity-pressed z-0" />
        <Ripple center disabled={disabled || loading} />
        {loading ? (
          <svg
            className={cn("animate-spin relative z-10", iconSizeClasses[size || "md"])}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <span
            className={cn(
              "relative z-10 flex items-center justify-center",
              iconSizeClasses[size || "md"]
            )}
          >
            {children || icon}
          </span>
        )}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
