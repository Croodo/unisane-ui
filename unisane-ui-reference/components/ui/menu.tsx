"use client";

import React, { createContext, useContext, useState, useRef, useEffect, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Portal } from "./portal";
import { animations } from "../../utils/animations";
import { stateLayers } from "../../utils/state-layers";

interface MenuContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

interface MenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Menu = ({ open: controlledOpen, onOpenChange, children }: MenuProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (value: boolean) => {
    if (!isControlled) {
      setInternalOpen(value);
    }
    onOpenChange?.(value);
  };

  return (
    <MenuContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </MenuContext.Provider>
  );
};

// Menu Trigger
export const MenuTrigger = forwardRef<HTMLElement, { asChild?: boolean; children: React.ReactElement }>(
  ({ asChild, children }, ref) => {
    const context = useContext(MenuContext);
    if (!context) throw new Error("MenuTrigger must be used within Menu");

    if (asChild) {
      const child = children as React.ReactElement<any>;
      return (
        React.cloneElement(child, {
          ref: (node: HTMLElement) => {
            (context.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
            
            const { ref: existingRef } = child as any;
            if (typeof existingRef === "function") existingRef(node);
            else if (existingRef) existingRef.current = node;
          },
          onClick: (e: React.MouseEvent) => {
            child.props.onClick?.(e);
            context.setOpen(!context.open);
          }
        })
      );
    }

    return (
      <button
        ref={(node) => {
          (context.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        }}
        onClick={() => context.setOpen(!context.open)}
      >
        {children}
      </button>
    );
  }
);

MenuTrigger.displayName = "MenuTrigger";

// Menu Content
const menuContentVariants = cva(
  "min-w-28u max-w-70u bg-surface-container rounded-sm shadow-2 py-2u",
  {
    variants: {
      align: {
        start: "",
        center: "",
        end: "",
      },
      side: {
        top: "",
        bottom: "",
        left: "",
        right: "",
      },
    },
    defaultVariants: {
      align: "start",
      side: "bottom",
    },
  }
);

interface MenuContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof menuContentVariants> {
  sideOffset?: number;
}

export const MenuContent = forwardRef<HTMLDivElement, MenuContentProps>(
  ({ align = "start", side = "bottom", sideOffset = 4, children, className = "", ...props }, ref) => {
    const context = useContext(MenuContext);
    const contentRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    if (!context) throw new Error("MenuContent must be used within Menu");

    useEffect(() => {
      if (!context.open || !context.triggerRef.current || !contentRef.current) return;

      const updatePosition = () => {
        const trigger = context.triggerRef.current!.getBoundingClientRect();
        const content = contentRef.current!.getBoundingClientRect();

        let top = 0;
        let left = 0;

        if (side === "bottom") {
          top = trigger.bottom + sideOffset;
        } else if (side === "top") {
          top = trigger.top - content.height - sideOffset;
        }

        if (align === "start") {
          left = trigger.left;
        } else if (align === "center") {
          left = trigger.left + trigger.width / 2 - content.width / 2;
        } else {
          left = trigger.right - content.width;
        }

        setPosition({ top, left });
      };

      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition);

      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition);
      };
    }, [context.open, side, align, sideOffset]);

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

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") context.setOpen(false);
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
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
            zIndex: "var(--z-popover)",
          }}
          className={cn(
            menuContentVariants({ align, side }),
            animations.dropdown,
            className
          )}
          {...props}
        >
          {children}
        </div>
      </Portal>
    );
  }
);

MenuContent.displayName = "MenuContent";

// Menu Item
const menuItemVariants = cva(
  `w-full flex items-center gap-3u px-3u h-12u text-body-large text-left transition-colors duration-short ${stateLayers.hover}`,
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

interface MenuItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof menuItemVariants> {
  icon?: React.ReactNode;
}

export const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(
  ({ destructive = false, icon, children, className, ...props }, ref) => {
    const context = useContext(MenuContext);

    return (
      <button
        ref={ref}
        onClick={(e) => {
          props.onClick?.(e);
          context?.setOpen(false);
        }}
        className={cn(menuItemVariants({ destructive }), className)}
        {...props}
      >
        {icon && (
          <span className="w-6u h-6u flex items-center justify-center text-on-surface-variant">
            {icon}
          </span>
        )}
        <span className="flex-1">{children}</span>
      </button>
    );
  }
);

MenuItem.displayName = "MenuItem";

// Menu Separator
export const MenuSeparator = () => (
  <div className="h-px bg-outline-variant/30 my-2u" role="separator" />
);

// Menu Label
export const MenuLabel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("px-3u py-2u text-label-small font-medium text-on-surface-variant", className)}>
    {children}
  </div>
);