import React from 'react';
import { cn } from '../../lib/utils';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({ orientation = 'horizontal', className }) => {
  return (
    <div
      role="separator"
      className={cn(
        "bg-outline-variant",
        orientation === 'horizontal' ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
    />
  );
};
