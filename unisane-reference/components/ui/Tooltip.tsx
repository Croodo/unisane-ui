import React from 'react';
import { cn } from '../../lib/utils';

interface TooltipProps {
  label: string;
  subhead?: string;
  children: React.ReactNode;
  variant?: 'plain' | 'rich';
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  label, 
  subhead,
  children, 
  variant = 'plain',
  className,
  side = 'top',
}) => {
  return (
    <div className="relative group inline-flex">
      {children}
      
      <div className={cn(
        "absolute z-[100] opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-200 pointer-events-none whitespace-nowrap",
        side === 'top' && "bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2",
        side === 'bottom' && "top-[calc(100%+8px)] left-1/2 -translate-x-1/2",
        side === 'left' && "right-[calc(100%+8px)] top-1/2 -translate-y-1/2",
        side === 'right' && "left-[calc(100%+8px)] top-1/2 -translate-y-1/2",
        
        variant === 'plain' 
            ? "bg-inverse-surface text-inverse-on-surface text-xs py-1.5u px-2u rounded-xs" 
            : "bg-surface-container text-on-surface p-3u rounded-sm shadow-2 min-w-[200px] whitespace-normal flex flex-col gap-1u",
        className
      )}>
        {variant === 'rich' && subhead && (
            <span className="text-on-surface-variant text-xs font-medium">{subhead}</span>
        )}
        <span className={cn(variant === 'rich' ? "text-sm font-medium" : "")}>{label}</span>
      </div>
    </div>
  );
};