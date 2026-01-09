import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Text } from "@/primitives/text";

const topAppBarVariants = cva(
  "w-full flex items-center px-4 transition-all duration-medium ease-standard bg-surface text-on-surface relative z-20 border-b border-outline-variant/30",
  {
    variants: {
      variant: {
        center: "h-16 justify-between",
        small: "h-16 justify-between",
        medium: "h-28 flex-col items-start justify-end pb-6",
        large: "h-38 flex-col items-start justify-end pb-8",
      },
      scrolled: {
        true: "bg-surface-container shadow-2",
        false: "",
      },
    },
    defaultVariants: {
      variant: "small",
      scrolled: false,
    },
  }
);

export type TopAppBarProps = VariantProps<typeof topAppBarVariants> & {
  title: React.ReactNode;
  navigationIcon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
};

export const TopAppBar = forwardRef<HTMLElement, TopAppBarProps>(
  (
    {
      variant,
      scrolled,
      title,
      navigationIcon,
      actions,
      className,
      ariaLabel,
    },
    ref
  ) => {
    const isTall = variant === "medium" || variant === "large";
    const isCenter = variant === "center";
    const titleString = typeof title === "string" ? title : undefined;

    return (
      <header
        ref={ref}
        className={cn(topAppBarVariants({ variant, scrolled, className }))}
        aria-label={ariaLabel || titleString}
      >
      <div
        className={cn(
          "w-full flex items-center",
          isTall ? "h-16 mb-auto" : "h-full",
          isCenter ? "justify-center relative" : "justify-between"
        )}
      >
        {navigationIcon && (
          <div
            className={cn(
              "text-on-surface mr-4 z-10",
              isCenter ? "absolute left-0" : ""
            )}
          >
            {navigationIcon}
          </div>
        )}

        {!isTall && (
          <div
            className={cn(
              "truncate",
              isCenter ? "text-center px-12 w-full" : "text-left flex-1"
            )}
          >
            <Text variant="titleLarge" className="truncate text-primary">
              {title}
            </Text>
          </div>
        )}

        <div
          className={cn(
            "flex items-center gap-2 text-on-surface-variant z-10",
            isCenter && "absolute right-0"
          )}
        >
          {actions}
        </div>
      </div>

      {isTall && (
        <div
          className={cn(
            "px-4 w-full transition-opacity duration-short",
            scrolled ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
          )}
        >
          <Text
            variant={variant === "large" ? "headlineMedium" : "headlineSmall"}
            className="truncate"
          >
            {title}
          </Text>
        </div>
      )}
    </header>
    );
  }
);

TopAppBar.displayName = "TopAppBar";
