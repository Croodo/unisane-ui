import React from 'react';
import { cn } from '../../lib/utils';

interface BottomAppBarProps {
  children?: React.ReactNode; // Usually 4 icons
  fab?: React.ReactNode;
  className?: string;
}

export const BottomAppBar: React.FC<BottomAppBarProps> = ({ children, fab, className }) => {
  return (
    <div className={cn("w-full h-20u bg-surface-container px-4u flex items-center gap-2u relative z-20", className)}>
        <div className="flex-1 flex items-center gap-1u text-on-surface-variant">
            {children}
        </div>
        {fab && (
            <div className="relative -top-6u shadow-2 rounded-[16px] z-30">
                {fab}
            </div>
        )}
    </div>
  );
};