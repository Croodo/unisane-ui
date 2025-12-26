import React, { forwardRef, ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Ripple } from "./ripple";
import { cn } from "../../lib/utils";
import { focusRing } from "../../utils/focus-ring";

const fabVariants = cva(
  "relative inline-flex items-center justify-center gap-2u font-medium rounded-2xl transition-all duration-emphasized ease-standard disabled:opacity-38 disabled:cursor-not-allowed overflow-hidden group select-none",
  {
    variants: {
      variant: {
        primary: "bg-primary-container text-on-primary-container shadow-3 hover:shadow-4",
        secondary: "bg-secondary-container text-on-secondary-container shadow-3 hover:shadow-4",
        tertiary: "bg-tertiary-container text-on-tertiary-container shadow-3 hover:shadow-4",
      },
      size: {
        small: "w-10u h-10u",
        medium: "w-14u h-14u",
        large: "w-24u h-24u text-[36px]",
      },
      extended: {
        true: "",
        false: "",
      },
      lowered: {
        true: "shadow-1 hover:shadow-2",
        false: "",
      },
    },
    compoundVariants: [
      {
        extended: true,
        size: "small",
        class: "w-auto h-10u px-4u text-label-large",
      },
      {
        extended: true,
        size: "medium",
        class: "w-auto h-14u px-5u text-label-large",
      },
      {
        extended: true,
        size: "large",
        class: "w-auto h-24u px-8u text-label-large",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "medium",
      extended: false,
      lowered: false,
    },
  }
);

interface FABProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof fabVariants> {}

export const FAB = forwardRef<HTMLButtonElement, FABProps>(
  (
    {
      variant = "primary",
      size = "medium",
      extended = false,
      lowered = false,
      className = "",
      disabled = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          fabVariants({ variant, size, extended, lowered }),
          focusRing.default,
          className
        )}
        {...props}
      >
        {/* State layer */}
        <span className="absolute inset-0 pointer-events-none bg-current opacity-0 transition-opacity duration-emphasized group-hover:opacity-hover group-focus-visible:opacity-focus group-active:opacity-pressed" />

        {/* Ripple effect */}
        <Ripple disabled={disabled} center={!extended} />

        {/* Content */}
        <span className="relative z-10 inline-flex items-center justify-center gap-2u">
          {children}
        </span>
      </button>
    );
  }
);

FAB.displayName = "FAB";