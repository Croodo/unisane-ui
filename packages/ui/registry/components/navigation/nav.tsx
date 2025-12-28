"use client";

import React, { forwardRef, ElementType } from "react";
import { cn } from "@/lib/utils";
import type { NavigationVariant } from "../../types/navigation";

export interface NavProps extends React.HTMLAttributes<HTMLElement> {
  vertical?: boolean;
  variant?: NavigationVariant;
  collapsed?: boolean;
  width?: {
    expanded?: string;
    collapsed?: string;
  } | string;
  className?: string;
  children: React.ReactNode;
  as?: 'nav' | 'aside' | 'div';
}

export const Nav = forwardRef<HTMLElement, NavProps>(function Nav(
  {
    vertical = false,
    variant = "default",
    collapsed = false,
    width,
    className,
    children,
    as = "nav",
    ...props
  },
  ref
) {
    let navWidth: string | undefined;
    if (typeof width === "string") {
      navWidth = width;
    } else if (width) {
      navWidth = collapsed ? width.collapsed : width.expanded;
    }

    const Component = as as ElementType;

    return (
      <Component
        ref={ref}
        className={cn(
          "flex",
          "bg-surface text-on-surface",
          "transition-all duration-medium ease-standard",
          vertical ? "flex-col" : "flex-row items-center",
          variant === "compact" && "gap-1",
          variant === "default" && "gap-2",
          variant === "comfortable" && "gap-3",
          vertical && "border-r border-outline-variant/30",
          !vertical && "border-b border-outline-variant/30",

          className
        )}
        style={{
          width: vertical ? navWidth : undefined,
          height: !vertical ? navWidth : undefined,
        }}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Nav.displayName = "Nav";
