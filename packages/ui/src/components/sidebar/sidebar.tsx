"use client";

import React, { forwardRef } from "react";
import { cn } from "@ui/lib/utils";
import { useSidebar } from "./sidebar-context";
import { Ripple } from "../ripple";

// ============================================================================
// Sidebar (Root Container)
// ============================================================================

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex h-full", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Sidebar.displayName = "Sidebar";

// ============================================================================
// SidebarRail
// ============================================================================

export interface SidebarRailProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export const SidebarRail = forwardRef<HTMLElement, SidebarRailProps>(
  ({ children, className, ...props }, ref) => {
    const { handleRailLeave, railWidth, isMobile } = useSidebar();

    if (isMobile) return null;

    return (
      <nav
        ref={ref}
        className={cn(
          "fixed left-0 top-0 h-screen flex flex-col items-center",
          "bg-surface-container text-on-surface py-3u gap-1u",
          "border-r border-outline-variant z-[50] shrink-0",
          "transition-all duration-medium ease-standard",
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

// ============================================================================
// SidebarRailItem
// ============================================================================

export interface SidebarRailItemProps {
  id: string;
  label: string;
  icon: React.ReactNode | string;
  activeIcon?: React.ReactNode | string;
  badge?: string | number;
  disabled?: boolean;
  href?: string;
}

const renderIcon = (icon: React.ReactNode | string, isActive: boolean = false) => {
  if (typeof icon === "string") {
    return (
      <span
        className={cn(
          "material-symbols-outlined text-[20px]! transition-transform duration-short",
          isActive && "scale-105"
        )}
        style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
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
}: SidebarRailItemProps) {
  const { activeId, handleClick, handleHover } = useSidebar();
  const isActive = activeId === id;

  const content = (
    <>
      <div className="relative flex items-center justify-center">
        <div
          className={cn(
            "w-12u h-7u rounded-full flex items-center justify-center",
            "transition-all duration-medium ease-emphasized overflow-hidden relative",
            isActive
              ? "bg-secondary-container text-on-secondary-container"
              : "text-on-surface-variant bg-transparent hover:bg-on-surface/8"
          )}
        >
          <Ripple center disabled={disabled} />
          <span className="z-10 relative">
            {isActive && activeIcon
              ? renderIcon(activeIcon, true)
              : renderIcon(icon, isActive)}
          </span>
        </div>

        {badge !== undefined && (
          <span
            className={cn(
              "absolute -top-0.5u -right-0.5u min-w-3u h-3u px-0.5u",
              "bg-error text-on-error text-[10px] leading-none",
              "flex items-center justify-center rounded-full font-medium",
              "z-20 pointer-events-none ring-1 ring-surface",
              typeof badge === "number" && badge < 10 && "min-w-2u h-2u p-0.5u"
            )}
          >
            {badge}
          </span>
        )}
      </div>

      <span
        className={cn(
          "text-[11px] leading-none font-medium transition-colors duration-short",
          "text-center px-0.5u max-w-full tracking-normal",
          isActive
            ? "text-on-surface font-semibold"
            : "text-on-surface-variant group-hover:text-on-surface"
        )}
      >
        {label}
      </span>
    </>
  );

  const commonClasses = cn(
    "group flex flex-col items-center gap-0.5u w-full py-1u min-h-12u",
    "relative select-none cursor-pointer outline-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    "focus-visible:ring-offset-2 rounded-sm",
    disabled && "opacity-38 cursor-not-allowed pointer-events-none"
  );

  if (href) {
    return (
      <a
        href={disabled ? undefined : href}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
            return;
          }
          handleClick(id);
        }}
        onMouseEnter={() => !disabled && handleHover(id)}
        className={commonClasses}
        aria-current={isActive ? "page" : undefined}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      onClick={() => !disabled && handleClick(id)}
      onMouseEnter={() => !disabled && handleHover(id)}
      disabled={disabled}
      className={commonClasses}
      aria-current={isActive ? "page" : undefined}
    >
      {content}
    </button>
  );
}

// ============================================================================
// SidebarDrawer
// ============================================================================

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
      handleDrawerEnter,
      handleDrawerLeave,
      railWidth,
      drawerWidth,
    } = useSidebar();

    const isOpen = isMobile ? mobileOpen : isDrawerVisible;
    const isOverlay = isMobile || !expanded;

    return (
      <aside
        ref={ref}
        className={cn(
          "fixed top-0 h-screen flex flex-col",
          "bg-surface-container text-on-surface",
          "transition-transform duration-emphasized ease-emphasized",
          "overflow-y-auto overflow-x-hidden",
          // Mobile: full drawer from left, z-60
          isMobile && "left-0 z-[60]",
          // Desktop: positioned after rail
          !isMobile && "z-[30]",
          // Shadow when overlay
          isOverlay && isOpen && "shadow-3",
          // Transform for open/close
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
        style={{
          width: drawerWidth,
          left: isMobile ? 0 : railWidth,
        }}
        onMouseEnter={!isMobile ? handleDrawerEnter : undefined}
        onMouseLeave={!isMobile ? handleDrawerLeave : undefined}
        aria-hidden={!isOpen}
        {...props}
      >
        {children}
      </aside>
    );
  }
);
SidebarDrawer.displayName = "SidebarDrawer";

// ============================================================================
// SidebarHeader
// ============================================================================

export interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const SidebarHeader = forwardRef<HTMLDivElement, SidebarHeaderProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("shrink-0 px-4u pt-4u pb-2u", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SidebarHeader.displayName = "SidebarHeader";

// ============================================================================
// SidebarFooter
// ============================================================================

export interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const SidebarFooter = forwardRef<HTMLDivElement, SidebarFooterProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("shrink-0 mt-auto px-4u pb-4u pt-2u", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SidebarFooter.displayName = "SidebarFooter";

// ============================================================================
// SidebarContent
// ============================================================================

export interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const SidebarContent = forwardRef<HTMLDivElement, SidebarContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex-1 overflow-y-auto px-2u py-2u", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SidebarContent.displayName = "SidebarContent";

// ============================================================================
// SidebarGroup
// ============================================================================

export interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const SidebarGroup = forwardRef<HTMLDivElement, SidebarGroupProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-1u", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SidebarGroup.displayName = "SidebarGroup";

// ============================================================================
// SidebarGroupLabel
// ============================================================================

export interface SidebarGroupLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const SidebarGroupLabel = forwardRef<HTMLDivElement, SidebarGroupLabelProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "px-3u py-2u text-label-small font-semibold text-on-surface-variant",
          "uppercase tracking-wider",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SidebarGroupLabel.displayName = "SidebarGroupLabel";

// ============================================================================
// SidebarMenu
// ============================================================================

export interface SidebarMenuProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export const SidebarMenu = forwardRef<HTMLElement, SidebarMenuProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn("flex flex-col gap-0.5u", className)}
        {...props}
      >
        {children}
      </nav>
    );
  }
);
SidebarMenu.displayName = "SidebarMenu";

// ============================================================================
// SidebarMenuItem
// ============================================================================

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
}: SidebarMenuItemProps) {
  const sidebar = useSidebar();
  const isActive = active ?? (id ? sidebar.activeId === id : false);

  const handleItemClick = () => {
    if (disabled) return;
    if (id) {
      sidebar.setActiveId(id);
    }
    onClick?.();
    // Close mobile menu on selection
    if (sidebar.isMobile) {
      sidebar.setMobileOpen(false);
    }
  };

  const content = (
    <>
      {icon && (
        <span className="shrink-0">
          {typeof icon === "string" ? (
            <span
              className="material-symbols-outlined text-[20px]!"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {icon}
            </span>
          ) : (
            icon
          )}
        </span>
      )}
      <span className="flex-1 truncate">{label}</span>
      {children}
    </>
  );

  const itemClasses = cn(
    "flex items-center gap-3u px-3u py-2u rounded-full",
    "text-body-medium transition-colors duration-short cursor-pointer",
    "relative overflow-hidden select-none",
    isActive
      ? "bg-secondary-container text-on-secondary-container font-medium"
      : "text-on-surface-variant hover:bg-on-surface/8 hover:text-on-surface",
    disabled && "opacity-38 cursor-not-allowed pointer-events-none",
    className
  );

  if (href && !disabled) {
    return (
      <a
        href={href}
        onClick={handleItemClick}
        className={itemClasses}
        aria-current={isActive ? "page" : undefined}
      >
        <Ripple disabled={disabled} />
        {content}
      </a>
    );
  }

  return (
    <button
      onClick={handleItemClick}
      disabled={disabled}
      className={itemClasses}
      aria-current={isActive ? "page" : undefined}
    >
      <Ripple disabled={disabled} />
      {content}
    </button>
  );
}

// ============================================================================
// SidebarTrigger
// ============================================================================

export interface SidebarTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export const SidebarTrigger = forwardRef<HTMLButtonElement, SidebarTriggerProps>(
  ({ children, className, onClick, ...props }, ref) => {
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
          "w-10u h-10u rounded-full",
          "text-on-surface-variant hover:bg-on-surface/8",
          "transition-colors duration-short",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          className
        )}
        aria-label="Toggle sidebar"
        {...props}
      >
        {children || (
          <span className="material-symbols-outlined">menu</span>
        )}
      </button>
    );
  }
);
SidebarTrigger.displayName = "SidebarTrigger";

// ============================================================================
// SidebarBackdrop
// ============================================================================

export interface SidebarBackdropProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarBackdrop({ className, ...props }: SidebarBackdropProps) {
  const { isDrawerVisible, expanded, mobileOpen, isMobile, setMobileOpen, handleRailLeave } = useSidebar();

  const shouldShow = mobileOpen || (isDrawerVisible && !expanded);
  const isVisible = mobileOpen || (isDrawerVisible && !expanded);

  if (!shouldShow) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 bg-scrim/30 transition-opacity duration-medium ease-standard",
        isMobile ? "z-[55]" : "z-[20]",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
        className
      )}
      onClick={() => {
        if (mobileOpen) setMobileOpen(false);
        handleRailLeave();
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

// ============================================================================
// SidebarInset (Main Content Area)
// ============================================================================

export interface SidebarInsetProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export const SidebarInset = forwardRef<HTMLElement, SidebarInsetProps>(
  ({ children, className, style, ...props }, ref) => {
    const { contentMargin, isMobile } = useSidebar();

    return (
      <main
        ref={ref}
        className={cn(
          "flex-1 min-h-screen flex flex-col",
          "bg-surface-container-lowest",
          "transition-[margin] duration-emphasized ease-emphasized",
          // Mobile: add top margin for top bar
          isMobile && "mt-16u",
          className
        )}
        style={{
          marginLeft: !isMobile ? contentMargin : undefined,
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
