
"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Ripple } from "./ripple";
import { focusRing } from "../../utils/focus-ring";
import { animations } from "../../utils/animations";

export interface RailItem {
  value: string;
  label: string;
  icon: React.ReactNode | string;
  activeIcon?: React.ReactNode | string;
  badge?: string | number;
  disabled?: boolean;
  href?: string;
}

// Reverted to 'border-outline-variant' (no opacity) for correct darkness level
const navigationRailVariants = cva(
  cn("flex flex-col items-center w-[80px] h-full bg-surface-container text-on-surface py-4u gap-6 border-r border-outline-variant z-50 shrink-0", animations.transition.all),
  {
    variants: {},
    defaultVariants: {},
  }
);

const railItemsContainerVariants = cva("flex flex-col items-center gap-3u w-full flex-1", {
  variants: {
    alignment: {
      start: "",
      center: "justify-center",
      end: "justify-end pb-4u",
    },
  },
  defaultVariants: {
    alignment: "start",
  },
});

interface NavigationRailProps extends VariantProps<typeof navigationRailVariants> {
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

const renderIcon = (icon: React.ReactNode | string, isActive: boolean = false) => {
    if (typeof icon === 'string') {
        return (
            <span className={cn(
                "material-symbols-outlined !text-[24px] transition-transform duration-short",
                isActive && "scale-110"
            )}
            style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
                {icon}
            </span>
        );
    }
    return icon;
};

export const NavigationRailPrimitive: React.FC<NavigationRailProps> = ({
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
      className={cn(navigationRailVariants(), className)}
      aria-label="Sidebar Navigation"
      onMouseLeave={onMouseLeave}
    >
      {header && (
        <div className="flex flex-col items-center gap-4u pb-2u w-full">
          {header}
        </div>
      )}

      <div className={cn(railItemsContainerVariants({ alignment }))}>
        {items.map((item) => {
          const isActive = value === item.value;

          const content = (
            <>
              <div className="relative flex items-center justify-center">
                <div
                  className={cn(
                    "w-14u h-8u rounded-full flex items-center justify-center transition-all duration-medium ease-emphasized overflow-hidden relative",
                    isActive
                      ? "bg-secondary-container text-on-secondary-container"
                      : "text-on-surface-variant bg-transparent hover:bg-on-surface/8"
                  )}
                >
                  <Ripple center disabled={item.disabled} />
                  <span className="z-10 relative">
                    {isActive && item.activeIcon ? renderIcon(item.activeIcon, true) : renderIcon(item.icon, isActive)}
                  </span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={cn(
                      "absolute -top-1u -right-1u min-w-4u h-4u px-1u bg-error text-on-error text-label-small leading-none flex items-center justify-center rounded-full font-medium z-20 pointer-events-none ring-2 ring-surface-container",
                      typeof item.badge === "number" && item.badge < 10 ? "min-w-3u h-3u p-1u" : ""
                    )}
                  >
                    {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              <span
                className={cn(
                  "text-label-small leading-none font-medium transition-colors duration-short text-center px-1u max-w-full tracking-wide mt-1u",
                  isActive
                    ? "text-on-surface font-bold"
                    : "text-on-surface-variant group-hover:text-on-surface"
                )}
              >
                {item.label}
              </span>
            </>
          );

          const commonClasses = cn(
            "group flex flex-col items-center gap-0.5u w-full rounded-sm py-1u min-h-14u relative select-none cursor-pointer outline-none",
            focusRing.default,
            item.disabled && "opacity-38 cursor-not-allowed pointer-events-none"
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
                  e.preventDefault();
                  onChange(item.value);
                }}
                onMouseEnter={() => !item.disabled && onItemHover && onItemHover(item.value)}
                onFocus={() => !item.disabled && onItemHover && onItemHover(item.value)}
                className={commonClasses}
                aria-current={isActive ? "page" : undefined}
                aria-disabled={item.disabled || undefined}
                tabIndex={item.disabled ? -1 : 0}
              >
                {content}
              </a>
            );
          }

          return (
            <button
              key={item.value}
              onClick={() => !item.disabled && onChange(item.value)}
              onMouseEnter={() => !item.disabled && onItemHover && onItemHover(item.value)}
              onFocus={() => !item.disabled && onItemHover && onItemHover(item.value)}
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
        <div className="flex flex-col items-center gap-4u pt-2u w-full mt-auto mb-4u">
          {footer}
        </div>
      )}
    </nav>
  );
};