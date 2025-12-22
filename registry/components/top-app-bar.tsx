import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@ui/lib/utils";
import { Text } from "@ui/primitives/text";

const topAppBarVariants = cva(
  "w-full flex items-center px-4u transition-all duration-medium ease-standard bg-surface text-on-surface relative z-20 border-b border-outline-variant/30",
  {
    variants: {
      variant: {
        center: "h-16u justify-between",
        small: "h-16u justify-between",
        medium: "h-28u flex-col items-start justify-end pb-6u",
        large: "h-38u flex-col items-start justify-end pb-8u",
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
  title: string;
  navigationIcon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  scrollBehavior?: "pinned" | "enterAlways" | "exitUntilCollapsed";
};

export const TopAppBar: React.FC<TopAppBarProps> = ({
  variant,
  scrolled,
  title,
  navigationIcon,
  actions,
  className,
}) => {
  const isTall = variant === "medium" || variant === "large";
  const isCenter = variant === "center";

  return (
    <header className={cn(topAppBarVariants({ variant, scrolled, className }))}>
      <div
        className={cn(
          "w-full flex items-center",
          isTall ? "h-16u mb-auto" : "h-full",
          isCenter ? "justify-center relative" : "justify-between"
        )}
      >
        {navigationIcon && (
          <div
            className={cn(
              "text-on-surface mr-4u z-10",
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
              isCenter ? "text-center px-12u w-full" : "text-left flex-1"
            )}
          >
            <Text variant="titleLarge" className="truncate font-black uppercase tracking-widest text-primary">
              {title}
            </Text>
          </div>
        )}

        <div
          className={cn(
            "flex items-center gap-2u text-on-surface-variant z-10",
            isCenter && "absolute right-0"
          )}
        >
          {actions}
        </div>
      </div>

      {isTall && (
        <div
          className={cn(
            "px-4u w-full transition-opacity duration-short",
            scrolled ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
          )}
        >
          <Text
            variant={variant === "large" ? "headlineMedium" : "headlineSmall"}
            className="truncate font-black uppercase tracking-tight"
          >
            {title}
          </Text>
        </div>
      )}
    </header>
  );
};
