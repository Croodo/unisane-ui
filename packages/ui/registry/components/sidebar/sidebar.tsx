"use client";

import React, {
  forwardRef,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useId,
} from "react";
import { cn, Slot } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import { Ripple } from "../ripple";

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex h-full", className)} {...props}>
        {children}
      </div>
    );
  }
);
Sidebar.displayName = "Sidebar";

export interface SidebarRailProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export const SidebarRail = forwardRef<HTMLElement, SidebarRailProps>(
  ({ children, className, ...props }, ref) => {
    const { handleRailLeave, railWidth, isMobile, isTablet, isDrawerVisible } =
      useSidebar();

    // Hide rail on mobile and tablet (tablet uses top app bar instead)
    if (isMobile || isTablet) return null;

    return (
      <nav
        ref={ref}
        className={cn(
          "fixed left-0 top-0 h-screen flex flex-col items-center",
          "bg-surface-container text-on-surface py-3 gap-1",
          "z-50 shrink-0",
          "transition-all duration-medium ease-standard",
          // Only show border when drawer is visible
          isDrawerVisible && "border-r border-outline-variant",
          className
        )}
        style={{ width: railWidth }}
        onMouseLeave={handleRailLeave}
        aria-label="Sidebar Navigation"
        {...props}
      >
        {children}
      </nav>
    );
  }
);
SidebarRail.displayName = "SidebarRail";

export interface SidebarRailItemProps {
  id: string;
  label: string;
  icon: React.ReactNode | string;
  activeIcon?: React.ReactNode | string;
  badge?: string | number;
  disabled?: boolean;
  href?: string;
  asChild?: boolean;
  children?: React.ReactNode;
  childIds?: string[];
}

const renderIcon = (
  icon: React.ReactNode | string,
  isActive: boolean = false
) => {
  if (typeof icon === "string") {
    return (
      <span
        className="material-symbols-outlined text-[22px]! transition-all duration-short"
        style={
          isActive
            ? { fontVariationSettings: "'FILL' 1, 'wght' 500" }
            : { fontVariationSettings: "'wght' 400" }
        }
      >
        {icon}
      </span>
    );
  }
  return icon;
};

export function SidebarRailItem({
  id,
  label,
  icon,
  activeIcon,
  badge,
  disabled,
  href,
  asChild,
  children,
  childIds = [],
}: SidebarRailItemProps) {
  const { activeId, handleClick, handleHover, hasActiveChild } = useSidebar();
  const isDirectlyActive = activeId === id;
  const hasChildActive = childIds.length > 0 && hasActiveChild(id, childIds);
  const isActive = isDirectlyActive || hasChildActive;

  const content = (
    <>
      <div className="relative flex items-center justify-center">
        <div
          className={cn(
            "w-13 h-7 rounded-xl flex items-center justify-center",
            "transition-all duration-medium ease-emphasized overflow-hidden relative",
            isActive
              ? "bg-secondary-container text-primary"
              : "text-on-surface-variant bg-transparent hover:bg-on-surface/8"
          )}
        >
          <Ripple center disabled={disabled} />
          <span className="z-10 relative flex items-center justify-center">
            {isActive && activeIcon
              ? renderIcon(activeIcon, true)
              : renderIcon(icon, isActive)}
          </span>
        </div>

        {badge !== undefined && (
          <span
            className={cn(
              "absolute -top-0.5 -right-0.5 min-w-3 h-3 px-0.5",
              "bg-error text-on-error text-[10px] leading-none",
              "flex items-center justify-center rounded-full font-medium",
              "z-20 pointer-events-none ring-1 ring-surface",
              typeof badge === "number" && badge < 10 && "min-w-2 h-2 p-0.5"
            )}
          >
            {badge}
          </span>
        )}
      </div>

      <span
        className={cn(
          "text-label-small transition-colors duration-short",
          "text-center px-0.5 max-w-full",
          isActive
            ? "text-primary font-bold"
            : "text-on-surface-variant font-medium group-hover:text-on-surface"
        )}
      >
        {label}
      </span>
    </>
  );

  const commonClasses = cn(
    "group flex flex-col items-center gap-0.5 w-full py-1 min-h-12",
    "relative select-none cursor-pointer outline-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    "focus-visible:ring-offset-2 rounded-sm",
    disabled && "opacity-38 cursor-not-allowed pointer-events-none"
  );

  const commonProps = {
    onClick: (e: React.MouseEvent) => {
      if (disabled) {
        e.preventDefault();
        return;
      }
      handleClick(id);
    },
    onMouseEnter: () => !disabled && handleHover(id),
    className: commonClasses,
    "aria-current": isActive ? ("page" as const) : undefined,
    "aria-disabled": disabled || undefined,
  };

  if (asChild && children) {
    return (
      <Slot {...commonProps}>
        {isValidElement(children)
          ? cloneElement(children as React.ReactElement, {}, content)
          : children}
      </Slot>
    );
  }

  if (href) {
    return (
      <a
        href={disabled ? undefined : href}
        {...commonProps}
        tabIndex={disabled ? -1 : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button {...commonProps} disabled={disabled}>
      {content}
    </button>
  );
}

export interface SidebarDrawerProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export const SidebarDrawer = forwardRef<HTMLElement, SidebarDrawerProps>(
  ({ children, className, ...props }, ref) => {
    const {
      isDrawerVisible,
      expanded,
      mobileOpen,
      isMobile,
      isTablet,
      handleDrawerEnter,
      handleDrawerLeave,
      railWidth,
      drawerWidth,
      mobileDrawerWidth,
    } = useSidebar();

    // Tablet behaves like mobile for drawer (overlay from left edge)
    const usesOverlayDrawer = isMobile || isTablet;
    const isOpen = usesOverlayDrawer ? mobileOpen : isDrawerVisible;
    const isOverlay = usesOverlayDrawer || !expanded;
    const effectiveWidth = usesOverlayDrawer ? mobileDrawerWidth : drawerWidth;

    return (
      <aside
        ref={ref}
        className={cn(
          "fixed top-0 flex flex-col",
          // Use dvh for mobile (accounts for browser chrome), screen for desktop
          usesOverlayDrawer ? "h-dvh" : "h-screen",
          "bg-surface-container text-on-surface",
          "transition-transform duration-emphasized ease-emphasized",
          "overflow-hidden", // Let SidebarContent handle scrolling
          usesOverlayDrawer && "left-0 z-60 max-w-[85vw]",
          !usesOverlayDrawer && "z-30",
          isOverlay && isOpen && "shadow-3",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
        style={{
          width: effectiveWidth,
          left: usesOverlayDrawer ? 0 : railWidth,
        }}
        onMouseEnter={!usesOverlayDrawer ? handleDrawerEnter : undefined}
        onMouseLeave={!usesOverlayDrawer ? handleDrawerLeave : undefined}
        aria-hidden={!isOpen}
        {...props}
      >
        {children}
      </aside>
    );
  }
);
SidebarDrawer.displayName = "SidebarDrawer";

export interface SidebarHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const SidebarHeader = forwardRef<HTMLDivElement, SidebarHeaderProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("shrink-0 px-4 pt-4 pb-2", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SidebarHeader.displayName = "SidebarHeader";

export interface SidebarFooterProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const SidebarFooter = forwardRef<HTMLDivElement, SidebarFooterProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("shrink-0 mt-auto px-4 pb-4 pt-2", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SidebarFooter.displayName = "SidebarFooter";

export interface SidebarContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const SidebarContent = forwardRef<HTMLDivElement, SidebarContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex-1 overflow-y-auto px-2 py-2", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SidebarContent.displayName = "SidebarContent";

export interface SidebarGroupProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const SidebarGroup = forwardRef<HTMLDivElement, SidebarGroupProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-1", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SidebarGroup.displayName = "SidebarGroup";

export interface SidebarGroupLabelProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const SidebarGroupLabel = forwardRef<
  HTMLDivElement,
  SidebarGroupLabelProps
>(({ children, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "px-4 py-2 text-label-small font-semibold text-on-surface-variant",
        "uppercase tracking-wider",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

export interface SidebarMenuProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export const SidebarMenu = forwardRef<HTMLElement, SidebarMenuProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn("flex flex-col gap-0.5", className)}
        {...props}
      >
        {children}
      </nav>
    );
  }
);
SidebarMenu.displayName = "SidebarMenu";

export interface SidebarMenuItemProps {
  id?: string;
  href?: string;
  icon?: React.ReactNode | string;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export function SidebarMenuItem({
  id,
  href,
  icon,
  label,
  active,
  disabled,
  onClick,
  children,
  className,
  asChild,
}: SidebarMenuItemProps) {
  const sidebar = useSidebar();
  const isControlled = active !== undefined;
  const isActive = isControlled ? active : id ? sidebar.activeId === id : false;

  const handleItemClick = () => {
    if (disabled) return;
    if (id) {
      sidebar.setActiveId(id);
    }
    onClick?.();
    if (sidebar.isMobile) {
      sidebar.setMobileOpen(false);
    }
  };

  const innerContent = (
    <>
      <Ripple disabled={disabled} />
      {icon && (
        <span className="shrink-0">
          {typeof icon === "string" ? (
            <span
              className="material-symbols-outlined text-[20px]!"
              style={
                isActive ? { fontVariationSettings: "'FILL' 1" } : undefined
              }
            >
              {icon}
            </span>
          ) : (
            icon
          )}
        </span>
      )}
      <span className="flex-1 truncate">{label}</span>
    </>
  );

  const itemClasses = cn(
    "flex items-center gap-3 px-4 py-3 rounded-xl",
    "text-body-medium transition-colors duration-short cursor-pointer",
    "relative overflow-hidden select-none",
    isActive
      ? "bg-secondary-container text-primary font-semibold"
      : "text-on-surface-variant font-medium hover:bg-on-surface/8 hover:text-on-surface",
    disabled && "opacity-38 cursor-not-allowed pointer-events-none",
    className
  );

  const commonProps = {
    onClick: handleItemClick,
    className: itemClasses,
    "aria-current": isActive ? ("page" as const) : undefined,
  };

  if (asChild && children) {
    return (
      <Slot {...commonProps}>
        {isValidElement(children)
          ? cloneElement(children as React.ReactElement, {}, innerContent)
          : children}
      </Slot>
    );
  }

  if (href && !disabled) {
    return (
      <a href={href} {...commonProps}>
        {innerContent}
      </a>
    );
  }

  return (
    <button {...commonProps} disabled={disabled}>
      {innerContent}
    </button>
  );
}

export interface SidebarTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export const SidebarTrigger = forwardRef<
  HTMLButtonElement,
  SidebarTriggerProps
>(({ children, className, onClick, ...props }, ref) => {
  const { isMobile, toggleMobile, toggleExpanded } = useSidebar();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isMobile) {
      toggleMobile();
    } else {
      toggleExpanded();
    }
    onClick?.(e);
  };

  return (
    <button
      ref={ref}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center",
        "w-10 h-10 rounded-full",
        "text-on-surface-variant hover:bg-on-surface/8",
        "transition-colors duration-short",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className
      )}
      aria-label="Toggle sidebar"
      {...props}
    >
      {children || <span className="material-symbols-outlined">menu</span>}
    </button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

export type SidebarBackdropProps = React.HTMLAttributes<HTMLDivElement>;

export function SidebarBackdrop({ className, ...props }: SidebarBackdropProps) {
  const {
    isDrawerVisible,
    expanded,
    mobileOpen,
    isMobile,
    isTablet,
    setMobileOpen,
  } = useSidebar();

  // Tablet behaves like mobile for backdrop
  const usesOverlayDrawer = isMobile || isTablet;
  const isVisible = mobileOpen || (isDrawerVisible && !expanded);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 bg-scrim/30 transition-opacity duration-medium ease-standard",
        usesOverlayDrawer ? "z-55" : "z-20",
        "opacity-100",
        className
      )}
      onClick={() => {
        if (mobileOpen) {
          setMobileOpen(false);
        }
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

export interface SidebarInsetProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export const SidebarInset = forwardRef<HTMLElement, SidebarInsetProps>(
  ({ children, className, style, ...props }, ref) => {
    const { contentMargin, isMobile, isTablet } = useSidebar();

    // Mobile and tablet use top app bar, so need top margin
    const usesTopAppBar = isMobile || isTablet;

    return (
      <main
        ref={ref}
        className={cn(
          "flex-1 min-h-screen flex flex-col",
          "bg-surface",
          "transition-[margin] duration-emphasized ease-emphasized",
          usesTopAppBar && "mt-16",
          className
        )}
        style={{
          marginLeft: !usesTopAppBar ? contentMargin : undefined,
          ...style,
        }}
        {...props}
      >
        {children}
      </main>
    );
  }
);
SidebarInset.displayName = "SidebarInset";

export interface SidebarCollapsibleGroupProps
  extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  label: string;
  icon?: React.ReactNode | string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  childIds?: string[];
}

export function SidebarCollapsibleGroup({
  id,
  label,
  icon,
  defaultOpen = false,
  children,
  className,
  childIds = [],
  ...props
}: SidebarCollapsibleGroupProps) {
  const { isGroupExpanded, toggleGroup, setGroupExpanded, activeId } =
    useSidebar();
  const contentId = useId();
  const defaultAppliedRef = useRef(false);
  const hasActiveChild =
    childIds.length > 0 && activeId !== null && childIds.includes(activeId);

  useEffect(() => {
    if (!defaultAppliedRef.current && defaultOpen) {
      setGroupExpanded(id, true);
      defaultAppliedRef.current = true;
    }
  }, [defaultOpen, id, setGroupExpanded]);

  useEffect(() => {
    if (hasActiveChild) {
      setGroupExpanded(id, true);
    }
  }, [hasActiveChild, id, setGroupExpanded]);

  const isOpen = isGroupExpanded(id, childIds);

  const handleToggle = () => {
    toggleGroup(id);
  };

  return (
    <div className={cn("flex flex-col", className)} {...props}>
      <button
        onClick={handleToggle}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl w-full",
          "text-body-medium transition-colors duration-short",
          "cursor-pointer select-none relative overflow-hidden",
          hasActiveChild
            ? "text-primary font-semibold"
            : "text-on-surface-variant font-medium hover:bg-on-surface/8 hover:text-on-surface"
        )}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <Ripple />
        {icon && (
          <span className="shrink-0">
            {typeof icon === "string" ? (
              <span
                className="material-symbols-outlined text-[20px]!"
                style={
                  hasActiveChild
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
              >
                {icon}
              </span>
            ) : (
              icon
            )}
          </span>
        )}
        <span className="flex-1 text-left truncate">{label}</span>
        <svg
          className={cn(
            "size-icon-sm transition-transform duration-medium ease-emphasized shrink-0",
            isOpen && "rotate-180"
          )}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div
        id={contentId}
        role="region"
        className={cn(
          "grid transition-all duration-medium ease-emphasized",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
        aria-hidden={!isOpen}
      >
        <div className="flex flex-col pl-4 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
