import React from 'react';
import { cn } from '../../lib/utils';

export const Kbd: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <kbd className={cn(
    "inline-flex items-center justify-center px-1.5u h-5u min-w-5u bg-surface-container-highest border border-outline-variant border-b-2 rounded-xs text-[9px] font-mono font-black text-on-surface-variant uppercase tracking-tighter shadow-sm mx-0.5u",
    className
  )}>
    {children}
  </kbd>
);