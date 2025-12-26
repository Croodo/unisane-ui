"use client";

import React, { useState, useRef, useEffect } from "react";
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

  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        isOpen,
        setIsOpen,
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
  asChild?: boolean;
  className?: string;
}

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({
  children,
  isOpen,
  setIsOpen,
  asChild,
  className,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen?.(!isOpen);
  };

  return (
    <div
      onClick={handleClick}
      className={cn("inline-flex cursor-pointer", className)}
    >
      {children}
    </div>
  );
};

export interface DropdownMenuContentProps {
  children: React.ReactNode;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  align?: "start" | "end";
  className?: string;
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  children,
  isOpen,
  setIsOpen,
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
    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 mt-1 min-w-[calc(var(--unit)*50)]",
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
