"use client";

import React, { createContext, useContext, useState, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Ripple } from "./ripple";
import { focusRing } from "../../utils/focus-ring";

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
  variant: "primary" | "secondary";
};

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

const tabsListVariants = cva("flex", {
  variants: {
    variant: {
      primary: "border-b border-outline-variant/30 bg-surface",
      secondary: "gap-2u p-1u bg-surface-container rounded-full inline-flex",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  defaultValue?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}

export const Tabs = ({
  value,
  onValueChange,
  children,
  variant = "primary",
  className,
}: TabsProps) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange, variant }}>
      <div className={cn("w-full flex flex-col", className)}>{children}</div>
    </TabsContext.Provider>
  );
};

interface TabsListProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tabsListVariants> {}

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, ...props }, ref) => {
    const context = useContext(TabsContext);
    if (!context) throw new Error("TabsList must be used within Tabs");

    return (
      <div
        ref={ref}
        role="tablist"
        className={cn(tabsListVariants({ variant: context.variant }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabsList.displayName = "TabsList";

const tabsTriggerVariants = cva(
  "relative flex items-center justify-center px-4u transition-colors duration-short ease-standard select-none outline-none group whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "h-12u text-title-small font-medium text-on-surface-variant hover:bg-on-surface/8 hover:text-on-surface",
        secondary: "h-10u rounded-full text-label-large font-medium text-on-surface-variant hover:bg-on-surface-variant/8",
      },
      active: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "primary",
        active: true,
        className: "text-primary hover:text-primary hover:bg-primary/8",
      },
      {
        variant: "secondary",
        active: true,
        className: "bg-secondary-container text-on-secondary-container hover:bg-secondary-container",
      },
    ],
  }
);

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  icon?: React.ReactNode;
}

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, icon, children, className, ...props }, ref) => {
    const context = useContext(TabsContext);
    if (!context) throw new Error("TabsTrigger must be used within Tabs");

    const isActive = context.value === value;

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isActive}
        onClick={() => context.onValueChange(value)}
        className={cn(
          tabsTriggerVariants({ variant: context.variant, active: isActive }),
          focusRing.default,
          context.variant === "primary" ? "flex-1" : "px-4u", // Primary tabs usually stretch
          className
        )}
        {...props}
      >
        {/* Ripple */}
        <Ripple />

        {/* Content */}
        <div className="relative z-10 flex items-center gap-2u">
          {icon}
          {children}
        </div>

        {/* Primary Indicator (Underline) */}
        {context.variant === "primary" && isActive && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full mx-4u animate-in fade-in zoom-in-x duration-short" />
        )}
      </button>
    );
  }
);

TabsTrigger.displayName = "TabsTrigger";

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, children, className, ...props }, ref) => {
    const context = useContext(TabsContext);
    if (!context) throw new Error("TabsContent must be used within Tabs");

    if (context.value !== value) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn("mt-4u animate-in fade-in slide-in-from-bottom-2 duration-short", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabsContent.displayName = "TabsContent";