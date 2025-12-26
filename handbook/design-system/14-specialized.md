# Specialized Components

Advanced components for specific use cases.

## Table of Contents

1. [Resizable](#resizable)
2. [ContextMenu](#contextmenu)
3. [Command](#command)
4. [DatePicker](#datepicker)
5. [Combobox](#combobox)

---

## Resizable

Resizable panels with drag handles.

### File: `components/ui/resizable.tsx`

```tsx
"use client";

import { useState, useRef, useCallback, createContext, useContext, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

interface ResizableContextType {
  sizes: number[];
  setSizes: (sizes: number[]) => void;
}

const ResizableContext = createContext<ResizableContextType | undefined>(undefined);

const resizableVariants = cva("flex w-full h-full", {
  variants: {
    direction: {
      horizontal: "flex-row",
      vertical: "flex-col",
    },
  },
  defaultVariants: {
    direction: "horizontal",
  },
});

interface ResizableProps extends VariantProps<typeof resizableVariants> {
  children: React.ReactNode;
  defaultSizes?: number[];
  onResize?: (sizes: number[]) => void;
  className?: string;
}

export const Resizable = ({
  children,
  direction = "horizontal",
  defaultSizes = [50, 50],
  onResize,
  className,
}: ResizableProps) => {
  const [sizes, setSizes] = useState(defaultSizes);

  const handleResize = (newSizes: number[]) => {
    setSizes(newSizes);
    onResize?.(newSizes);
  };

  return (
    <ResizableContext.Provider value={{ sizes, setSizes: handleResize }}>
      <div className={cn(resizableVariants({ direction }), className)}>
        {children}
      </div>
    </ResizableContext.Provider>
  );
};

// Resizable Panel
interface ResizablePanelProps {
  children: React.ReactNode;
  index: number;
  minSize?: number;
  maxSize?: number;
  className?: string;
}

export const ResizablePanel = ({
  children,
  index,
  minSize = 10,
  maxSize = 90,
  className,
}: ResizablePanelProps) => {
  const context = useContext(ResizableContext);
  if (!context) throw new Error("ResizablePanel must be used within Resizable");

  const size = context.sizes[index] || 50;

  return (
    <div
      style={{ flexBasis: `${size}%` }}
      className={cn("overflow-auto", className)}
    >
      {children}
    </div>
  );
};

// Resizable Handle
const resizableHandleVariants = cva(
  "flex-shrink-0 transition-colors duration-short",
  {
    variants: {
      direction: {
        horizontal: "w-1u cursor-col-resize",
        vertical: "h-1u cursor-row-resize",
      },
      isDragging: {
        true: "bg-primary",
        false: "bg-outline-variant hover:bg-primary",
      },
    },
    defaultVariants: {
      direction: "horizontal",
      isDragging: false,
    },
  }
);

interface ResizableHandleProps extends VariantProps<typeof resizableHandleVariants> {
  index: number;
  className?: string;
}

export const ResizableHandle = ({
  index,
  direction = "horizontal",
  className,
}: ResizableHandleProps) => {
  const context = useContext(ResizableContext);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!context) throw new Error("ResizableHandle must be used within Resizable");

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);

      const startPos = direction === "horizontal" ? e.clientX : e.clientY;
      const startSizes = [...context.sizes];

      const handleMouseMove = (e: MouseEvent) => {
        const currentPos = direction === "horizontal" ? e.clientX : e.clientY;
        const delta = currentPos - startPos;
        const container = containerRef.current?.parentElement;
        if (!container) return;

        const containerSize =
          direction === "horizontal" ? container.offsetWidth : container.offsetHeight;
        const deltaPercent = (delta / containerSize) * 100;

        const newSizes = [...startSizes];
        newSizes[index] = Math.max(10, Math.min(90, startSizes[index] + deltaPercent));
        newSizes[index + 1] = Math.max(10, Math.min(90, startSizes[index + 1] - deltaPercent));

        context.setSizes(newSizes);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [context, direction, index]
  );

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      className={cn(resizableHandleVariants({ direction, isDragging }), className)}
    />
  );
};
```

### Usage Example

```tsx
<Resizable direction="horizontal" defaultSizes={[60, 40]}>
  <ResizablePanel index={0}>
    <div className="p-6u">
      <h2>Left Panel</h2>
      <p>Resizable content</p>
    </div>
  </ResizablePanel>

  <ResizableHandle index={0} direction="horizontal" />

  <ResizablePanel index={1}>
    <div className="p-6u">
      <h2>Right Panel</h2>
      <p>Resizable content</p>
    </div>
  </ResizablePanel>
</Resizable>

// Vertical layout
<Resizable direction="vertical" defaultSizes={[30, 70]} className="h-screen">
  <ResizablePanel index={0}>
    <TopContent />
  </ResizablePanel>

  <ResizableHandle index={0} direction="vertical" />

  <ResizablePanel index={1}>
    <BottomContent />
  </ResizablePanel>
</Resizable>
```

---

## ContextMenu

Right-click context menu.

### File: `components/ui/context-menu.tsx`

```tsx
"use client";

import { createContext, useContext, useState, useRef, useEffect } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/portal";
import { Ripple } from "@/components/ui/ripple";
import { animations } from "@/utils/animations";
import { stateLayers } from "@/utils/state-layers";

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

  return (
    <children.type
      {...children.props}
      onContextMenu={handleContextMenu}
    />
  );
};

// Context Menu Content
const contextMenuContentVariants = cva(
  cn("min-w-50u bg-surface-container rounded-sm shadow-3 py-2u", animations.fadeIn, animations.zoomIn)
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
        role="menu"
        style={{
          position: "fixed",
          top: `${context.position.y}px`,
          left: `${context.position.x}px`,
          zIndex: "var(--z-popover)",
        }}
        className={cn(contextMenuContentVariants(), className)}
      >
        {children}
      </div>
    </Portal>
  );
};

// Context Menu Item
const contextMenuItemVariants = cva(
  cn("w-full flex items-center justify-between gap-4u px-3u h-10u text-body-medium text-left relative overflow-hidden", stateLayers.hover, stateLayers.pressed, animations.transition.colors),
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
      role="menuitem"
      onClick={(e) => {
        props.onClick?.(e);
        context?.setOpen(false);
      }}
      className={cn(contextMenuItemVariants({ destructive }), className)}
      {...props}
    >
      <Ripple />
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
```

### Usage Example

```tsx
<ContextMenu>
  <ContextMenuTrigger>
    <div className="p-8u bg-surface-container rounded-lg">
      Right-click me
    </div>
  </ContextMenuTrigger>

  <ContextMenuContent>
    <ContextMenuItem
      icon={<span className="material-symbols-outlined">content_copy</span>}
      shortcut="⌘C"
    >
      Copy
    </ContextMenuItem>
    <ContextMenuItem
      icon={<span className="material-symbols-outlined">content_cut</span>}
      shortcut="⌘X"
    >
      Cut
    </ContextMenuItem>
    <ContextMenuItem
      icon={<span className="material-symbols-outlined">content_paste</span>}
      shortcut="⌘V"
    >
      Paste
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem
      destructive
      icon={<span className="material-symbols-outlined">delete</span>}
      shortcut="⌫"
    >
      Delete
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

---

## Command

Command palette (⌘K) for keyboard shortcuts.

### File: `components/ui/command.tsx`

```tsx
"use client";

import { useState, useEffect, useRef, createContext, useContext } from "react";

interface CommandContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  search: string;
  setSearch: (search: string) => void;
}

const CommandContext = createContext<CommandContextType | undefined>(undefined);

interface CommandProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Command = ({ children, open: controlledOpen, onOpenChange }: CommandProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (value: boolean) => {
    if (!isControlled) {
      setInternalOpen(value);
    }
    onOpenChange?.(value);
    if (!value) setSearch("");
  };

  // Global keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <CommandContext.Provider value={{ open, setOpen, search, setSearch }}>
      {children}
    </CommandContext.Provider>
  );
};

// Command Dialog
export const CommandDialog = ({ children }: { children: React.ReactNode }) => {
  const context = useContext(CommandContext);
  if (!context) throw new Error("CommandDialog must be used within Command");

  if (!context.open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-scrim z-modal animate-in fade-in duration-short"
        onClick={() => context.setOpen(false)}
      />

      {/* Command Palette */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 z-modal w-full max-w-[600px] px-4u">
        <div className="bg-surface-container rounded-lg shadow-4 animate-in fade-in zoom-in-95 duration-short">
          {children}
        </div>
      </div>
    </>
  );
};

// Command Input
export const CommandInput = ({ placeholder = "Type a command or search..." }: { placeholder?: string }) => {
  const context = useContext(CommandContext);
  if (!context) throw new Error("CommandInput must be used within Command");

  return (
    <div className="flex items-center gap-3u px-4u border-b border-outline-variant">
      <span className="material-symbols-outlined text-on-surface-variant">search</span>
      <input
        value={context.search}
        onChange={(e) => context.setSearch(e.target.value)}
        placeholder={placeholder}
        className="flex-1 h-14u bg-transparent text-body-large text-on-surface outline-none placeholder:text-on-surface-variant"
        autoFocus
      />
      <kbd className="hidden sm:inline-flex h-6u items-center gap-1u rounded bg-surface-container-high px-2u text-label-small text-on-surface-variant">
        <span className="text-xs">⌘</span>K
      </kbd>
    </div>
  );
};

// Command List
export const CommandList = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="max-h-[400px] overflow-y-auto py-2u">
      {children}
    </div>
  );
};

// Command Group
export const CommandGroup = ({ heading, children }: { heading?: string; children: React.ReactNode }) => {
  return (
    <div className="px-2u pb-2u">
      {heading && (
        <div className="px-3u py-2u text-label-small font-medium text-on-surface-variant">
          {heading}
        </div>
      )}
      {children}
    </div>
  );
};

// Command Item
interface CommandItemProps {
  children: React.ReactNode;
  onSelect?: () => void;
  icon?: React.ReactNode;
  shortcut?: string;
  keywords?: string[];
}

export const CommandItem = ({ children, onSelect, icon, shortcut, keywords = [] }: CommandItemProps) => {
  const context = useContext(CommandContext);
  if (!context) throw new Error("CommandItem must be used within Command");

  // Filter based on search
  const searchLower = context.search.toLowerCase();
  const childText = typeof children === "string" ? children : "";
  const matches =
    childText.toLowerCase().includes(searchLower) ||
    keywords.some((k) => k.toLowerCase().includes(searchLower));

  if (context.search && !matches) return null;

  return (
    <button
      onClick={() => {
        onSelect?.();
        context.setOpen(false);
      }}
      className="w-full flex items-center justify-between gap-3u px-3u h-12u rounded-sm hover:bg-on-surface/8 transition-colors duration-short text-left"
    >
      <div className="flex items-center gap-3u">
        {icon && <span className="w-5u h-5u flex items-center justify-center text-on-surface-variant">{icon}</span>}
        <span className="text-body-medium text-on-surface">{children}</span>
      </div>
      {shortcut && (
        <kbd className="text-label-small text-on-surface-variant">{shortcut}</kbd>
      )}
    </button>
  );
};

// Command Empty
export const CommandEmpty = ({ children = "No results found." }: { children?: React.ReactNode }) => {
  const context = useContext(CommandContext);
  if (!context) throw new Error("CommandEmpty must be used within Command");

  return (
    <div className="py-6u text-center text-body-medium text-on-surface-variant">
      {children}
    </div>
  );
};
```

### Usage Example

```tsx
const [open, setOpen] = useState(false);

<Command open={open} onOpenChange={setOpen}>
  <CommandDialog>
    <CommandInput placeholder="Type a command..." />
    <CommandList>
      <CommandGroup heading="Suggestions">
        <CommandItem
          icon={<span className="material-symbols-outlined">calendar_today</span>}
          shortcut="⌘C"
          keywords={["calendar", "schedule", "events"]}
          onSelect={() => router.push("/calendar")}
        >
          Calendar
        </CommandItem>
        <CommandItem
          icon={<span className="material-symbols-outlined">search</span>}
          shortcut="⌘S"
          onSelect={() => router.push("/search")}
        >
          Search Emoji
        </CommandItem>
      </CommandGroup>

      <CommandGroup heading="Settings">
        <CommandItem
          icon={<span className="material-symbols-outlined">person</span>}
          onSelect={() => router.push("/profile")}
        >
          Profile
        </CommandItem>
        <CommandItem
          icon={<span className="material-symbols-outlined">settings</span>}
          onSelect={() => router.push("/settings")}
        >
          Settings
        </CommandItem>
      </CommandGroup>
    </CommandList>
    <CommandEmpty />
  </CommandDialog>
</Command>

// Trigger button
<Button onClick={() => setOpen(true)}>
  <span className="material-symbols-outlined">search</span>
  Search...
  <kbd className="ml-auto text-xs">⌘K</kbd>
</Button>
```

---

## DatePicker

Date selection component.

### File: `components/ui/date-picker.tsx`

```tsx
"use client";

import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const datePickerDayVariants = cva(
  "h-8u rounded-full text-body-medium transition-all duration-short",
  {
    variants: {
      selected: {
        true: "bg-primary text-on-primary",
        false: "text-on-surface hover:bg-on-surface/8",
      },
      isCurrentDay: {
        true: "border border-primary",
        false: "",
      },
      disabled: {
        true: "opacity-38 cursor-not-allowed",
        false: "cursor-pointer",
      },
    },
    compoundVariants: [
      {
        selected: true,
        isCurrentDay: true,
        className: "border-0",
      },
    ],
    defaultVariants: {
      selected: false,
      isCurrentDay: false,
      disabled: false,
    },
  }
);

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export const DatePicker = ({ value, onChange, minDate, maxDate, className }: DatePickerProps) => {
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get starting day of week (0 = Sunday)
  const startingDayOfWeek = monthStart.getDay();
  const emptyDays = Array(startingDayOfWeek).fill(null);

  const handleDateClick = (date: Date) => {
    if (minDate && date < minDate) return;
    if (maxDate && date > maxDate) return;

    setSelectedDate(date);
    onChange(date);
  };

  return (
    <div className={cn("w-full max-w-80u bg-surface-container rounded-lg p-4u", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4u">
        <IconButton
          variant="standard"
          size="sm"
          ariaLabel="Previous month"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </IconButton>

        <div className="text-title-medium font-medium">
          {format(currentMonth, "MMMM yyyy")}
        </div>

        <IconButton
          variant="standard"
          size="sm"
          ariaLabel="Next month"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </IconButton>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1u mb-2u">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="text-center text-label-small text-on-surface-variant font-medium h-8u flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1u">
        {/* Empty cells for days before month starts */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} />
        ))}

        {/* Days */}
        {days.map((day) => {
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);
          const isDisabled =
            (minDate && day < minDate) || (maxDate && day > maxDate);

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              disabled={isDisabled}
              className={datePickerDayVariants({
                selected: isSelected,
                isCurrentDay: isCurrentDay && !isSelected,
                disabled: isDisabled,
              })}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      {/* Footer with today button */}
      <div className="mt-4u pt-4u border-t border-outline-variant">
        <Button
          variant="text"
          size="sm"
          fullWidth
          onClick={() => {
            const today = new Date();
            setCurrentMonth(today);
            handleDateClick(today);
          }}
        >
          Today
        </Button>
      </div>
    </div>
  );
};
```

### Usage Example

```tsx
const [date, setDate] = useState<Date>(new Date());

<DatePicker
  value={date}
  onChange={setDate}
  minDate={new Date()}
  maxDate={addMonths(new Date(), 3)}
/>

// In a popover
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outlined">
      <span className="material-symbols-outlined">calendar_today</span>
      {date ? format(date, "PPP") : "Pick a date"}
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    <DatePicker value={date} onChange={setDate} />
  </PopoverContent>
</Popover>
```

---

## Combobox

Autocomplete input with dropdown.

### File: `components/ui/combobox.tsx`

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/portal";
import { Ripple } from "@/components/ui/ripple";
import { animations } from "@/utils/animations";
import { stateLayers } from "@/utils/state-layers";
import { focusRing } from "@/utils/focus-ring";
import { useDebounce } from "@/hooks/use-debounce";

interface ComboboxOption {
  value: string;
  label: string;
}

const comboboxOptionVariants = cva(
  cn("w-full flex items-center justify-between px-4u h-12u text-body-medium text-left relative overflow-hidden", stateLayers.hover, stateLayers.pressed, animations.transition.colors),
  {
    variants: {
      selected: {
        true: "bg-secondary-container text-on-secondary-container",
        false: "text-on-surface",
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
);

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const Combobox = ({
  options,
  value,
  onChange,
  placeholder = "Search...",
  className,
}: ComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Update position when open
  useEffect(() => {
    if (!open || !inputRef.current) return;

    const updatePosition = () => {
      const rect = inputRef.current!.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [open]);

  return (
    <div className={cn("relative", className)}>
      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={open ? search : selectedOption?.label || ""}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={cn(
            "w-full h-12u px-4u pr-10u bg-surface-container-highest border border-outline rounded-sm text-body-large text-on-surface outline-none",
            focusRing.within,
            animations.transition.colors
          )}
        />
        <button
          onClick={() => setOpen(!open)}
          className={cn("absolute right-2u top-1/2 -translate-y-1/2 w-6u h-6u flex items-center justify-center text-on-surface-variant", stateLayers.hover)}
        >
          <span className="material-symbols-outlined w-5u h-5u">
            {open ? "expand_less" : "expand_more"}
          </span>
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <Portal>
          <div
            ref={listRef}
            role="listbox"
            style={{
              position: "fixed",
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${position.width}px`,
              zIndex: "var(--z-popover)",
            }}
            className={cn("bg-surface-container rounded-sm shadow-2 max-h-75u overflow-y-auto py-2u", animations.fadeIn, animations.zoomIn)}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-4u py-3u text-body-medium text-on-surface-variant text-center">
                No results found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  role="option"
                  aria-selected={value === option.value}
                  onClick={() => {
                    onChange(option.value);
                    setSearch("");
                    setOpen(false);
                  }}
                  className={comboboxOptionVariants({ selected: value === option.value })}
                >
                  <Ripple />
                  <span>{option.label}</span>
                  {value === option.value && (
                    <span className="material-symbols-outlined w-5u h-5u">check</span>
                  )}
                </button>
              ))
            )}
          </div>
        </Portal>
      )}
    </div>
  );
};
```

### Usage Example

```tsx
const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "Svelte" },
  { value: "angular", label: "Angular" },
];

const [framework, setFramework] = useState("");

<Combobox
  options={frameworks}
  value={framework}
  onChange={setFramework}
  placeholder="Select framework..."
/>
```

---

## Best Practices

### Resizable Panels

```tsx
// ✅ Persist sizes to localStorage
const [sizes, setSizes] = useLocalStorage("panel-sizes", [50, 50]);

<Resizable
  defaultSizes={sizes}
  onResize={setSizes}
>
  ...
</Resizable>

// ✅ Set min/max constraints
<ResizablePanel minSize={20} maxSize={80}>
  Content
</ResizablePanel>
```

### Context Menu

```tsx
// ✅ Group related actions
<ContextMenuContent>
  <ContextMenuGroup heading="Edit">
    <ContextMenuItem>Copy</ContextMenuItem>
    <ContextMenuItem>Cut</ContextMenuItem>
  </ContextMenuGroup>
  <ContextMenuSeparator />
  <ContextMenuGroup heading="Danger">
    <ContextMenuItem destructive>Delete</ContextMenuItem>
  </ContextMenuGroup>
</ContextMenuContent>

// ✅ Show keyboard shortcuts
<ContextMenuItem shortcut="⌘C">Copy</ContextMenuItem>
```

### Command Palette

```tsx
// ✅ Add keywords for better search
<CommandItem keywords={["settings", "preferences", "config"]}>
  Settings
</CommandItem>

// ✅ Group by category
<CommandGroup heading="Navigation">
  <CommandItem>Home</CommandItem>
  <CommandItem>Dashboard</CommandItem>
</CommandGroup>

// ✅ Global keyboard shortcut
useEffect(() => {
  const down = (e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setOpen((open) => !open);
    }
  };
  document.addEventListener("keydown", down);
  return () => document.removeEventListener("keydown", down);
}, []);
```

### Date Picker

```tsx
// ✅ Set date constraints
<DatePicker
  minDate={new Date()}
  maxDate={addMonths(new Date(), 6)}
  onChange={setDate}
/>

// ✅ Format display value
<Button>
  {date ? format(date, "PPP") : "Pick a date"}
</Button>

// ✅ Use with form validation
const { register, setValue } = useForm();

<DatePicker
  onChange={(date) => setValue("date", date)}
/>
```

### Combobox

```tsx
// ✅ Async options loading
const [options, setOptions] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  if (search) {
    setLoading(true);
    fetchOptions(search).then(setOptions).finally(() => setLoading(false));
  }
}, [search]);

// ✅ Virtual scrolling for large lists
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: options.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 48,
});
```
