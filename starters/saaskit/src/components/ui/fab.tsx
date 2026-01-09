import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";
import { Ripple } from "./ripple";

const fabVariants = cva(
  "inline-flex items-center justify-center gap-2 transition-all duration-medium cursor-pointer overflow-hidden relative group shrink-0 z-30 select-none",
  {
    variants: {
      variant: {
        primary: "bg-primary-container text-on-primary-container shadow-3 hover:shadow-4",
        surface: "bg-surface text-primary border border-outline-variant/30 shadow-1 hover:shadow-2",
        secondary: "bg-secondary-container text-on-secondary-container shadow-3 hover:shadow-4",
        tertiary: "bg-tertiary-container text-on-tertiary-container shadow-3 hover:shadow-4",
      },
      size: {
        sm: "w-10 h-10 rounded-lg",
        md: "w-14 h-14 rounded-lg",
        lg: "w-24 h-24 rounded-lg",
        extended: "h-14 px-6 rounded-lg w-auto min-w-20",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export type FabProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof fabVariants> & {
    icon?: React.ReactNode;
    label?: string;
  };

export const Fab: React.FC<FabProps> = ({
  variant,
  size,
  className,
  icon,
  label,
  children,
  ...props
}) => {
  // Auto-switch to extended when label is provided (unless explicitly using sm or lg)
  const finalSize = label && (size === "md" || size === undefined) ? "extended" : size;

  return (
    <button
      className={cn(fabVariants({ variant, size: finalSize, className }))}
      {...props}
    >
      <Ripple disabled={props.disabled} />
      <div className="relative z-10 flex items-center justify-center gap-3 pointer-events-none">
        {icon && (
          <span
            className={cn(
              "flex items-center justify-center transition-transform",
              finalSize === "lg"
                ? "[&>svg]:w-9 [&>svg]:h-9"
                : "[&>svg]:w-6 [&>svg]:h-6"
            )}
          >
            {icon}
          </span>
        )}
        {label && (
          <span className="text-label-large font-medium leading-none">
            {label}
          </span>
        )}
        {children}
      </div>
    </button>
  );
};
