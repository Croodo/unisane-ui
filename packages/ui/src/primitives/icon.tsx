import React, { forwardRef } from "react";
import { cn } from "@ui/lib/utils";

export interface IconProps extends React.HTMLAttributes<HTMLElement> {
  size?: number | "xs" | "sm" | "md" | "lg" | "xl";
  filled?: boolean;
  symbol?: string; // If provided, renders Material Symbol
  // Allow SVG props as well for backward compat
  viewBox?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: string | number;
  strokeLinecap?: "butt" | "round" | "square" | "inherit";
  strokeLinejoin?: "miter" | "round" | "bevel" | "inherit";
}

export const Icon = forwardRef<HTMLElement, IconProps>(
  (
    {
      size = "md",
      filled = false,
      symbol,
      className,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const isScale =
      typeof size === "string" && ["xs", "sm", "md", "lg", "xl"].includes(size);

    // If symbol prop is passed OR children is a simple string, render as Material Symbol
    const isSymbol =
      symbol ||
      (typeof children === "string" &&
        children.trim().length > 0 &&
        !children.includes("<"));

    const sizeClasses = isScale
      ? {
          xs: "w-icon-xs h-icon-xs text-[var(--uni-sys-icon-size-xs)]",
          sm: "w-icon-sm h-icon-sm text-[var(--uni-sys-icon-size-sm)]",
          md: "w-icon-md h-icon-md text-[var(--uni-sys-icon-size-md)]",
          lg: "w-icon-lg h-icon-lg text-[var(--uni-sys-icon-size-lg)]",
          xl: "w-icon-xl h-icon-xl text-[var(--uni-sys-icon-size-xl)]",
        }[size as string]
      : "";

    if (isSymbol) {
      const iconName = symbol || children;
      return (
        <span
          ref={ref as React.Ref<HTMLSpanElement>}
          className={cn(
            "material-symbols-outlined select-none inline-flex items-center justify-center align-middle shrink-0",
            isScale && sizeClasses,
            className
          )}
          style={{
            fontSize: !isScale ? size : undefined,
            width: !isScale ? size : undefined,
            height: !isScale ? size : undefined,
            // M3 Icon Standard: FILL 0 or 1.
            fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
            ...style,
          }}
          {...props}
        >
          {iconName}
        </span>
      );
    }

    // Fallback to SVG wrapper
    return (
      <svg
        ref={ref as React.Ref<SVGSVGElement>}
        xmlns="http://www.w3.org/2000/svg"
        width={!isScale ? size : undefined}
        height={!isScale ? size : undefined}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("inline-block shrink-0", isScale && sizeClasses, className)}
        style={style}
        {...(props as unknown as React.SVGProps<SVGSVGElement>)}
      >
        {children}
      </svg>
    );
  }
);

Icon.displayName = "Icon";

// Common icon components for convenience
export const CheckIcon = (props: Omit<IconProps, "symbol">) => (
  <Icon symbol="check" {...props} />
);
export const ChevronRightIcon = (props: Omit<IconProps, "symbol">) => (
  <Icon symbol="chevron_right" {...props} />
);
export const CloseIcon = (props: Omit<IconProps, "symbol">) => (
  <Icon symbol="close" {...props} />
);
export const MenuIcon = (props: Omit<IconProps, "symbol">) => (
  <Icon symbol="menu" {...props} />
);
