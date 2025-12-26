"use client";

import React, { useState } from "react";
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { Ripple } from "./ripple";

interface AccordionContextValue {
  expanded: string[];
  toggle: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

export interface AccordionProps {
  type?: "single" | "multiple";
  defaultValue?: string[];
  children: React.ReactNode;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  type = "single",
  defaultValue = [],
  children,
  className,
}) => {
  const [expanded, setExpanded] = useState<string[]>(defaultValue);

  const toggle = (value: string) => {
    if (type === "single") {
      setExpanded((prev) => (prev.includes(value) ? [] : [value]));
      return;
    }

    setExpanded((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  return (
    <AccordionContext.Provider value={{ expanded, toggle }}>
      <div
        className={cn(
          "flex flex-col border border-outline-variant/30 rounded-sm overflow-hidden bg-surface",
          className
        )}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

export interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  value,
  children,
  className,
}) => {
  const context = React.useContext(AccordionContext);
  const isExpanded = context?.expanded.includes(value);

  return (
    <div
      className={cn(
        "border-b border-outline-variant/30 last:border-none",
        isExpanded && "bg-surface-container-low/50",
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            value,
            isExpanded,
          });
        }
        return child;
      })}
    </div>
  );
};

export interface AccordionTriggerProps {
  children: React.ReactNode;
  value?: string;
  isExpanded?: boolean;
}

export const AccordionTrigger: React.FC<AccordionTriggerProps> = ({
  children,
  value,
  isExpanded,
}) => {
  const context = React.useContext(AccordionContext);

  return (
    <button
      onClick={() => context?.toggle(value!)}
      className={cn(
        "w-full h-12u px-4u flex items-center justify-between text-label-medium font-medium transition-all relative overflow-hidden group",
        isExpanded ? "text-primary" : "text-on-surface hover:bg-on-surface/5"
      )}
    >
      <Ripple />
      <span className="relative z-10 flex-1 text-left pt-0.5u">
        {children}
      </span>
      <Icon
        symbol="expand_more"
        className={cn(
          "transition-transform duration-medium ease-emphasized relative z-10",
          isExpanded && "rotate-180"
        )}
      />
    </button>
  );
};

export interface AccordionContentProps {
  children: React.ReactNode;
  isExpanded?: boolean;
}

export const AccordionContent: React.FC<AccordionContentProps> = ({
  children,
  isExpanded,
}) => (
  <div
    className={cn(
      "overflow-hidden transition-all duration-medium ease-emphasized",
      isExpanded ? "max-h-[calc(var(--uni-sys-u)*250)] opacity-100" : "max-h-0 opacity-0"
    )}
  >
    <div className="px-4u pb-4u pt-1u text-on-surface-variant text-body-small font-medium leading-relaxed">
      {children}
    </div>
  </div>
);
