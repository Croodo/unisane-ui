"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@ui/lib/utils";

const paneVariants = cva(
  "relative h-full overflow-hidden transition-all duration-long ease-emphasized bg-surface",
  {
    variants: {
      role: {
        list: "border-r border-outline-variant/20 z-0",
        main: "flex-1 z-0",
        supporting:
          "border-l border-outline-variant/20 z-10 bg-surface-container-low",
      },
      isActive: {
        true: "block",
        false: "hidden medium:block",
      },
    },
    defaultVariants: {
      role: "main",
      isActive: true,
    },
  }
);

export interface PaneProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "role">,
    VariantProps<typeof paneVariants> {
  width?: string | number;
  showScrollbar?: boolean;
}

export const Pane = React.forwardRef<HTMLDivElement, PaneProps>(
  (
    {
      className,
      role,
      isActive,
      width,
      style,
      children,
      showScrollbar,
      ...props
    },
    ref
  ) => {
    let widthClass = "";
    if (!width) {
      if (role === "list")
        widthClass =
          "w-full medium:w-[var(--width-pane-list,calc(var(--unit)*90))] shrink-0";
      if (role === "supporting")
        widthClass =
          "w-full medium:w-[var(--width-pane-supporting,calc(var(--unit)*100))] shrink-0";
      if (role === "main") widthClass = "w-full flex-1 min-w-0";
    }

    const shouldShowScrollbar = showScrollbar ?? role === "main";

    return (
      <div
        ref={ref}
        className={cn(paneVariants({ role, isActive }), widthClass, className)}
        style={{
          ...style,
          ...(width ? { width } : {}),
        }}
        {...props}
      >
        <div
          className={cn(
            "h-full overflow-y-auto",
            shouldShowScrollbar ? "[scrollbar-gutter:stable]" : "no-scrollbar"
          )}
        >
          {children}
        </div>
      </div>
    );
  }
);
Pane.displayName = "Pane";

export interface PaneDividerProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export const PaneDivider: React.FC<PaneDividerProps> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "w-px h-full bg-outline-variant/20 cursor-col-resize hover:bg-primary/50 transition-colors z-20 hidden medium:block",
        className
      )}
      {...props}
    />
  );
};

export interface PaneLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

export const PaneLayout = React.forwardRef<HTMLDivElement, PaneLayoutProps>(
  ({ className, orientation = "horizontal", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full h-full overflow-hidden relative isolate",
          orientation === "vertical" ? "flex-col" : "flex-row",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PaneLayout.displayName = "PaneLayout";
