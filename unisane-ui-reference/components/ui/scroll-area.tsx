"use client";

import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const scrollAreaVariants = cva("relative", {
  variants: {
    showScrollbar: {
      hover: "scrollbar-hover",
      always: "scrollbar-visible",
      never: "no-scrollbar",
    },
    orientation: {
      vertical: "overflow-y-auto overflow-x-hidden",
      horizontal: "overflow-x-auto overflow-y-hidden",
      both: "overflow-auto",
    },
  },
  defaultVariants: {
    showScrollbar: "hover",
    orientation: "vertical",
  },
});

interface ScrollAreaProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof scrollAreaVariants> {
  maxHeight?: string | number;
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    {
      maxHeight,
      showScrollbar,
      orientation,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const maxHeightStyle =
      typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight;

    return (
      <div
        ref={ref}
        className={cn(scrollAreaVariants({ showScrollbar, orientation }), className)}
        style={{ maxHeight: maxHeightStyle }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ScrollArea.displayName = "ScrollArea";