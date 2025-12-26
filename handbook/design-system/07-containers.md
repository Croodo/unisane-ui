# Containers

Components for grouping and organizing content following Material Design 3 specifications.

## Table of Contents

1. [Card](#card)
2. [Dialog](#dialog)
3. [Sheet](#sheet)
4. [Popover](#popover)
5. [Design Tokens](#design-tokens)
6. [Best Practices](#best-practices)

---

## Card

Container for related content and actions.

### M3 Specification

| Property | M3 Value | Unisane Token |
|----------|----------|---------------|
| Corner radius | 12dp (Medium) | `rounded-md` |
| Elevation (elevated) | 1dp resting, 2dp dragged | `shadow-1` |
| Elevation (filled) | 0dp resting, 8dp dragged | - / `shadow-2` |
| Elevation (outlined) | 0dp resting, 8dp dragged | - / `shadow-2` |
| Stroke width (outlined) | 1dp | `border` |
| Content padding | 16dp | `p-4u` |
| Card margins | 8dp | `m-2u` |
| Min touch target | 48dp | `min-h-12u` |
| State layer opacity (hover) | 8% | `opacity-8` |
| State layer opacity (pressed) | 12% | `opacity-12` |

> **Sources**: [m3.material.io/components/cards/specs](https://m3.material.io/components/cards/specs), [material-components-android Card.md](https://github.com/material-components/material-components-android/blob/master/docs/components/Card.md)

### Variants

**Elevated Card**: Has tonal elevation and shadow. Use for high emphasis content.

**Filled Card**: Uses surface container color without shadow. Use for medium emphasis.

**Outlined Card**: Has a border outline without shadow. Use for lower emphasis or when container distinction is needed.

### File: `components/ui/card.tsx`

```tsx
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Ripple } from "./ripple";

/**
 * Material Design 3 Card
 *
 * M3 Spec:
 * - Corner radius: 12dp (Medium)
 * - Elevated: 1dp elevation
 * - Filled: 0dp, surface-container-highest
 * - Outlined: 0dp, 1dp border
 *
 * @see https://m3.material.io/components/cards/specs
 */
const cardVariants = cva(
  // Base - 12dp corner radius (Medium shape)
  "rounded-md overflow-hidden transition-all duration-short",
  {
    variants: {
      variant: {
        // Elevated: 1dp shadow, surface color
        elevated: "bg-surface-container-low shadow-1 hover:shadow-2",
        // Filled: No shadow, highest surface container
        filled: "bg-surface-container-highest",
        // Outlined: 1dp border, no shadow
        outlined: "bg-surface border border-outline-variant",
      },
      interactive: {
        true: "cursor-pointer active:shadow-1 relative group",
        false: "",
      },
    },
    compoundVariants: [
      // Interactive elevated gets more shadow on hover
      { variant: "elevated", interactive: true, className: "hover:shadow-2" },
      // Interactive filled/outlined get shadow on drag
      { variant: "filled", interactive: true, className: "hover:shadow-2" },
      { variant: "outlined", interactive: true, className: "hover:shadow-2" },
    ],
    defaultVariants: {
      variant: "filled",
      interactive: false,
    },
  }
);

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "filled", interactive = false, className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, interactive }), className)}
        {...props}
      >
        {interactive && (
          <>
            {/* State layer - 8% hover, 12% pressed */}
            <div className="absolute inset-0 pointer-events-none bg-on-surface opacity-0 transition-opacity group-hover:opacity-8 group-active:opacity-12 z-0" />
            <Ripple />
          </>
        )}
        <div className={cn(interactive ? "relative z-10" : "")}>{children}</div>
      </div>
    );
  }
);

Card.displayName = "Card";

// Card Header - 16dp padding
export const CardHeader = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("px-4u pt-4u pb-2u", className)}>{children}</div>;

// Card Title - Title Large
export const CardTitle = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h3 className={cn("text-title-large font-normal text-on-surface", className)}>
    {children}
  </h3>
);

// Card Subhead - Body Medium
export const CardSubhead = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p className={cn("text-body-medium text-on-surface-variant mt-1u", className)}>
    {children}
  </p>
);

// Card Content - 16dp horizontal padding
export const CardContent = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("px-4u py-4u", className)}>{children}</div>;

// Card Media - Full bleed image/video
export const CardMedia = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("w-full", className)}>{children}</div>;

// Card Actions - 8dp padding for buttons
const cardActionsVariants = cva("flex items-center gap-2u px-2u py-2u", {
  variants: {
    align: {
      start: "justify-start",
      end: "justify-end",
      center: "justify-center",
      between: "justify-between",
    },
  },
  defaultVariants: {
    align: "end",
  },
});

interface CardActionsProps extends VariantProps<typeof cardActionsVariants> {
  children: React.ReactNode;
  className?: string;
}

export const CardActions = ({ children, className = "", align = "end" }: CardActionsProps) => {
  return (
    <div className={cn(cardActionsVariants({ align }), className)}>
      {children}
    </div>
  );
};
```

### Usage Examples

```tsx
// Elevated card (high emphasis)
<Card variant="elevated">
  <CardMedia>
    <img src="/image.jpg" alt="Card image" className="w-full h-48u object-cover" />
  </CardMedia>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardSubhead>Supporting text</CardSubhead>
  </CardHeader>
  <CardContent>
    <p className="text-body-medium text-on-surface-variant">
      Card content with additional details.
    </p>
  </CardContent>
  <CardActions>
    <Button variant="text">Learn More</Button>
    <Button variant="filled">Action</Button>
  </CardActions>
</Card>

// Interactive filled card
<Card variant="filled" interactive onClick={handleClick}>
  <CardHeader>
    <CardTitle>Clickable Card</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Click anywhere on this card.</p>
  </CardContent>
</Card>

// Outlined card
<Card variant="outlined">
  <CardHeader>
    <CardTitle>Settings</CardTitle>
  </CardHeader>
  <CardContent>
    <Switch label="Notifications" />
  </CardContent>
</Card>
```

---

## Dialog

Modal dialog for critical decisions and information.

### M3 Specification

| Property | M3 Value | Unisane Token |
|----------|----------|---------------|
| Min width | 280dp | `min-w-70u` |
| Max width | 560dp | `max-w-140u` |
| Corner radius | 28dp (Extra Large) | `rounded-xl` |
| Padding horizontal | 24dp | `px-6u` |
| Padding top | 24dp | `pt-6u` |
| Padding bottom | 24dp | `pb-6u` |
| Title typography | Headline Small | `text-headline-small` |
| Body typography | Body Medium | `text-body-medium` |
| Action button gap | 8dp | `gap-2u` |
| Scrim opacity | 32% | `bg-scrim` |
| Container color | Surface Container High | `bg-surface-container-high` |
| Elevation | 3dp (Level 3) | `shadow-3` |

> **Sources**: [m3.material.io/components/dialogs/specs](https://m3.material.io/components/dialogs/specs), [material-components-android Dialog.md](https://github.com/material-components/material-components-android/blob/master/docs/components/Dialog.md)

### Types

**Basic Dialog**: Simple confirmation with title, description, and actions.

**Full-screen Dialog**: Covers entire screen, used for complex tasks (mobile).

### File: `components/ui/dialog.tsx`

```tsx
"use client";

import { createContext, useContext, useState, useEffect, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/portal";
import { FocusTrap } from "@/components/ui/focus-trap";

/**
 * Material Design 3 Dialog
 *
 * M3 Spec:
 * - Min width: 280dp, Max width: 560dp
 * - Corner radius: 28dp (Extra Large)
 * - Padding: 24dp
 * - Title: Headline Small
 * - Body: Body Medium
 *
 * @see https://m3.material.io/components/dialogs/specs
 */

interface DialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog = ({ open: controlledOpen, onOpenChange, children }: DialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (value: boolean) => {
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
  };

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
};

// Dialog Trigger
interface DialogTriggerProps {
  asChild?: boolean;
  children: React.ReactElement;
}

export const DialogTrigger = ({ asChild, children }: DialogTriggerProps) => {
  const context = useContext(DialogContext);
  if (!context) throw new Error("DialogTrigger must be used within Dialog");

  if (asChild) {
    return (
      <children.type {...children.props} onClick={() => context.setOpen(true)} />
    );
  }

  return <button onClick={() => context.setOpen(true)}>{children}</button>;
};

// Dialog Content - 280dp min, 560dp max, 28dp corners
interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "full";
  onClose?: () => void;
}

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ children, size = "md", onClose, className, ...props }, ref) => {
    const context = useContext(DialogContext);
    if (!context) throw new Error("DialogContent must be used within Dialog");

    useEffect(() => {
      if (!context.open) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          context.setOpen(false);
          onClose?.();
        }
      };

      // Prevent body scroll
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);

      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", handleEscape);
      };
    }, [context, onClose]);

    if (!context.open) return null;

    const sizeClasses = {
      sm: "min-w-70u max-w-80u",
      md: "min-w-70u max-w-140u",
      lg: "min-w-70u max-w-160u",
      full: "min-w-70u max-w-[90vw]",
    };

    return (
      <Portal>
        {/* Scrim - 32% opacity */}
        <div
          className="fixed inset-0 bg-scrim z-modal animate-fade-in"
          onClick={() => {
            context.setOpen(false);
            onClose?.();
          }}
          aria-hidden="true"
        />

        {/* Dialog container */}
        <div className="fixed inset-0 z-modal flex items-center justify-center p-6u">
          <FocusTrap active={context.open}>
            <div
              ref={ref}
              role="dialog"
              aria-modal="true"
              className={cn(
                // Container - Extra Large shape (28dp)
                "relative w-full bg-surface-container-high rounded-xl shadow-3",
                "overflow-hidden flex flex-col max-h-[80vh]",
                "animate-fade-in animate-zoom-in",
                sizeClasses[size],
                className
              )}
              onClick={(e) => e.stopPropagation()}
              {...props}
            >
              {children}
            </div>
          </FocusTrap>
        </div>
      </Portal>
    );
  }
);

DialogContent.displayName = "DialogContent";

// Dialog Header - 24dp padding
export const DialogHeader = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("px-6u pt-6u pb-4u", className)}>{children}</div>;

// Dialog Title - Headline Small
export const DialogTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h2 className={cn("text-headline-small font-normal text-on-surface", className)}>
    {children}
  </h2>
);

// Dialog Description - Body Medium
export const DialogDescription = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p className={cn("text-body-medium text-on-surface-variant mt-4u", className)}>
    {children}
  </p>
);

// Dialog Body - Scrollable content area
export const DialogBody = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("px-6u py-4u overflow-y-auto flex-1", className)}>{children}</div>;

// Dialog Actions - 8dp gap between buttons, 24dp padding
export const DialogActions = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("flex items-center justify-end gap-2u px-6u py-6u", className)}>
    {children}
  </div>
);

// Dialog Close helper
export const DialogClose = ({ children }: { children: React.ReactElement }) => {
  const context = useContext(DialogContext);
  if (!context) throw new Error("DialogClose must be used within Dialog");

  return <children.type {...children.props} onClick={() => context.setOpen(false)} />;
};
```

### Usage Examples

```tsx
const [open, setOpen] = useState(false);

// Basic dialog
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button variant="filled">Delete Account</Button>
  </DialogTrigger>

  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete account?</DialogTitle>
      <DialogDescription>
        This action cannot be undone. All your data will be permanently removed.
      </DialogDescription>
    </DialogHeader>

    <DialogActions>
      <DialogClose>
        <Button variant="text">Cancel</Button>
      </DialogClose>
      <Button variant="filled" onClick={handleDelete}>
        Delete
      </Button>
    </DialogActions>
  </DialogContent>
</Dialog>

// Dialog with scrollable content
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent size="lg">
    <DialogHeader>
      <DialogTitle>Terms of Service</DialogTitle>
    </DialogHeader>

    <DialogBody>
      <p className="text-body-medium">Long content here...</p>
    </DialogBody>

    <DialogActions>
      <DialogClose>
        <Button variant="text">Decline</Button>
      </DialogClose>
      <Button variant="filled">Accept</Button>
    </DialogActions>
  </DialogContent>
</Dialog>
```

---

## Sheet

Bottom/side sheet for contextual content and actions.

### M3 Specification

| Property | M3 Value | Unisane Token |
|----------|----------|---------------|
| Corner radius (top) | 28dp (Extra Large) | `rounded-t-xl` |
| Elevation (modal) | 1dp | `shadow-1` |
| Max width (side) | 640dp | `max-w-160u` |
| Drag handle width | 32dp | `w-8u` |
| Drag handle height | 4dp | `h-1u` |
| Drag handle touch target | 48dp × 48dp | `min-h-12u` |
| Container color | Surface Container Low | `bg-surface-container-low` |
| Scrim opacity | 32% | `bg-scrim` |
| Peek height | Auto or custom | - |

> **Sources**: [m3.material.io/components/bottom-sheets](https://m3.material.io/components/bottom-sheets), [material-components-android BottomSheet.md](https://github.com/material-components/material-components-android/blob/master/docs/components/BottomSheet.md)

### Types

**Standard Sheet**: Non-modal, co-exists with primary content.

**Modal Sheet**: Blocks interaction with primary content, has scrim.

### File: `components/ui/sheet.tsx`

```tsx
"use client";

import { createContext, useContext, useState, useEffect, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/portal";
import { FocusTrap } from "@/components/ui/focus-trap";

/**
 * Material Design 3 Sheet (Bottom/Side)
 *
 * M3 Spec:
 * - Corner radius: 28dp (Extra Large)
 * - Drag handle: 32dp × 4dp, 48dp touch target
 * - Elevation: 1dp
 * - Max width (side): 640dp
 *
 * @see https://m3.material.io/components/bottom-sheets
 */

interface SheetContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SheetContext = createContext<SheetContextType | undefined>(undefined);

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Sheet = ({ open: controlledOpen, onOpenChange, children }: SheetProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (value: boolean) => {
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
  };

  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
};

// Sheet Trigger
export const SheetTrigger = ({ asChild, children }: { asChild?: boolean; children: React.ReactElement }) => {
  const context = useContext(SheetContext);
  if (!context) throw new Error("SheetTrigger must be used within Sheet");

  if (asChild) {
    return <children.type {...children.props} onClick={() => context.setOpen(true)} />;
  }

  return <button onClick={() => context.setOpen(true)}>{children}</button>;
};

// Sheet Content
interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "bottom" | "top" | "left" | "right";
  children: React.ReactNode;
}

export const SheetContent = forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = "bottom", children, className, ...props }, ref) => {
    const context = useContext(SheetContext);
    if (!context) throw new Error("SheetContent must be used within Sheet");

    useEffect(() => {
      if (!context.open) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") context.setOpen(false);
      };

      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);

      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", handleEscape);
      };
    }, [context]);

    if (!context.open) return null;

    const sideClasses = {
      bottom: "inset-x-0 bottom-0 rounded-t-xl max-h-[90vh] animate-slide-in-from-bottom",
      top: "inset-x-0 top-0 rounded-b-xl max-h-[90vh] animate-slide-in-from-top",
      left: "inset-y-0 left-0 rounded-r-xl w-80u max-w-160u max-h-screen animate-slide-in-from-left",
      right: "inset-y-0 right-0 rounded-l-xl w-80u max-w-160u max-h-screen animate-slide-in-from-right",
    };

    return (
      <Portal>
        {/* Scrim - 32% opacity */}
        <div
          className="fixed inset-0 bg-scrim z-modal animate-fade-in"
          onClick={() => context.setOpen(false)}
          aria-hidden="true"
        />

        {/* Sheet */}
        <FocusTrap active={context.open}>
          <div
            ref={ref}
            className={cn(
              "fixed z-modal bg-surface-container-low shadow-1 p-6u overflow-y-auto",
              sideClasses[side],
              className
            )}
            {...props}
          >
            {/* Drag handle - 32dp × 4dp, 48dp touch target */}
            {(side === "bottom" || side === "top") && (
              <div className="flex justify-center mb-4u min-h-12u items-start pt-2u -mt-6u">
                <div
                  className="w-8u h-1u bg-on-surface-variant/40 rounded-full cursor-grab"
                  aria-label="Drag handle"
                />
              </div>
            )}

            {children}
          </div>
        </FocusTrap>
      </Portal>
    );
  }
);

SheetContent.displayName = "SheetContent";

// Sheet Header
export const SheetHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("mb-4u", className)}>{children}</div>
);

// Sheet Title - Headline Small
export const SheetTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h2 className={cn("text-headline-small font-normal text-on-surface", className)}>{children}</h2>
);

// Sheet Description - Body Medium
export const SheetDescription = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={cn("text-body-medium text-on-surface-variant mt-2u", className)}>{children}</p>
);

// Sheet Close helper
export const SheetClose = ({ children }: { children: React.ReactElement }) => {
  const context = useContext(SheetContext);
  if (!context) throw new Error("SheetClose must be used within Sheet");

  return <children.type {...children.props} onClick={() => context.setOpen(false)} />;
};
```

### Usage Examples

```tsx
// Bottom sheet
<Sheet>
  <SheetTrigger asChild>
    <Button variant="outlined">Open Filters</Button>
  </SheetTrigger>

  <SheetContent side="bottom">
    <SheetHeader>
      <SheetTitle>Filter Options</SheetTitle>
      <SheetDescription>Customize your search results</SheetDescription>
    </SheetHeader>

    <div className="space-y-4u">
      <Select label="Category" options={categories} />
      <Slider label="Price Range" min={0} max={1000} />
      <Checkbox label="In stock only" />
    </div>

    <div className="flex gap-2u mt-6u">
      <SheetClose>
        <Button variant="outlined" className="flex-1">Cancel</Button>
      </SheetClose>
      <Button variant="filled" className="flex-1">Apply</Button>
    </div>
  </SheetContent>
</Sheet>

// Side sheet (right)
<Sheet>
  <SheetTrigger asChild>
    <IconButton variant="standard" ariaLabel="Cart">
      <CartIcon />
    </IconButton>
  </SheetTrigger>

  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Shopping Cart</SheetTitle>
      <SheetDescription>3 items</SheetDescription>
    </SheetHeader>

    <div className="space-y-4u">
      {cartItems.map(item => (
        <CartItem key={item.id} item={item} />
      ))}
    </div>

    <div className="mt-auto pt-6u border-t border-outline-variant">
      <Button variant="filled" className="w-full">Checkout</Button>
    </div>
  </SheetContent>
</Sheet>
```

---

## Popover

Floating content anchored to a trigger element.

### M3 Specification

| Property | M3 Value | Unisane Token |
|----------|----------|---------------|
| Corner radius | 12dp (Medium) | `rounded-md` |
| Elevation | 2dp (Level 2) | `shadow-2` |
| Padding | 12dp | `p-3u` |
| Container color | Surface Container | `bg-surface-container` |
| Min width | 112dp | `min-w-28u` |
| Max width | 280dp | `max-w-70u` |

> **Source**: [m3.material.io/components/menus/specs](https://m3.material.io/components/menus/specs)

### File: `components/ui/popover.tsx`

```tsx
"use client";

import { createContext, useContext, useState, useRef, useEffect, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/portal";

/**
 * Material Design 3 Popover
 *
 * M3 Spec:
 * - Corner radius: 12dp (Medium)
 * - Elevation: 2dp
 * - Padding: 12dp
 *
 * @see https://m3.material.io/components/menus/specs
 */

interface PopoverContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
}

const PopoverContext = createContext<PopoverContextType | undefined>(undefined);

interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Popover = ({ open: controlledOpen, onOpenChange, children }: PopoverProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (value: boolean) => {
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
  };

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </PopoverContext.Provider>
  );
};

// Popover Trigger
export const PopoverTrigger = forwardRef<HTMLButtonElement, { asChild?: boolean; children: React.ReactElement }>(
  ({ asChild, children }, ref) => {
    const context = useContext(PopoverContext);
    if (!context) throw new Error("PopoverTrigger must be used within Popover");

    const handleRef = (node: HTMLElement | null) => {
      (context.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
      if (typeof ref === "function") ref(node as HTMLButtonElement);
      else if (ref) ref.current = node as HTMLButtonElement;
    };

    if (asChild) {
      return (
        <children.type
          {...children.props}
          ref={handleRef}
          onClick={() => context.setOpen(!context.open)}
        />
      );
    }

    return (
      <button ref={handleRef} onClick={() => context.setOpen(!context.open)}>
        {children}
      </button>
    );
  }
);

PopoverTrigger.displayName = "PopoverTrigger";

// Popover Content - 12dp corners, 2dp elevation, 12dp padding
interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
}

export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ align = "center", side = "bottom", sideOffset = 8, children, className, ...props }, ref) => {
    const context = useContext(PopoverContext);
    const contentRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    if (!context) throw new Error("PopoverContent must be used within Popover");

    useEffect(() => {
      if (!context.open || !context.triggerRef.current || !contentRef.current) return;

      const updatePosition = () => {
        const trigger = context.triggerRef.current!.getBoundingClientRect();
        const content = contentRef.current!.getBoundingClientRect();

        let top = 0;
        let left = 0;

        // Position based on side
        if (side === "bottom") {
          top = trigger.bottom + sideOffset;
          left = align === "start" ? trigger.left
               : align === "end" ? trigger.right - content.width
               : trigger.left + trigger.width / 2 - content.width / 2;
        } else if (side === "top") {
          top = trigger.top - content.height - sideOffset;
          left = align === "start" ? trigger.left
               : align === "end" ? trigger.right - content.width
               : trigger.left + trigger.width / 2 - content.width / 2;
        } else if (side === "left") {
          left = trigger.left - content.width - sideOffset;
          top = align === "start" ? trigger.top
              : align === "end" ? trigger.bottom - content.height
              : trigger.top + trigger.height / 2 - content.height / 2;
        } else if (side === "right") {
          left = trigger.right + sideOffset;
          top = align === "start" ? trigger.top
              : align === "end" ? trigger.bottom - content.height
              : trigger.top + trigger.height / 2 - content.height / 2;
        }

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
          style={{
            position: "fixed",
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: "var(--z-popover)",
          }}
          className={cn(
            // Medium shape (12dp), Level 2 elevation, 12dp padding
            "bg-surface-container shadow-2 rounded-md p-3u",
            "min-w-28u max-w-70u",
            "animate-fade-in animate-zoom-in",
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

PopoverContent.displayName = "PopoverContent";
```

### Usage Examples

```tsx
// Dropdown menu
<Popover>
  <PopoverTrigger asChild>
    <IconButton variant="standard" ariaLabel="More options">
      <MoreVertIcon />
    </IconButton>
  </PopoverTrigger>

  <PopoverContent align="end" side="bottom">
    <div className="flex flex-col">
      <button className="px-3u py-2u hover:bg-on-surface/8 rounded text-body-medium text-left">
        Edit
      </button>
      <button className="px-3u py-2u hover:bg-on-surface/8 rounded text-body-medium text-left">
        Share
      </button>
      <button className="px-3u py-2u hover:bg-on-surface/8 rounded text-body-medium text-left text-error">
        Delete
      </button>
    </div>
  </PopoverContent>
</Popover>

// Tooltip-style popover
<Popover>
  <PopoverTrigger asChild>
    <IconButton variant="standard" ariaLabel="Help">
      <HelpIcon />
    </IconButton>
  </PopoverTrigger>

  <PopoverContent side="top" className="max-w-60u">
    <p className="text-body-small text-on-surface-variant">
      Click here to learn more about this feature.
    </p>
  </PopoverContent>
</Popover>
```

---

## Design Tokens

### Corner Radius Scale (Shape)

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-xs` | 4dp | Extra Small - Chips, small elements |
| `rounded-sm` | 8dp | Small - Buttons, text fields |
| `rounded-md` | 12dp | Medium - Cards, Popovers |
| `rounded-lg` | 16dp | Large - FAB |
| `rounded-xl` | 28dp | Extra Large - Dialogs, Sheets |
| `rounded-full` | 50% | Full - Pills, circular elements |

### Elevation Scale

| Level | Shadow | Usage |
|-------|--------|-------|
| Level 0 | None | Filled containers |
| Level 1 | `shadow-1` | Elevated cards, Sheets |
| Level 2 | `shadow-2` | Popovers, Menus |
| Level 3 | `shadow-3` | Dialogs |
| Level 4 | `shadow-4` | Side sheets |

### Container Colors

| Token | Usage |
|-------|-------|
| `bg-surface` | Base surface |
| `bg-surface-container` | Popover backgrounds |
| `bg-surface-container-low` | Sheets |
| `bg-surface-container-high` | Dialogs |
| `bg-surface-container-highest` | Filled cards |

### Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `p-3u` | 12dp | Popover padding |
| `p-4u` | 16dp | Card content padding |
| `p-6u` | 24dp | Dialog padding |
| `gap-2u` | 8dp | Button spacing |

---

## Best Practices

### Container Selection

| Use Case | Component | Why |
|----------|-----------|-----|
| Group related content | Card | Provides visual grouping |
| Critical decisions | Dialog | Requires user attention |
| Contextual actions (mobile) | Bottom Sheet | Mobile-friendly |
| Quick actions | Popover | Non-blocking |

### Accessibility

```tsx
// Dialog with proper ARIA
<Dialog>
  <DialogContent role="dialog" aria-modal="true" aria-labelledby="dialog-title">
    <DialogTitle id="dialog-title">Confirm Action</DialogTitle>
    <DialogDescription>Are you sure?</DialogDescription>
  </DialogContent>
</Dialog>

// Card with interactive role
<Card interactive role="button" tabIndex={0} onKeyDown={handleKeyboard}>
  <CardContent>Clickable card</CardContent>
</Card>

// Sheet with focus trap
<Sheet>
  <SheetContent>
    {/* Focus is trapped within sheet when open */}
  </SheetContent>
</Sheet>
```

### Responsive Patterns

```tsx
// Desktop: Dialog, Mobile: Bottom Sheet
const isMobile = useMediaQuery("(max-width: 599px)");

{isMobile ? (
  <Sheet>
    <SheetContent side="bottom">...</SheetContent>
  </Sheet>
) : (
  <Dialog>
    <DialogContent>...</DialogContent>
  </Dialog>
)}
```

### Performance

```tsx
// Lazy render modal content
{open && <DialogContent>...</DialogContent>}

// Clean up on unmount
useEffect(() => {
  if (!open) return;
  document.body.style.overflow = "hidden";
  return () => { document.body.style.overflow = ""; };
}, [open]);
```

---

## Sources

- [m3.material.io/components/cards/specs](https://m3.material.io/components/cards/specs)
- [m3.material.io/components/dialogs/specs](https://m3.material.io/components/dialogs/specs)
- [m3.material.io/components/bottom-sheets](https://m3.material.io/components/bottom-sheets)
- [m3.material.io/components/menus/specs](https://m3.material.io/components/menus/specs)
- [m3.material.io/styles/shape/corner-radius-scale](https://m3.material.io/styles/shape/corner-radius-scale)
- [m3.material.io/styles/elevation/overview](https://m3.material.io/styles/elevation/overview)
- [material-components-android Card.md](https://github.com/material-components/material-components-android/blob/master/docs/components/Card.md)
- [material-components-android Dialog.md](https://github.com/material-components/material-components-android/blob/master/docs/components/Dialog.md)
- [material-components-android BottomSheet.md](https://github.com/material-components/material-components-android/blob/master/docs/components/BottomSheet.md)
