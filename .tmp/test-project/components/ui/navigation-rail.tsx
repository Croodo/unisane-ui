import React from "react";
import { cn } from '@/lib/utils';
import { Ripple } from "./ripple";

export interface RailItem {
  value: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  href?: string;
}

interface NavigationRailProps {
  items: RailItem[];
  value: string;
  onChange: (value: string) => void;
  onItemHover?: (value: string) => void;
  onMouseLeave?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  alignment?: "start" | "center" | "end";
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  items,
  value,
  onChange,
  onItemHover,
  onMouseLeave,
  header,
  footer,
  className,
  alignment = "start",
}) => {
  return (
    <nav
      className={cn(
        "flex flex-col items-center w-[var(--width-rail-collapsed)] h-full bg-surface text-on-surface py-4 gap-6 border-r border-outline-variant/30 z-20 shrink-0 transition-all duration-medium ease-standard",
        className
      )}
      aria-label="Sidebar Navigation"
      onMouseLeave={onMouseLeave}
    >
      {header && (
        <div className="flex flex-col items-center gap-4 pb-2 w-full">
          {header}
        </div>
      )}

      <div
        className={cn(
          "flex flex-col items-center gap-3 w-full flex-1",
          alignment === "center" && "justify-center",
          alignment === "end" && "justify-end pb-4"
        )}
      >
        {items.map((item) => {
          const isActive = value === item.value;

          const content = (
            <>
              <div className="relative flex items-center justify-center">
                <div
                  className={cn(
                    "w-14 h-8 rounded-sm flex items-center justify-center transition-all duration-medium ease-emphasized overflow-hidden relative",
                    isActive
                      ? "bg-secondary-container text-on-secondary-container"
                      : "text-on-surface-variant bg-transparent hover:bg-on-surface/8"
                  )}
                >
                  <Ripple center disabled={item.disabled} />
                  <span className="z-10 relative scale-110">
                    {isActive && item.activeIcon ? item.activeIcon : item.icon}
                  </span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={cn(
                      "absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-error text-on-error text-label-small leading-none flex items-center justify-center rounded-full font-medium z-20 pointer-events-none ring-1 ring-surface",
                      typeof item.badge === "number" && item.badge < 10
                        ? "min-w-3 h-3 p-1"
                        : ""
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              <span
                className={cn(
                  "text-label-small leading-none font-semibold transition-colors duration-short text-center px-1 max-w-full opacity-60",
                  isActive
                    ? "text-on-surface opacity-100"
                    : "text-on-surface-variant group-hover:text-on-surface group-hover:opacity-80"
                )}
              >
                {item.label}
              </span>
            </>
          );

          const commonClasses = cn(
            "group flex flex-col items-center gap-1 w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm py-1 min-h-14 relative select-none",
            item.disabled && "opacity-38 cursor-not-allowed"
          );

          if (item.href) {
            return (
              <a
                key={item.value}
                href={item.disabled ? undefined : item.href}
                onClick={(e) => {
                  if (item.disabled) {
                    e.preventDefault();
                    return;
                  }
                  onChange(item.value);
                }}
                onMouseEnter={() =>
                  !item.disabled && onItemHover && onItemHover(item.value)
                }
                className={commonClasses}
                aria-current={isActive ? "page" : undefined}
                aria-disabled={item.disabled || undefined}
                tabIndex={item.disabled ? -1 : undefined}
              >
                {content}
              </a>
            );
          }

          return (
            <button
              key={item.value}
              onClick={() => !item.disabled && onChange(item.value)}
              onMouseEnter={() =>
                !item.disabled && onItemHover && onItemHover(item.value)
              }
              disabled={item.disabled}
              className={commonClasses}
              aria-current={isActive ? "page" : undefined}
            >
              {content}
            </button>
          );
        })}
      </div>

      {footer && (
        <div className="flex flex-col items-center gap-4 pt-2 w-full">
          {footer}
        </div>
      )}
    </nav>
  );
};
