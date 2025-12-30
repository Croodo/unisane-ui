"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { cn, Slot } from "@ui/lib/utils";
import {
  Menu,
  MenuItem,
  MenuDivider,
  MenuCheckboxItem,
  MenuRadioItem,
} from "@ui/primitives/menu";

export interface DropdownMenuProps {
  children: React.ReactNode;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();

  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
        isOpen,
        setIsOpen,
        menuId,
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
}

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({
  children,
  isOpen,
  setIsOpen,
  menuId,
  asChild,
  className,
}) => {
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
      <Slot className={className} {...triggerProps}>
        {children}
      </Slot>
    );
  }

  return (
    <button
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
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  children,
  isOpen,
  setIsOpen,
  menuId,
  align = "start",
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen?.(false);
      }
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
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      id={menuId}
      role="menu"
      aria-orientation="vertical"
      className={cn(
        "absolute z-popover mt-1",
        "animate-in fade-in-0 zoom-in-95 duration-snappy ease-emphasized",
        align === "end" ? "right-0" : "left-0"
      )}
    >
      <Menu
        open={true}
        className={cn("w-full relative shadow-2 border border-outline-variant/20 overflow-visible", className)}
      >
        {children}
      </Menu>
    </div>
  );
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
      });
    }
    return child;
  });

  return <div className="relative">{childrenWithProps}</div>;
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
}

export const DropdownMenuSubContent: React.FC<DropdownMenuSubContentProps> = ({
  children,
  isSubOpen,
  openSubmenu,
  closeSubmenu,
  subMenuId,
  className,
}) => {
  if (!isSubOpen) return null;

  return (
    <div
      id={subMenuId}
      role="menu"
      aria-orientation="vertical"
      className={cn(
        "absolute left-full top-0 z-popover ml-1",
        "animate-in fade-in-0 slide-in-from-left-1 duration-snappy ease-emphasized"
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
