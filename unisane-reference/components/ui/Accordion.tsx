import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Icon } from './Icon';
import { Ripple } from './Ripple';

interface AccordionProps {
  type?: 'single' | 'multiple';
  defaultValue?: string[];
  children: React.ReactNode;
  className?: string;
}

const AccordionContext = React.createContext<{
  expanded: string[];
  toggle: (val: string) => void;
} | null>(null);

export const Accordion: React.FC<AccordionProps> = ({ type = 'single', defaultValue = [], children, className }) => {
  const [expanded, setExpanded] = useState<string[]>(defaultValue);

  const toggle = (val: string) => {
    if (type === 'single') {
      setExpanded(prev => prev.includes(val) ? [] : [val]);
    } else {
      setExpanded(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
    }
  };

  return (
    <AccordionContext.Provider value={{ expanded, toggle }}>
      <div className={cn("flex flex-col border border-outline-variant/30 rounded-xs overflow-hidden bg-surface", className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

export const AccordionItem: React.FC<{ value: string; children: React.ReactNode; className?: string }> = ({ value, children, className }) => {
  const context = React.useContext(AccordionContext);
  const isExpanded = context?.expanded.includes(value);

  return (
    <div className={cn("border-b border-outline-variant/30 last:border-none", isExpanded && "bg-surface-container-low/50", className)}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { value, isExpanded });
        }
        return child;
      })}
    </div>
  );
};

export const AccordionTrigger: React.FC<{ children: React.ReactNode; value?: string; isExpanded?: boolean }> = ({ children, value, isExpanded }) => {
  const context = React.useContext(AccordionContext);
  return (
    <button
      onClick={() => context?.toggle(value!)}
      className={cn(
        "w-full h-12u px-4u flex items-center justify-between text-[12px] font-black uppercase tracking-tight transition-all relative overflow-hidden group",
        isExpanded ? "text-primary" : "text-on-surface hover:bg-on-surface/5"
      )}
    >
      <Ripple />
      <span className="relative z-10 flex-1 text-left pt-0.5u">{children}</span>
      <Icon 
        symbol="expand_more" 
        className={cn("transition-transform duration-standard ease-emphasized relative z-10", isExpanded && "rotate-180")} 
      />
    </button>
  );
};

export const AccordionContent: React.FC<{ children: React.ReactNode; isExpanded?: boolean }> = ({ children, isExpanded }) => (
  <div className={cn(
    "overflow-hidden transition-all duration-standard ease-emphasized",
    isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
  )}>
    <div className="px-4u pb-4u pt-1u text-on-surface-variant text-[13px] font-medium leading-relaxed">
      {children}
    </div>
  </div>
);