"use client";

import React, { forwardRef, useState, useEffect } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const topAppBarVariants = cva(
  "fixed top-0 left-0 right-0 z-50 flex items-center px-2u transition-all duration-300 ease-emphasized",
  {
    variants: {
      variant: {
        "center-aligned": "h-16u justify-center",
        small: "h-[64px] justify-between",
        medium: "h-[112px] flex-col items-start justify-end pb-6u px-4u",
        large: "h-[152px] flex-col items-start justify-end pb-7u px-4u",
      },
      scrollBehavior: {
        pinned: "bg-surface shadow-sm",
        scrolled: "bg-surface-container shadow-sm",
        transparent: "bg-transparent",
      },
    },
    defaultVariants: {
      variant: "small",
      scrollBehavior: "pinned",
    },
  }
);

const topAppBarTitleVariants = cva("flex-1 font-normal text-on-surface overflow-hidden text-ellipsis whitespace-nowrap", {
  variants: {
    variant: {
      "center-aligned": "text-title-large text-center",
      small: "text-title-large ml-2u",
      medium: "text-headline-small",
      large: "text-headline-medium",
    },
  },
  defaultVariants: {
    variant: "small",
  },
});

interface TopAppBarProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof topAppBarVariants> {
  title: string;
  navigationIcon?: React.ReactNode;
  actions?: React.ReactNode;
}

export const TopAppBarPrimitive = forwardRef<HTMLElement, TopAppBarProps>(
  ({ title, navigationIcon, actions, className, variant = "small", ...props }, ref) => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 10);
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollBehavior = isScrolled ? "scrolled" : "transparent";

    return (
      <header
        ref={ref}
        className={cn(topAppBarVariants({ variant, scrollBehavior }), className)}
        {...props}
      >
        <div className="flex items-center w-full">
            {navigationIcon && <div className="text-on-surface">{navigationIcon}</div>}

            <h1 className={cn(topAppBarTitleVariants({ variant }))}>{title}</h1>

            {actions && <div className="flex items-center gap-1u text-on-surface-variant">{actions}</div>}
        </div>
      </header>
    );
  }
);

TopAppBarPrimitive.displayName = "TopAppBarPrimitive";