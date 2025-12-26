"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Portal } from "./portal";
import { animations } from "../../utils/animations";

interface ContextMenuContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  position: { x: number; y: number };
  setPosition: (position: { x: number; y: number }) => void;
}

const ContextMenuContext = createContext<ContextMenuContextType | undefined>(undefined);

interface ContextMenuProps {
  children: React.ReactNode;
}

export const ContextMenu = ({ children }: ContextMenuProps) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  return (
    <ContextMenuContext.Provider value={{ open, setOpen, position, setPosition }}>
      {children}
    </ContextMenuContext.Provider>
  );
};

// Context Menu Trigger
interface ContextMenuTriggerProps {
  children: React.ReactElement;
}

export const ContextMenuTrigger = ({ children }: ContextMenuTriggerProps) => {
  const context = useContext(ContextMenuContext);
  if (!context) throw new Error("ContextMenuTrigger must be used within ContextMenu");

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    context.setPosition({ x: e.clientX, y: e.clientY });
    context.setOpen(true);
  };

  return React.cloneElement(children as React.ReactElement<any>, {
    onContextMenu: handleContextMenu,
  });
};

// Context Menu Content
const contextMenuContentVariants = cva(
  "min-w-50u bg-surface-container rounded-sm shadow-3 py-2u"
);

interface ContextMenuContentProps {
  children: React.ReactNode;
  className?: string;
}

export const ContextMenuContent = ({ children, className }: ContextMenuContentProps) => {
  const context = useContext(ContextMenuContext);
  const contentRef = useRef<HTMLDivElement>(null);

  if (!context) throw new Error("ContextMenuContent must be used within ContextMenu");

  useEffect(() => {
    if (!context.open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        context.setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") context.setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [context.open]);

  if (!context.open) return null;

  return (
    <Portal>
      <div
        ref={contentRef}
        style={{
          position: "fixed",
          top: `${context.position.y}px`,
          left: `${context.position.x}px`,
          zIndex: "var(--z-popover)",
        }}
        className={cn(
          contextMenuContentVariants(),
          animations.zoomIn,
          className
        )}
      >
        {children}
      </div>
    </Portal>
  );
};

// Context Menu Item
const contextMenuItemVariants = cva(
  "w-full flex items-center justify-between gap-4u px-3u h-10u text-body-medium text-left hover:bg-on-surface/8 transition-colors duration-short",
  {
    variants: {
      destructive: {
        true: "text-error",
        false: "text-on-surface",
      },
    },
    defaultVariants: {
      destructive: false,
    },
  }
);

interface ContextMenuItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof contextMenuItemVariants> {
  icon?: React.ReactNode;
  shortcut?: string;
  destructive?: boolean;
}

export const ContextMenuItem = ({
  icon,
  shortcut,
  destructive = false,
  children,
  className,
  ...props
}: ContextMenuItemProps) => {
  const context = useContext(ContextMenuContext);

  return (
    <button
      onClick={(e) => {
        props.onClick?.(e);
        context?.setOpen(false);
      }}
      className={cn(contextMenuItemVariants({ destructive }), className)}
      {...props}
    >
      <div className="flex items-center gap-3u">
        {icon && <span className="w-5u h-5u flex items-center justify-center">{icon}</span>}
        <span>{children}</span>
      </div>
      {shortcut && (
        <span className="text-label-small text-on-surface-variant">{shortcut}</span>
      )}
    </button>
  );
};

export const ContextMenuSeparator = () => (
  <div className="h-px bg-outline-variant/30 my-2u" />
);