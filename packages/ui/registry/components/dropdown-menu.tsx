"use client";

import React, { useState, useRef, useEffect, useId, useMemo } from "react";
import { createPortal } from "react-dom";
import { cn, Slot } from "@/lib/utils";
import {
  Menu,
  MenuItem,
  MenuDivider,
  MenuCheckboxItem,
  MenuRadioItem,
} from "@/primitives/menu";

export interface DropdownMenuProps {
  children: React.ReactNode;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLElement>(null);

  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
        isOpen,
        setIsOpen,
        menuId,
        triggerRef,
      });
    }
    return child;
  });

  return (
    <div className="relative inline-block text-left">{childrenWithProps}</div>
  );
};

export interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  menuId?: string;
  asChild?: boolean;
  className?: string;
  triggerRef?: React.RefObject<HTMLElement>;
}

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({
  children,
  isOpen,
  setIsOpen,
  menuId,
  asChild,
  className,
  triggerRef,
}) => {
  const localRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync ref to parent triggerRef
  useEffect(() => {
    if (triggerRef) {
      const refToAssign = asChild ? wrapperRef.current : localRef.current;
      if (refToAssign) {
        (triggerRef as { current: HTMLElement | null }).current = refToAssign;
      }
    }
  }, [triggerRef, asChild]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen?.(!isOpen);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
      case "ArrowDown":
        e.preventDefault();
        setIsOpen?.(true);
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen?.(false);
        break;
    }
  };

  const triggerProps = {
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    "aria-expanded": isOpen,
    "aria-haspopup": "menu" as const,
    "aria-controls": menuId,
  };

  // asChild pattern: merge props into the child element
  if (asChild && React.isValidElement(children)) {
    return (
      <div ref={wrapperRef} className="inline-flex">
        <Slot className={className} {...triggerProps}>
          {children}
        </Slot>
      </div>
    );
  }

  return (
    <button
      ref={localRef}
      type="button"
      className={cn("inline-flex cursor-pointer", className)}
      {...triggerProps}
    >
      {children}
    </button>
  );
};

export interface DropdownMenuContentProps {
  children: React.ReactNode;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  menuId?: string;
  align?: "start" | "end";
  className?: string;
  /** Use portal to render dropdown at document body level (helps with z-index issues) */
  portal?: boolean;
  /** Reference to the trigger element for portal positioning */
  triggerRef?: React.RefObject<HTMLElement>;
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  children,
  isOpen,
  setIsOpen,
  menuId,
  align = "start",
  className,
  portal = false,
  triggerRef,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate position when using portal
  useEffect(() => {
    if (portal && isOpen && triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuWidth = ref.current?.offsetWidth || 0;

      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: align === "end"
          ? rect.right + window.scrollX - menuWidth
          : rect.left + window.scrollX,
      });
    }
  }, [portal, isOpen, triggerRef, align]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Don't close if clicking inside the menu
      if (ref.current && ref.current.contains(target)) return;
      // Don't close if clicking on the trigger (it has its own toggle logic)
      if (triggerRef?.current && triggerRef.current.contains(target)) return;
      setIsOpen?.(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen?.(false);
      }
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, setIsOpen, triggerRef]);

  if (!isOpen) return null;

  const content = (
    <div
      ref={ref}
      id={menuId}
      role="menu"
      aria-orientation="vertical"
      className={cn(
        portal ? "fixed z-popover" : "absolute z-popover mt-1",
        "animate-in fade-in-0 zoom-in-95 duration-snappy ease-emphasized",
        !portal && (align === "end" ? "right-0" : "left-0")
      )}
      style={portal ? { top: position.top, left: position.left } : undefined}
    >
      <Menu
        open={true}
        className={cn("w-full relative shadow-2 border border-outline-variant/20 overflow-visible", className)}
      >
        {children}
      </Menu>
    </div>
  );

  if (portal && typeof document !== "undefined") {
    return createPortal(content, document.body);
  }

  return content;
};

export const DropdownMenuItem = MenuItem;
export const DropdownMenuCheckboxItem = MenuCheckboxItem;
export const DropdownMenuRadioItem = MenuRadioItem;
export const DropdownMenuSeparator = MenuDivider;

// ─── SUBMENU COMPONENTS ────────────────────────────────────────────────────────

export interface DropdownMenuSubProps {
  children: React.ReactNode;
}

export const DropdownMenuSub: React.FC<DropdownMenuSubProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const subMenuId = useId();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const openSubmenu = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const closeSubmenu = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
        isSubOpen: isOpen,
        openSubmenu,
        closeSubmenu,
        subMenuId,
        subTriggerRef: triggerRef,
      });
    }
    return child;
  });

  return <div ref={triggerRef} className="relative">{childrenWithProps}</div>;
};

export interface DropdownMenuSubTriggerProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  isSubOpen?: boolean;
  openSubmenu?: () => void;
  closeSubmenu?: () => void;
  subMenuId?: string;
  className?: string;
  disabled?: boolean;
}

export const DropdownMenuSubTrigger: React.FC<DropdownMenuSubTriggerProps> = ({
  children,
  icon,
  isSubOpen,
  openSubmenu,
  closeSubmenu,
  subMenuId,
  className,
  disabled = false,
}) => {
  const handleMouseEnter = () => {
    if (disabled) return;
    openSubmenu?.();
  };

  const handleMouseLeave = () => {
    closeSubmenu?.();
  };

  return (
    <MenuItem
      icon={icon}
      trailingIcon={
        <span className="material-symbols-outlined text-[18px]">
          arrow_right
        </span>
      }
      className={className}
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-expanded={isSubOpen}
      aria-haspopup="menu"
      aria-controls={subMenuId}
    >
      {children}
    </MenuItem>
  );
};

export interface DropdownMenuSubContentProps {
  children: React.ReactNode;
  isSubOpen?: boolean;
  openSubmenu?: () => void;
  closeSubmenu?: () => void;
  subMenuId?: string;
  className?: string;
  /** Reference to the submenu trigger element for position calculation */
  subTriggerRef?: React.RefObject<HTMLElement>;
}

export const DropdownMenuSubContent: React.FC<DropdownMenuSubContentProps> = ({
  children,
  isSubOpen,
  openSubmenu,
  closeSubmenu,
  subMenuId,
  className,
  subTriggerRef,
}) => {
  // Calculate direction based on trigger position before rendering
  // This avoids issues with overflow:hidden clipping the measurement
  const openDirection = useMemo(() => {
    if (!isSubOpen || !subTriggerRef?.current) return "right";

    const triggerRect = subTriggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const estimatedSubmenuWidth = 200; // Approximate submenu width

    // Check if there's enough space on the right
    const spaceOnRight = viewportWidth - triggerRect.right;

    if (spaceOnRight < estimatedSubmenuWidth) {
      return "left";
    }
    return "right";
  }, [isSubOpen, subTriggerRef]);

  if (!isSubOpen) return null;

  return (
    <div
      id={subMenuId}
      role="menu"
      aria-orientation="vertical"
      className={cn(
        "absolute top-0 z-popover",
        openDirection === "right"
          ? "left-full ml-1 animate-in fade-in-0 slide-in-from-left-1"
          : "right-full mr-1 animate-in fade-in-0 slide-in-from-right-1",
        "duration-snappy ease-emphasized"
      )}
      onMouseEnter={openSubmenu}
      onMouseLeave={closeSubmenu}
    >
      <Menu
        open={true}
        className={cn("min-w-40 shadow-2 border border-outline-variant/20", className)}
      >
        {children}
      </Menu>
    </div>
  );
};
