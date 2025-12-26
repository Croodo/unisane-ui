"use client";

import React, { createContext, useContext, useState, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Ripple } from "./ripple";

interface AccordionContextType {
  openItems: string[];
  toggleItem: (value: string) => void;
  multiple?: boolean;
}

const AccordionContext = createContext<AccordionContextType | undefined>(undefined);

interface AccordionProps {
  children: React.ReactNode;
  defaultValue?: string | string[];
  multiple?: boolean;
  className?: string;
}

export const Accordion = ({ children, defaultValue = [], multiple = false, className }: AccordionProps) => {
  const [openItems, setOpenItems] = useState<string[]>(
    Array.isArray(defaultValue) ? defaultValue : [defaultValue]
  );

  const toggleItem = (value: string) => {
    setOpenItems((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }
      return multiple ? [...prev, value] : [value];
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, multiple }}>
      <div className={className}>{children}</div>
    </AccordionContext.Provider>
  );
};

// Accordion Item
const accordionItemVariants = cva("border-b border-outline-variant last:border-b-0");

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const AccordionItem = ({ value, children, className }: AccordionItemProps) => {
  return (
    <div className={cn(accordionItemVariants(), className)}>
      {children}
    </div>
  );
};

// Accordion Trigger
const accordionTriggerVariants = cva(
  "w-full flex items-center justify-between py-4u px-4u text-title-medium font-medium text-on-surface text-left hover:bg-on-surface/5 transition-colors duration-short relative overflow-hidden"
);

const accordionIconVariants = cva(
  "material-symbols-outlined text-on-surface-variant transition-transform duration-short relative z-10",
  {
    variants: {
      open: {
        true: "rotate-180",
        false: "",
      },
    },
    defaultVariants: {
      open: false,
    },
  }
);

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}

export const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ value, children, className, ...props }, ref) => {
    const context = useContext(AccordionContext);
    if (!context) throw new Error("AccordionTrigger must be used within Accordion");

    const isOpen = context.openItems.includes(value);

    return (
      <button
        ref={ref}
        onClick={() => context.toggleItem(value)}
        aria-expanded={isOpen}
        className={cn(accordionTriggerVariants(), className)}
        {...props}
      >
        <Ripple />
        <span className="relative z-10">{children}</span>
        <span className={cn(accordionIconVariants({ open: isOpen }))}>
          expand_more
        </span>
      </button>
    );
  }
);

AccordionTrigger.displayName = "AccordionTrigger";

// Accordion Content
const accordionContentVariants = cva(
  "overflow-hidden transition-all duration-emphasized ease-smooth",
  {
    variants: {
      open: {
        true: "max-h-[1000px] opacity-100",
        false: "max-h-0 opacity-0",
      },
    },
    defaultVariants: {
      open: false,
    },
  }
);

interface AccordionContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const AccordionContent = ({ value, children, className }: AccordionContentProps) => {
  const context = useContext(AccordionContext);
  if (!context) throw new Error("AccordionContent must be used within Accordion");

  const isOpen = context.openItems.includes(value);

  return (
    <div className={cn(accordionContentVariants({ open: isOpen }))}>
      <div className={cn("px-4u pb-4u text-body-medium text-on-surface-variant", className)}>
        {children}
      </div>
    </div>
  );
};