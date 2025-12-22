import React, { useState, useRef } from 'react';
import { cn } from '../../lib/utils';

interface HoverCardProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  openDelay?: number;
  closeDelay?: number;
}

export const HoverCard: React.FC<HoverCardProps> = ({ 
  trigger, 
  children, 
  className,
  openDelay = 200,
  closeDelay = 150
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setIsOpen(true), openDelay);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setIsOpen(false), closeDelay);
  };

  return (
    <div 
        className="relative inline-block" 
        onMouseEnter={handleMouseEnter} 
        onMouseLeave={handleMouseLeave}
    >
      <div className="cursor-default">{trigger}</div>
      
      {isOpen && (
        <div 
            className={cn(
                "absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-50 w-[300px] bg-surface rounded-xl shadow-3 border border-outline-variant p-4u animate-in fade-in zoom-in-95 duration-200",
                className
            )}
        >
          {children}
        </div>
      )}
    </div>
  );
};