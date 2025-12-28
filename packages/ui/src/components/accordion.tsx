"use client";

import React, { useState, useId } from "react";
import { cn } from "@ui/lib/utils";
import { Icon } from "@ui/primitives/icon";
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
  const contentId = useId();
  const triggerId = useId();

  return (
    <div
      className={cn(
        "border-b border-outline-variant/15 last:border-none",
        isExpanded && "bg-surface-container-low/50",
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            value,
            isExpanded,
            contentId,
            triggerId,
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
  contentId?: string;
  triggerId?: string;
}

export const AccordionTrigger: React.FC<AccordionTriggerProps> = ({
  children,
  value,
  isExpanded,
  contentId,
  triggerId,
}) => {
  const context = React.useContext(AccordionContext);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      context?.toggle(value!);
    }
  };

  return (
    <button
      id={triggerId}
      onClick={() => context?.toggle(value!)}
      onKeyDown={handleKeyDown}
      aria-expanded={isExpanded}
      aria-controls={contentId}
      className={cn(
        "w-full h-12 px-4 flex items-center justify-between text-label-medium font-medium transition-all relative overflow-hidden group",
        isExpanded ? "text-primary" : "text-on-surface hover:bg-on-surface/8"
      )}
    >
      <Ripple />
      <span className="relative z-10 flex-1 text-left pt-0_5">
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
  contentId?: string;
  triggerId?: string;
}

export const AccordionContent: React.FC<AccordionContentProps> = ({
  children,
  isExpanded,
  contentId,
  triggerId,
}) => (
  <div
    id={contentId}
    role="region"
    aria-labelledby={triggerId}
    aria-hidden={!isExpanded}
    className={cn(
      "overflow-hidden transition-all duration-medium ease-emphasized",
      isExpanded ? "max-h-[calc(var(--unit)*250)] opacity-100" : "max-h-0 opacity-0"
    )}
  >
    <div className="px-4 pb-4 pt-1 text-on-surface-variant text-body-small font-medium leading-relaxed">
      {children}
    </div>
  </div>
);
