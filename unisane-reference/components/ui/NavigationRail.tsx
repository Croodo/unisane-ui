
import React from 'react';
import { cn } from '../../lib/utils';
import { Ripple } from './Ripple';
import { Typography } from './Typography';

export interface RailItem {
  value: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface NavigationRailProps {
  items: RailItem[];
  value: string;
  onChange: (value: string) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  items,
  value,
  onChange,
  header,
  footer,
  className,
}) => {
  return (
    <nav 
      className={cn(
        "flex flex-col items-center w-[80px] h-full bg-white border-r border-outline-variant/30 z-[50] shrink-0", 
        className
      )}
    >
      {header && <div className="py-6u shrink-0">{header}</div>}
      
      <div className="flex-1 w-full overflow-y-auto no-scrollbar py-2u flex flex-col items-center gap-1u">
          {items.map((item) => {
            const isActive = value === item.value;
            return (
              <button
                key={item.value}
                onClick={() => !item.disabled && onChange(item.value)}
                disabled={item.disabled}
                className={cn(
                  "group flex flex-col items-center gap-1.5u w-full py-3u relative select-none shrink-0 transition-all duration-snappy outline-none",
                  item.disabled && "opacity-38 cursor-not-allowed"
                )}
                aria-selected={isActive}
              >
                <div className="relative flex items-center justify-center">
                    <div className={cn(
                      "w-14u h-8u rounded-xs flex items-center justify-center transition-all duration-standard ease-emphasized overflow-hidden relative",
                      isActive ? "bg-primary text-on-primary shadow-2" : "text-on-surface-variant hover:bg-surface-variant/80"
                    )}>
                      {!item.disabled && <Ripple center />}
                      <span className="z-10 relative scale-110">
                          {isActive && item.activeIcon ? item.activeIcon : item.icon}
                      </span>
                    </div>
                    {item.badge !== undefined && (
                        <span className="absolute -top-1u -right-1u min-w-4u h-4u px-1u bg-error text-on-error text-[9px] flex items-center justify-center rounded-full font-black z-20 border-2 border-surface shadow-sm">
                            {item.badge}
                        </span>
                    )}
                </div>
                <span className={cn(
                    "text-[10px] leading-none font-black uppercase transition-colors duration-snappy text-center px-1u max-w-full truncate tracking-tighter",
                    isActive ? "text-primary" : "text-on-surface-variant/50 group-hover:text-on-surface"
                )}>
                    {item.label}
                </span>
              </button>
            );
          })}
      </div>

      {footer && <div className="py-6u shrink-0">{footer}</div>}
    </nav>
  );
};
