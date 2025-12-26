"use client";

import React, { createContext, useContext, useState, useRef, useEffect, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Portal } from "./portal";
import { animations } from "../../utils/animations";
import { stateLayers } from "../../utils/state-layers";

interface DropdownContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const DropdownContext = createContext<DropdownContextType | undefined>(undefined);

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}

export const Dropdown = ({ value, onChange, children }: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <DropdownContext.Provider value={{ open, setOpen, value, onChange, triggerRef }}>
      {children}
    </DropdownContext.Provider>
  );
};

// Dropdown Trigger
const dropdownTriggerVariants = cva(
  `w-full flex items-center justify-between h-12u px-4u bg-surface-container-highest border border-outline rounded-sm text-body-large text-on-surface text-left hover:bg-on-surface/5 focus:outline-2 focus:outline-primary`
);

interface DropdownTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  placeholder?: string;
}

export const DropdownTrigger = forwardRef<HTMLButtonElement, DropdownTriggerProps>(
  ({ placeholder = "Select...", className, ...props }, ref) => {
    const context = useContext(DropdownContext);
    if (!context) throw new Error("DropdownTrigger must be used within Dropdown");

    return (
      <button
        ref={(node) => {
          (context.triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        onClick={() => context.setOpen(!context.open)}
        className={cn(dropdownTriggerVariants(), className)}
        {...props}
      >
        <span>{context.value || placeholder}</span>
        <span className="material-symbols-outlined text-on-surface-variant">
          {context.open ? "expand_less" : "expand_more"}
        </span>
      </button>
    );
  }
);

DropdownTrigger.displayName = "DropdownTrigger";

// Dropdown Content
const dropdownContentVariants = cva(
  "max-h-75u overflow-y-auto bg-surface-container rounded-sm shadow-2 py-2u"
);

export const DropdownContent = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
  ({ children, className }, ref) => {
    const context = useContext(DropdownContext);
    const contentRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

    if (!context) throw new Error("DropdownContent must be used within Dropdown");

    useEffect(() => {
      if (!context.open || !context.triggerRef.current || !contentRef.current) return;

      const updatePosition = () => {
        const trigger = context.triggerRef.current!.getBoundingClientRect();
        setPosition({
          top: trigger.bottom + 4,
          left: trigger.left,
          width: trigger.width,
        });
      };

      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition);

      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition);
      };
    }, [context.open]);

    useEffect(() => {
      if (!context.open) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (
          contentRef.current &&
          !contentRef.current.contains(e.target as Node) &&
          !context.triggerRef.current?.contains(e.target as Node)
        ) {
          context.setOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [context]);

    if (!context.open) return null;

    return (
      <Portal>
        <div
          ref={(node) => {
            (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          style={{
            position: "fixed",
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${position.width}px`,
            zIndex: "var(--z-popover)",
          }}
          className={cn(
            dropdownContentVariants(),
            animations.dropdown,
            className
          )}
        >
          {children}
        </div>
      </Portal>
    );
  }
);

DropdownContent.displayName = "DropdownContent";

// Dropdown Item
const dropdownItemVariants = cva(
  "w-full flex items-center justify-between px-4u h-12u text-body-large text-left transition-colors duration-short",
  {
    variants: {
      selected: {
        true: "bg-secondary-container text-on-secondary-container",
        false: `text-on-surface ${stateLayers.hover}`,
      },
      disabled: {
        true: "opacity-38 cursor-not-allowed",
        false: "",
      },
    },
    defaultVariants: {
      selected: false,
      disabled: false,
    },
  }
);

interface DropdownItemProps extends VariantProps<typeof dropdownItemVariants> {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export const DropdownItem = ({ value, children, disabled = false }: DropdownItemProps) => {
  const context = useContext(DropdownContext);
  if (!context) throw new Error("DropdownItem must be used within Dropdown");

  const isSelected = context.value === value;

  return (
    <button
      disabled={disabled}
      onClick={() => {
        context.onChange(value);
        context.setOpen(false);
      }}
      className={cn(dropdownItemVariants({ selected: isSelected, disabled }))}
    >
      <span>{children}</span>
      {isSelected && (
        <span className="material-symbols-outlined w-5u h-5u">check</span>
      )}
    </button>
  );
};