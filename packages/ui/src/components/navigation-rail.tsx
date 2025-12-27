import React, { cloneElement, isValidElement } from "react";
import { cn, Slot } from "@ui/lib/utils";
import { Ripple } from "./ripple";

export interface RailItem {
  value: string;
  label: string;
  icon: React.ReactNode | string;
  activeIcon?: React.ReactNode | string;
  badge?: string | number;
  disabled?: boolean;
  href?: string;
  asChild?: boolean;
  linkElement?: React.ReactNode;
}

// Helper to render icon - handles both ReactNode and Material Symbol string
const renderIcon = (icon: React.ReactNode | string, isActive: boolean = false) => {
  if (typeof icon === "string") {
    return (
      <span
        className="material-symbols-outlined text-[26px]! transition-all duration-short"
        style={isActive ? { fontVariationSettings: "'FILL' 1, 'wght' 500" } : { fontVariationSettings: "'wght' 400" }}
      >
        {icon}
      </span>
    );
  }
  return icon;
};

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
        "flex flex-col items-center w-24u h-full bg-surface-container text-on-surface py-3u gap-1u border-r border-outline-variant z-[50] shrink-0 transition-all duration-medium ease-standard",
        className
      )}
      aria-label="Sidebar Navigation"
      onMouseLeave={onMouseLeave}
    >
      {header && (
        <div className="flex flex-col items-center gap-4u pb-2u w-full">
          {header}
        </div>
      )}

      <div
        className={cn(
          "flex flex-col items-center gap-3u w-full flex-1",
          alignment === "center" && "justify-center",
          alignment === "end" && "justify-end pb-4u"
        )}
      >
        {items.map((item) => {
          const isActive = value === item.value;

          const content = (
            <>
              <div className="relative flex items-center justify-center">
                <div
                  className={cn(
                    "w-14u h-8u rounded-full flex items-center justify-center transition-all duration-medium ease-emphasized overflow-hidden relative",
                    isActive
                      ? "bg-secondary-container text-primary"
                      : "text-on-surface-variant bg-transparent hover:bg-on-surface/8"
                  )}
                >
                  <Ripple center disabled={item.disabled} />
                  {isActive && item.activeIcon
                    ? renderIcon(item.activeIcon, true)
                    : renderIcon(item.icon, isActive)}
                </div>

                {item.badge !== undefined && (
                  <span
                    className={cn(
                      "absolute -top-0.5u -right-0.5u min-w-3u h-3u px-0.5u bg-error text-on-error text-[10px] leading-none flex items-center justify-center rounded-full font-medium z-20 pointer-events-none ring-1 ring-surface",
                      typeof item.badge === "number" && item.badge < 10
                        ? "min-w-2u h-2u p-0.5u"
                        : ""
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              <span
                className={cn(
                  "text-label-medium transition-colors duration-short text-center px-0.5u max-w-full",
                  isActive
                    ? "text-primary font-bold"
                    : "text-on-surface-variant font-semibold group-hover:text-on-surface"
                )}
              >
                {item.label}
              </span>
            </>
          );

          const commonClasses = cn(
            "group flex flex-col items-center gap-0.5u w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm py-1u min-h-12u relative select-none cursor-pointer outline-none",
            item.disabled && "opacity-38 cursor-not-allowed pointer-events-none"
          );

          const commonProps = {
            onClick: (e: React.MouseEvent) => {
              if (item.disabled) {
                e.preventDefault();
                return;
              }
              onChange(item.value);
            },
            onMouseEnter: () => !item.disabled && onItemHover && onItemHover(item.value),
            className: commonClasses,
            "aria-current": isActive ? ("page" as const) : undefined,
            "aria-disabled": item.disabled || undefined,
          };

          // asChild pattern: render user's Link component with merged props
          if (item.asChild && item.linkElement) {
            return (
              <Slot key={item.value} {...commonProps}>
                {isValidElement(item.linkElement)
                  ? cloneElement(item.linkElement as React.ReactElement, {}, content)
                  : item.linkElement}
              </Slot>
            );
          }

          if (item.href) {
            return (
              <a
                key={item.value}
                href={item.disabled ? undefined : item.href}
                {...commonProps}
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
        <div className="flex flex-col items-center gap-4u pt-2u w-full mt-auto mb-4u">
          {footer}
        </div>
      )}
    </nav>
  );
};
