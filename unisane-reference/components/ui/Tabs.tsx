import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../lib/utils';
import { Ripple } from './Ripple';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={cn("w-full flex flex-col", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div 
    className={cn(
        "flex w-full border-b border-outline-variant bg-surface overflow-x-auto no-scrollbar",
        className
    )} 
    role="tablist" 
    {...props}
  >
    {children}
  </div>
);

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  icon?: React.ReactNode;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, icon, className, children, ...props }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be used within Tabs");

  const isSelected = context.value === value;

  return (
    <button
      role="tab"
      aria-selected={isSelected}
      onClick={() => context.onValueChange(value)}
      className={cn(
        "min-w-fit relative flex items-center justify-center py-4u px-6u min-h-[48px] gap-2.5u cursor-pointer group transition-all focus-visible:outline-none select-none shrink-0 overflow-hidden",
        isSelected ? "text-primary" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low",
        className
      )}
      {...props}
    >
      <Ripple />
      {icon && <div className={cn("transition-colors z-10 shrink-0", isSelected ? "text-primary" : "text-on-surface-variant")}>{icon}</div>}
      <span className={cn(
        "text-[10px] z-10 leading-none whitespace-nowrap uppercase tracking-[0.2em] font-black transition-all pt-0.5u",
        isSelected ? "opacity-100" : "opacity-60"
      )}>
          {children}
      </span>
      {isSelected && (
        <div className="absolute bottom-0 w-full h-[3px] bg-primary animate-in zoom-in-x duration-standard ease-emphasized z-20 rounded-t-full" />
      )}
    </button>
  );
};

export const TabsContent: React.FC<React.HTMLAttributes<HTMLDivElement> & { value: string }> = ({ value, className, children, ...props }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used within Tabs");
  if (context.value !== value) return null;
  return (
    <div role="tabpanel" className={cn("mt-4u focus-visible:outline-none animate-in fade-in slide-in-from-bottom-1 duration-standard", className)} {...props}>
      {children}
    </div>
  );
};