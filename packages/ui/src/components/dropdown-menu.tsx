"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { cn } from "@ui/lib/utils";
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
      return React.cloneElement(child as React.ReactElement<any>, {
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

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn("inline-flex cursor-pointer", className)}
      aria-expanded={isOpen}
      aria-haspopup="menu"
      aria-controls={menuId}
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
        "absolute z-50 mt-1u min-w-[calc(var(--unit)*50)]",
        align === "end" ? "right-0" : "left-0",
        className
      )}
    >
      <Menu
        open={true}
        className="w-full relative shadow-3 border border-outline-variant/20"
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
