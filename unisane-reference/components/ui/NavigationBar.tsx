import React from 'react';
import { cn } from '../../lib/utils';

interface NavItem {
  value: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode; // Optional filled icon
}

interface NavigationBarProps {
  items: NavItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({ items, value, onChange, className }) => {
  return (
    <div className={cn("w-full h-20u bg-surface-container flex items-center justify-around px-2u", className)}>
      {items.map((item) => {
        const isActive = value === item.value;
        return (
          <button 
            key={item.value}
            onClick={() => onChange(item.value)}
            className="flex-1 h-full flex flex-col items-center justify-center gap-1u group focus-visible:outline-none cursor-pointer"
          >
            <div className={cn(
                "w-16u h-8u rounded-full flex items-center justify-center transition-all duration-400 ease-emphasized relative overflow-hidden",
                isActive ? "bg-secondary-container text-on-secondary-container w-16u" : "text-on-surface-variant w-16u bg-transparent"
            )}>
                 {/* State Layer (Hover/Active) */}
                 <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-[0.08] group-active:opacity-[0.12] transition-opacity duration-200",
                    isActive ? "bg-on-secondary-container" : "bg-on-surface-variant"
                 )} />

                 <span className={cn("z-10 relative transition-transform duration-200", isActive && "font-bold scale-110")}>
                    {isActive && item.activeIcon ? item.activeIcon : item.icon}
                 </span>
            </div>
            <span className={cn(
                "text-xs font-medium transition-colors duration-200",
                isActive ? "text-on-surface" : "text-on-surface-variant"
            )}>
                {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};