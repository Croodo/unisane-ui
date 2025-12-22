import React from 'react';
import { cn } from '../../lib/utils';

interface ToolbarProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'standard' | 'inverse';
}

export const Toolbar: React.FC<ToolbarProps> = ({ children, className, variant = 'standard' }) => (
  <div className={cn(
    "inline-flex items-center h-12u px-1u rounded-xs shadow-2 gap-0.5u transition-all",
    variant === 'standard' ? "bg-surface border border-outline-variant" : "bg-inverse-surface text-inverse-on-surface border border-transparent",
    className
  )}>
    {children}
  </div>
);

export const ToolbarSeparator: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("w-px h-6u bg-outline-variant mx-1.5u", className)} />
);

export const ToolbarButton: React.FC<{ children: React.ReactNode; onClick?: () => void; active?: boolean }> = ({ children, onClick, active }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-10u h-10u flex items-center justify-center rounded-xs transition-all relative overflow-hidden group",
      active ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
    )}
  >
    <div className="relative z-10">{children}</div>
  </button>
);