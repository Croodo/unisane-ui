# Overlays

Components that appear above other content.

## Table of Contents

1. [Tooltip](#tooltip)
2. [Menu](#menu)
3. [Bottom Sheet](#bottom-sheet)

---

## Tooltip

Contextual information displayed on hover or focus.

### M3 Specification

#### Plain Tooltip

| Property | Value |
|----------|-------|
| Container Height | 24dp (min) |
| Max Width | 200dp |
| Horizontal Padding | 8dp |
| Vertical Padding | 4dp |
| Corner Radius | Extra Small (4dp) |
| Typography | Body Small |

#### Rich Tooltip

| Property | Value |
|----------|-------|
| Container Height | Variable |
| Max Width | 320dp |
| Horizontal Padding | 16dp |
| Vertical Padding | 12dp |
| Corner Radius | Medium (12dp) |
| Typography | Body Medium (content), Title Small (title) |
| Subhead Padding | 12dp (bottom) |

| Color | Token |
|-------|-------|
| Container | `inverse-surface` (plain) / `surface-container` (rich) |
| Text | `inverse-on-surface` (plain) / `on-surface` (rich) |

| Behavior | Value |
|----------|-------|
| Show Delay | 500-700ms |
| Hide Delay | 0ms (plain) / 1500ms (rich) |

> **Source**: [M3 Tooltips](https://m3.material.io/components/tooltips/specs)

### Unisane Token Mapping

```
Plain Tooltip:
24dp min-height = min-h-6u
200dp max-width = max-w-50u
8dp horizontal padding = px-2u
4dp vertical padding = py-1u
4dp corners = rounded-xs
Body Small = text-body-small

Rich Tooltip:
320dp max-width = max-w-80u
16dp padding = p-4u
12dp corners = rounded-md
Title Small = text-title-small
Body Medium = text-body-medium

Colors:
inverse-surface = bg-inverse-surface
inverse-on-surface = text-inverse-on-surface
```

### File: `components/ui/tooltip.tsx`

```tsx
"use client";

import { createContext, useContext, useState, useRef, useEffect, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/portal";

interface TooltipContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
  delayDuration: number;
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

interface TooltipProps {
  children: React.ReactNode;
  delayDuration?: number;
}

export const Tooltip = ({ children, delayDuration = 500 }: TooltipProps) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);

  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRef, delayDuration }}>
      {children}
    </TooltipContext.Provider>
  );
};

// Tooltip Trigger
interface TooltipTriggerProps {
  asChild?: boolean;
  children: React.ReactElement;
}

export const TooltipTrigger = forwardRef<HTMLElement, TooltipTriggerProps>(
  ({ asChild, children }, ref) => {
    const context = useContext(TooltipContext);
    if (!context) throw new Error("TooltipTrigger must be used within Tooltip");

    const timeoutRef = useRef<NodeJS.Timeout>();

    const handleMouseEnter = () => {
      timeoutRef.current = setTimeout(() => context.setOpen(true), context.delayDuration);
    };

    const handleMouseLeave = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      context.setOpen(false);
    };

    const handleFocus = () => context.setOpen(true);
    const handleBlur = () => context.setOpen(false);

    const triggerProps = {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
    };

    if (asChild) {
      return (
        <children.type
          {...children.props}
          {...triggerProps}
          ref={(node: HTMLElement) => {
            (context.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
          }}
        />
      );
    }

    return (
      <span
        {...triggerProps}
        ref={(node) => {
          (context.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        }}
      >
        {children}
      </span>
    );
  }
);

TooltipTrigger.displayName = "TooltipTrigger";

// Tooltip Content
const tooltipContentVariants = cva(
  "pointer-events-none animate-in fade-in zoom-in-95 duration-short",
  {
    variants: {
      variant: {
        plain: "min-h-6u max-w-50u px-2u py-1u rounded-xs bg-inverse-surface text-inverse-on-surface text-body-small shadow-2",
        rich: "max-w-80u p-4u rounded-md bg-surface-container text-on-surface shadow-2 pointer-events-auto",
      },
    },
    defaultVariants: {
      variant: "plain",
    },
  }
);

interface TooltipContentProps extends VariantProps<typeof tooltipContentVariants> {
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  className?: string;
}

export const TooltipContent = forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ children, variant = "plain", side = "top", align = "center", sideOffset = 8, className }, ref) => {
    const context = useContext(TooltipContext);
    const contentRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    if (!context) throw new Error("TooltipContent must be used within Tooltip");

    useEffect(() => {
      if (!context.open || !context.triggerRef.current || !contentRef.current) return;

      const updatePosition = () => {
        const trigger = context.triggerRef.current!.getBoundingClientRect();
        const content = contentRef.current!.getBoundingClientRect();

        let top = 0;
        let left = 0;

        if (side === "top") {
          top = trigger.top - content.height - sideOffset;
          left = trigger.left + trigger.width / 2 - content.width / 2;
        } else if (side === "bottom") {
          top = trigger.bottom + sideOffset;
          left = trigger.left + trigger.width / 2 - content.width / 2;
        } else if (side === "left") {
          left = trigger.left - content.width - sideOffset;
          top = trigger.top + trigger.height / 2 - content.height / 2;
        } else if (side === "right") {
          left = trigger.right + sideOffset;
          top = trigger.top + trigger.height / 2 - content.height / 2;
        }

        // Alignment adjustments for top/bottom
        if (side === "top" || side === "bottom") {
          if (align === "start") left = trigger.left;
          if (align === "end") left = trigger.right - content.width;
        }

        setPosition({ top, left });
      };

      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }, [context.open, side, align, sideOffset]);

    if (!context.open) return null;

    return (
      <Portal>
        <div
          ref={(node) => {
            (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          role="tooltip"
          style={{
            position: "fixed",
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 50,
          }}
          className={cn(tooltipContentVariants({ variant }), className)}
        >
          {children}
        </div>
      </Portal>
    );
  }
);

TooltipContent.displayName = "TooltipContent";
```

### Usage Example

```tsx
// Plain tooltip (default)
<Tooltip>
  <TooltipTrigger asChild>
    <IconButton variant="standard" aria-label="Delete">
      <span className="material-symbols-outlined">delete</span>
    </IconButton>
  </TooltipTrigger>
  <TooltipContent>Delete item</TooltipContent>
</Tooltip>

// Rich tooltip with more content
<Tooltip delayDuration={300}>
  <TooltipTrigger asChild>
    <Button variant="text">Learn more</Button>
  </TooltipTrigger>
  <TooltipContent variant="rich" side="bottom">
    <h4 className="text-title-small font-medium mb-2u">Feature Details</h4>
    <p className="text-body-medium">
      This feature allows you to customize your experience with advanced settings.
    </p>
  </TooltipContent>
</Tooltip>

// Different positions
<Tooltip>
  <TooltipTrigger asChild>
    <span>Hover me</span>
  </TooltipTrigger>
  <TooltipContent side="right">Right tooltip</TooltipContent>
</Tooltip>
```

---

## Menu

Contextual action menus and dropdown selections.

### M3 Specification

| Property | Value |
|----------|-------|
| Item Height | 48dp |
| Min Width | 112dp |
| Max Width | 280dp |
| Horizontal Padding | 12dp (container) |
| Item Horizontal Padding | 12dp |
| Vertical Padding | 8dp (top/bottom of menu) |
| Corner Radius | Extra Small (4dp) |
| Elevation | Level 2 (3dp) |
| Typography | Body Large |
| Icon Size | 24dp |
| Icon Gap | 12dp |

| State | Opacity |
|-------|---------|
| Hover | 8% |
| Focus | 12% |
| Pressed | 12% |

| Color | Token |
|-------|-------|
| Container | `surface-container` |
| Text | `on-surface` |
| Icon | `on-surface-variant` |
| Destructive Text | `error` |

> **Source**: [M3 Menus](https://m3.material.io/components/menus/specs)

### Unisane Token Mapping

```
Dimensions:
48dp item height = h-12u
112dp min-width = min-w-28u
280dp max-width = max-w-70u
12dp padding = p-3u (container), px-3u (item)
8dp vertical padding = py-2u
4dp corners = rounded-xs

Typography:
Body Large = text-body-large

Icon:
24dp = w-6u h-6u
12dp gap = gap-3u

Colors:
surface-container = bg-surface-container
on-surface = text-on-surface
on-surface-variant = text-on-surface-variant
error = text-error

Elevation:
Level 2 = shadow-2
```

### File: `components/ui/menu.tsx`

```tsx
"use client";

import { createContext, useContext, useState, useRef, useEffect, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/portal";
import { Ripple } from "@/components/ui/ripple";

interface MenuContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
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
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
  };

  return (
    <MenuContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </MenuContext.Provider>
  );
};

// Menu Trigger
interface MenuTriggerProps {
  asChild?: boolean;
  children: React.ReactElement;
}

export const MenuTrigger = forwardRef<HTMLElement, MenuTriggerProps>(
  ({ asChild, children }, ref) => {
    const context = useContext(MenuContext);
    if (!context) throw new Error("MenuTrigger must be used within Menu");

    const handleClick = () => context.setOpen(!context.open);

    if (asChild) {
      return (
        <children.type
          {...children.props}
          onClick={handleClick}
          ref={(node: HTMLElement) => {
            (context.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
          }}
        />
      );
    }

    return (
      <button
        onClick={handleClick}
        ref={(node) => {
          (context.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        }}
      >
        {children}
      </button>
    );
  }
);

MenuTrigger.displayName = "MenuTrigger";

// Menu Content
interface MenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
  sideOffset?: number;
}

export const MenuContent = forwardRef<HTMLDivElement, MenuContentProps>(
  ({ align = "start", side = "bottom", sideOffset = 4, children, className, ...props }, ref) => {
    const context = useContext(MenuContext);
    const contentRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    if (!context) throw new Error("MenuContent must be used within Menu");

    useEffect(() => {
      if (!context.open || !context.triggerRef.current || !contentRef.current) return;

      const updatePosition = () => {
        const trigger = context.triggerRef.current!.getBoundingClientRect();
        const content = contentRef.current!.getBoundingClientRect();

        let top = side === "bottom" ? trigger.bottom + sideOffset : trigger.top - content.height - sideOffset;
        let left = trigger.left;

        if (align === "center") left = trigger.left + trigger.width / 2 - content.width / 2;
        if (align === "end") left = trigger.right - content.width;

        // Keep within viewport
        if (left + content.width > window.innerWidth) left = window.innerWidth - content.width - 16;
        if (left < 16) left = 16;

        setPosition({ top, left });
      };

      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);

      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
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
          role="menu"
          style={{
            position: "fixed",
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 50,
          }}
          className={cn(
            "min-w-28u max-w-70u py-2u rounded-xs shadow-2",
            "bg-surface-container",
            "animate-in fade-in zoom-in-95 duration-short",
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

// Menu Item - 48dp height per M3 spec
interface MenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  destructive?: boolean;
}

export const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(
  ({ icon, destructive = false, children, className, onClick, ...props }, ref) => {
    const context = useContext(MenuContext);

    return (
      <button
        ref={ref}
        role="menuitem"
        onClick={(e) => {
          onClick?.(e);
          context?.setOpen(false);
        }}
        className={cn(
          "w-full flex items-center gap-3u px-3u h-12u",
          "text-body-large text-left relative overflow-hidden",
          "hover:bg-on-surface/8 active:bg-on-surface/12",
          "transition-colors duration-short",
          destructive ? "text-error" : "text-on-surface",
          className
        )}
        {...props}
      >
        <Ripple />
        {icon && (
          <span className="w-6u h-6u flex items-center justify-center text-on-surface-variant">
            {icon}
          </span>
        )}
        <span className="flex-1 relative z-10">{children}</span>
      </button>
    );
  }
);

MenuItem.displayName = "MenuItem";

// Menu Separator - 1dp divider
export const MenuSeparator = ({ className }: { className?: string }) => (
  <div className={cn("h-px bg-outline-variant my-2u", className)} role="separator" />
);

// Menu Label
export const MenuLabel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("px-3u py-2u text-label-small font-medium text-on-surface-variant", className)}>
    {children}
  </div>
);
```

### Usage Example

```tsx
<Menu>
  <MenuTrigger asChild>
    <IconButton variant="standard" aria-label="More options">
      <span className="material-symbols-outlined">more_vert</span>
    </IconButton>
  </MenuTrigger>

  <MenuContent align="end">
    <MenuLabel>Actions</MenuLabel>
    <MenuItem icon={<span className="material-symbols-outlined">edit</span>}>
      Edit
    </MenuItem>
    <MenuItem icon={<span className="material-symbols-outlined">content_copy</span>}>
      Duplicate
    </MenuItem>
    <MenuItem icon={<span className="material-symbols-outlined">share</span>}>
      Share
    </MenuItem>
    <MenuSeparator />
    <MenuItem
      destructive
      icon={<span className="material-symbols-outlined">delete</span>}
      onClick={handleDelete}
    >
      Delete
    </MenuItem>
  </MenuContent>
</Menu>

// Controlled menu
const [open, setOpen] = useState(false);

<Menu open={open} onOpenChange={setOpen}>
  <MenuTrigger asChild>
    <Button variant="outlined">Options</Button>
  </MenuTrigger>
  <MenuContent>
    <MenuItem>Option 1</MenuItem>
    <MenuItem>Option 2</MenuItem>
  </MenuContent>
</Menu>
```

---

## Bottom Sheet

Mobile-optimized sheet that slides from the bottom of the screen.

### M3 Specification

| Property | Value |
|----------|-------|
| Corner Radius | Extra Large (28dp) - top corners only |
| Drag Handle Width | 32dp |
| Drag Handle Height | 4dp |
| Drag Handle Top Margin | 22dp |
| Container Padding | 16dp (horizontal), 24dp (top below handle) |
| Elevation | Level 1 (modal) |
| Max Width | 640dp (on larger screens) |
| Scrim Opacity | 32% |

| Snap Points | Description |
|-------------|-------------|
| Collapsed | 25-30% of screen height |
| Half | 50% of screen height |
| Expanded | 90-100% of screen height |

| Color | Token |
|-------|-------|
| Container | `surface-container-low` |
| Drag Handle | `on-surface-variant` (40% opacity) |
| Scrim | `scrim` (32% opacity) |

> **Source**: [M3 Bottom Sheets](https://m3.material.io/components/bottom-sheets/specs)

### Unisane Token Mapping

```
Corner Radius:
28dp top corners = rounded-t-xl

Drag Handle:
32dp width = w-8u
4dp height = h-1u
22dp top margin = pt-5.5u (or mt-5u pt-1u)

Padding:
16dp horizontal = px-4u
24dp container = p-6u

Max Width:
640dp = max-w-160u

Scrim:
32% opacity = bg-scrim/32 (or opacity-32)

Colors:
surface-container-low = bg-surface-container-low
on-surface-variant at 40% = bg-on-surface-variant/40
```

### File: `components/ui/bottom-sheet.tsx`

```tsx
"use client";

import { useState, useEffect, useRef, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/portal";
import { FocusTrap } from "@/components/ui/focus-trap";

interface BottomSheetProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  snapPoints?: number[]; // Percentage heights: [50, 90]
  defaultSnap?: number;
}

export const BottomSheet = forwardRef<HTMLDivElement, BottomSheetProps>(
  ({ open, onClose, snapPoints = [50, 90], defaultSnap = 0, children, className, ...props }, ref) => {
    const [currentSnap, setCurrentSnap] = useState(defaultSnap);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [translateY, setTranslateY] = useState(0);
    const sheetRef = useRef<HTMLDivElement>(null);

    const snapHeight = snapPoints[currentSnap];

    useEffect(() => {
      if (!open) {
        setCurrentSnap(defaultSnap);
        setTranslateY(0);
        return;
      }

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };

      // Prevent body scroll when sheet is open
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);

      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", handleEscape);
      };
    }, [open, onClose, defaultSnap]);

    const handleDragStart = (clientY: number) => {
      setIsDragging(true);
      setStartY(clientY);
    };

    const handleDragMove = (clientY: number) => {
      if (!isDragging) return;
      const delta = clientY - startY;
      if (delta > 0) {
        setTranslateY(delta);
      }
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      // Close if dragged down more than 100px
      if (translateY > 100) {
        onClose();
      } else {
        setTranslateY(0);
      }
    };

    if (!open) return null;

    return (
      <Portal>
        {/* Scrim - 32% opacity per M3 spec */}
        <div
          className="fixed inset-0 bg-scrim/32 z-40 animate-in fade-in duration-short"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Sheet */}
        <FocusTrap active={open}>
          <div
            ref={(node) => {
              (sheetRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) ref.current = node;
            }}
            role="dialog"
            aria-modal="true"
            style={{
              height: `${snapHeight}vh`,
              transform: `translateY(${translateY}px)`,
              transition: isDragging ? "none" : "transform 300ms ease, height 300ms ease",
            }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "bg-surface-container-low rounded-t-xl shadow-1",
              "flex flex-col max-w-160u mx-auto",
              "animate-in slide-in-from-bottom duration-medium",
              className
            )}
            {...props}
          >
            {/* Drag Handle - 32dp × 4dp per M3 spec */}
            <div
              className="flex justify-center pt-5.5u pb-4u cursor-grab active:cursor-grabbing touch-none"
              onMouseDown={(e) => handleDragStart(e.clientY)}
              onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
              onMouseMove={(e) => isDragging && handleDragMove(e.clientY)}
              onTouchMove={(e) => isDragging && handleDragMove(e.touches[0].clientY)}
              onMouseUp={handleDragEnd}
              onTouchEnd={handleDragEnd}
              onMouseLeave={() => isDragging && handleDragEnd()}
            >
              <div className="w-8u h-1u bg-on-surface-variant/40 rounded-full" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4u pb-6u">
              {children}
            </div>
          </div>
        </FocusTrap>
      </Portal>
    );
  }
);

BottomSheet.displayName = "BottomSheet";

// Bottom Sheet Header
export const BottomSheetHeader = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("mb-4u", className)}>
    {children}
  </div>
);

// Bottom Sheet Title
export const BottomSheetTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h2 className={cn("text-headline-small text-on-surface", className)}>
    {children}
  </h2>
);

// Bottom Sheet Description
export const BottomSheetDescription = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p className={cn("text-body-medium text-on-surface-variant mt-1u", className)}>
    {children}
  </p>
);

// Bottom Sheet Footer
export const BottomSheetFooter = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("flex gap-2u mt-6u pt-4u border-t border-outline-variant", className)}>
    {children}
  </div>
);
```

### Usage Example

```tsx
const [open, setOpen] = useState(false);

<BottomSheet
  open={open}
  onClose={() => setOpen(false)}
  snapPoints={[50, 90]}
  defaultSnap={0}
>
  <BottomSheetHeader>
    <BottomSheetTitle>Filter Options</BottomSheetTitle>
    <BottomSheetDescription>
      Customize your search results
    </BottomSheetDescription>
  </BottomSheetHeader>

  <div className="space-y-4u">
    <Select label="Category" options={categories} />
    <Slider label="Price Range" min={0} max={1000} />
    <Checkbox label="In stock only" />
  </div>

  <BottomSheetFooter>
    <Button variant="outlined" className="flex-1" onClick={() => setOpen(false)}>
      Cancel
    </Button>
    <Button variant="filled" className="flex-1">
      Apply
    </Button>
  </BottomSheetFooter>
</BottomSheet>

// Simple action sheet
<BottomSheet open={open} onClose={() => setOpen(false)}>
  <MenuItem icon={<span className="material-symbols-outlined">share</span>}>
    Share
  </MenuItem>
  <MenuItem icon={<span className="material-symbols-outlined">link</span>}>
    Copy link
  </MenuItem>
  <MenuItem icon={<span className="material-symbols-outlined">download</span>}>
    Download
  </MenuItem>
  <MenuSeparator />
  <MenuItem destructive icon={<span className="material-symbols-outlined">delete</span>}>
    Delete
  </MenuItem>
</BottomSheet>
```

---

## Accessibility

### Tooltip

- Use for supplementary information only, not critical content
- Ensure trigger element is focusable
- Content should be concise (1-2 lines for plain tooltips)
- Consider `aria-describedby` for form field tooltips

### Menu

- Use `role="menu"` for the container and `role="menuitem"` for items
- Support keyboard navigation (Arrow keys, Enter, Escape)
- Focus first item when menu opens
- Return focus to trigger when menu closes

```tsx
// Keyboard navigation example
const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case "ArrowDown":
      focusNextItem();
      break;
    case "ArrowUp":
      focusPreviousItem();
      break;
    case "Enter":
    case " ":
      selectCurrentItem();
      break;
    case "Escape":
      closeMenu();
      break;
  }
};
```

### Bottom Sheet

- Use `role="dialog"` and `aria-modal="true"`
- Trap focus within the sheet when open
- Provide a close button or gesture
- Announce sheet title to screen readers

```tsx
<BottomSheet
  open={open}
  onClose={handleClose}
  aria-labelledby="sheet-title"
>
  <h2 id="sheet-title">Sheet Title</h2>
  {/* content */}
</BottomSheet>
```

---

## Best Practices

### Overlay Hierarchy

Use the right overlay for each context:

| Component | Use Case |
|-----------|----------|
| Tooltip | Brief labels, keyboard shortcuts |
| Menu | Actions, options (3-10 items) |
| Bottom Sheet | Mobile actions, forms, complex content |

### Mobile Considerations

```tsx
// Use responsive overlays
const isMobile = useMediaQuery("(max-width: 640px)");

{isMobile ? (
  <BottomSheet open={open} onClose={handleClose}>
    <ActionList />
  </BottomSheet>
) : (
  <Menu open={open} onOpenChange={setOpen}>
    <MenuContent>
      <ActionList />
    </MenuContent>
  </Menu>
)}
```

### Performance

```tsx
// Lazy render overlay content
{open && (
  <Portal>
    <MenuContent>...</MenuContent>
  </Portal>
)}

// Clean up event listeners
useEffect(() => {
  if (!open) return;

  const cleanup = () => {
    window.removeEventListener("scroll", updatePosition);
  };

  window.addEventListener("scroll", updatePosition);
  return cleanup;
}, [open]);
```
