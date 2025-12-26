# Utilities

Utility components and hooks for common patterns.

## Table of Contents

1. [Ripple](#ripple)
2. [StateLayer](#statelayer)
3. [FocusRing](#focusring)
4. [Portal](#portal)
5. [VisuallyHidden](#visuallyhidden)
6. [FocusTrap](#focustrap)
7. [useMediaQuery](#usemediaquery)
8. [useDebounce](#usedebounce)
9. [useLocalStorage](#uselocalstorage)
10. [useAnimations](#useanimations)

---

## Ripple

Material Design ripple effect for interactive elements.

### File: `hooks/use-ripple.ts`

```tsx
"use client";

import { useCallback, useRef } from "react";

interface RippleOptions {
  color?: string;
  duration?: number;
  disabled?: boolean;
}

export function useRipple(options: RippleOptions = {}) {
  const {
    color = "currentColor",
    duration = 600,
    disabled = false
  } = options;

  const rippleTimeoutRef = useRef<NodeJS.Timeout>();

  const createRipple = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (disabled) return;

      const element = event.currentTarget;

      // Ensure relative or absolute positioning
      const position = window.getComputedStyle(element).position;
      if (position === 'static') {
        element.style.position = 'relative';
      }

      const ripple = document.createElement("span");
      const rect = element.getBoundingClientRect();
      const diameter = Math.max(element.clientWidth, element.clientHeight);
      const radius = diameter / 2;

      // Calculate ripple position from click point
      const x = event.clientX - rect.left - radius;
      const y = event.clientY - rect.top - radius;

      // Use cssText for better performance
      ripple.style.cssText = `
        position: absolute;
        width: ${diameter}px;
        height: ${diameter}px;
        left: ${x}px;
        top: ${y}px;
        border-radius: 50%;
        background-color: ${color};
        pointer-events: none;
        transform: scale(0);
        opacity: 0.35;
        animation: ripple ${duration}ms ease-out forwards;
      `;
      ripple.className = "ripple-effect";

      // Remove old ripples before adding new one (limit to 1 ripple at a time)
      const oldRipples = element.querySelectorAll(".ripple-effect");
      oldRipples.forEach((r) => r.remove());

      element.appendChild(ripple);

      // Cleanup with ref to prevent memory leaks
      if (rippleTimeoutRef.current) {
        clearTimeout(rippleTimeoutRef.current);
      }

      rippleTimeoutRef.current = setTimeout(() => {
        ripple.remove();
      }, duration);
    },
    [color, duration, disabled]
  );

  return createRipple;
}
```

### CSS (add to global styles):

```css
/* Move ripple animation outside @theme for better performance */
@keyframes ripple {
  from {
    opacity: 0.35;
    transform: scale(0);
  }
  to {
    opacity: 0;
    transform: scale(2);
  }
}

@layer utilities {
  /* Ripple container utility */
  .ripple-container {
    position: relative;
    overflow: hidden;
  }
}
```

### Component with Ripple

```tsx
"use client";

import { forwardRef } from "react";
import { useRipple } from "@/hooks/use-ripple";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "outlined" | "text";
  ripple?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "filled", ripple = true, onClick, className = "", children, ...props }, ref) => {
    const createRipple = useRipple({
      color: variant === "filled" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.1)",
      duration: 600,
    });

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple) {
        createRipple(e);
      }
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        onClick={handleClick}
        className={`
          relative overflow-hidden
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);
```

### Usage Example

```tsx
// Button with ripple (default)
<Button variant="filled">
  Click me
</Button>

// Disable ripple
<Button variant="filled" ripple={false}>
  No ripple
</Button>

// Custom ripple color
const createRipple = useRipple({
  color: "rgba(103, 80, 164, 0.3)",
  duration: 500,
});

<div onClick={createRipple} className="relative overflow-hidden cursor-pointer">
  <Card>Custom ripple area</Card>
</div>

// IconButton with ripple
<IconButton variant="standard" ripple>
  <span className="material-symbols-outlined">favorite</span>
</IconButton>

// List item with ripple
<ListItem
  interactive
  onClick={(e) => {
    createRipple(e);
    handleItemClick();
  }}
  className="relative overflow-hidden"
>
  Interactive list item
</ListItem>
```

### Where to Apply Ripples

Apply ripple effects to these interactive components:
- **Buttons**: All button variants (filled, outlined, text, tonal, elevated)
- **IconButtons**: All icon button variants
- **FAB**: Floating action buttons
- **Chips**: Interactive chips (filter, assist, suggestion)
- **List Items**: Interactive list items
- **Cards**: Clickable cards
- **Navigation Items**: Rail items, drawer items, tabs
- **Table Rows**: Clickable table rows

### Best Practices

```tsx
// ✅ Use relative positioning for ripple container
<button className="relative overflow-hidden">
  Content
</button>

// ✅ Appropriate ripple color for variants
const rippleColor = {
  filled: "rgba(255, 255, 255, 0.3)", // White ripple on dark background
  outlined: "rgba(0, 0, 0, 0.1)", // Dark ripple on light background
  text: "rgba(0, 0, 0, 0.08)",
}[variant];

// ✅ Disable ripple for disabled states
<Button disabled ripple={false}>
  Disabled
</Button>

// ✅ Use custom color for branded interactions
const createRipple = useRipple({
  color: "rgba(var(--color-primary) / 0.2)",
});
```

---

## StateLayer

Material Design 3 state layer system for consistent hover/focus/pressed states.

### File: `utils/state-layers.ts`

```tsx
/**
 * Material Design 3 State Layer Utilities
 * Provides consistent interactive states across all components
 */

export const stateLayers = {
  // Base state layers (apply to surface color)
  hover: "hover:bg-on-surface/8",
  focus: "focus:bg-on-surface/12",
  pressed: "active:bg-on-surface/12",
  dragged: "data-[dragged=true]:bg-on-surface/16",

  // Disabled state
  disabled: "disabled:opacity-38 disabled:cursor-not-allowed disabled:pointer-events-none",

  // Primary variant state layers
  primary: {
    hover: "hover:bg-primary/8",
    focus: "focus:bg-primary/12",
    pressed: "active:bg-primary/12",
  },

  // Secondary variant state layers
  secondary: {
    hover: "hover:bg-secondary/8",
    focus: "focus:bg-secondary/12",
    pressed: "active:bg-secondary/12",
  },

  // Tertiary variant state layers
  tertiary: {
    hover: "hover:bg-tertiary/8",
    focus: "focus:bg-tertiary/12",
    pressed: "active:bg-tertiary/12",
  },

  // Error variant state layers
  error: {
    hover: "hover:bg-error/8",
    focus: "focus:bg-error/12",
    pressed: "active:bg-error/12",
  },
} as const;

/**
 * Get state layer classes for a specific variant
 */
export function getStateLayer(variant?: "default" | "primary" | "secondary" | "tertiary" | "error") {
  if (!variant || variant === "default") {
    return `${stateLayers.hover} ${stateLayers.focus} ${stateLayers.pressed}`;
  }

  const layer = stateLayers[variant];
  return `${layer.hover} ${layer.focus} ${layer.pressed}`;
}

/**
 * Hook for state layer classes
 */
export function useStateLayer(variant?: "default" | "primary" | "secondary" | "tertiary" | "error", disabled = false) {
  const stateClasses = getStateLayer(variant);
  const disabledClass = disabled ? stateLayers.disabled : "";

  return `${stateClasses} ${disabledClass}`;
}
```

### Usage Example

```tsx
import { useStateLayer, stateLayers } from "@/utils/state-layers";

// In a button component
export const Button = ({ variant = "filled", disabled = false }) => {
  const stateLayer = useStateLayer(variant === "filled" ? "default" : "primary", disabled);

  return (
    <button
      className={`
        relative
        ${stateLayer}
        transition-colors duration-short
      `}
    >
      Content
    </button>
  );
};

// Direct usage
<div className={`p-4u ${stateLayers.hover} ${stateLayers.pressed}`}>
  Hover me
</div>

// List item with state layers
<button
  className={`
    w-full px-4u py-3u text-left
    ${getStateLayer("default")}
    ${stateLayers.disabled}
  `}
  disabled={disabled}
>
  List Item
</button>
```

---

## FocusRing

Consistent focus ring system for keyboard navigation.

### File: `utils/focus-ring.ts`

```tsx
/**
 * Material Design 3 Focus Ring System
 * Provides consistent focus indicators for keyboard navigation
 */

export const focusRing = {
  // Default focus ring (outline style)
  default: "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",

  // Inner focus ring (for buttons with background)
  inner: "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",

  // No offset (for compact elements)
  compact: "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-0",

  // Custom colors
  primary: "focus-visible:outline-primary",
  secondary: "focus-visible:outline-secondary",
  error: "focus-visible:outline-error",

  // Focus within (for container elements)
  within: "focus-within:outline focus-within:outline-2 focus-within:outline-primary",
} as const;

/**
 * Get focus ring classes
 */
export function getFocusRing(variant: keyof typeof focusRing = "default") {
  return focusRing[variant];
}

/**
 * Hook for focus ring with state
 */
export function useFocusRing(options: {
  variant?: keyof typeof focusRing;
  visible?: boolean;
} = {}) {
  const { variant = "default", visible = true } = options;

  return visible ? getFocusRing(variant) : "focus-visible:outline-none";
}
```

### CSS (add to global styles):

```css
@layer base {
  /* Remove default focus outline */
  *:focus {
    outline: none;
  }

  /* Apply custom focus ring only for keyboard navigation */
  *:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* Ensure focus is visible on interactive elements */
  button:focus-visible,
  a:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}
```

### Usage Example

```tsx
import { useFocusRing, focusRing } from "@/utils/focus-ring";

// In a button component
export const Button = () => {
  const focusRingClass = useFocusRing({ variant: "default" });

  return (
    <button className={focusRingClass}>
      Button
    </button>
  );
};

// Icon button with inner focus ring
<button
  className={`
    w-10u h-10u rounded-full
    ${focusRing.inner}
  `}
>
  <Icon />
</button>

// Link with focus ring
<a
  href="#"
  className={`
    text-primary underline
    ${focusRing.compact}
  `}
>
  Learn more
</a>

// Input field with focus within
<div
  className={`
    border border-outline rounded-sm
    ${focusRing.within}
  `}
>
  <input className="focus-visible:outline-none" />
</div>
```

---

## Portal

Render component outside DOM hierarchy.

### File: `components/ui/portal.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: React.ReactNode;
  container?: HTMLElement;
}

export const Portal = ({ children, container }: PortalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(children, container || document.body);
};
```

### Usage Example

```tsx
// Render modal in document.body
<Portal>
  <Dialog>
    <DialogContent>Modal content</DialogContent>
  </Dialog>
</Portal>

// Custom container
const modalRoot = document.getElementById("modal-root");

<Portal container={modalRoot}>
  <Modal />
</Portal>
```

---

## VisuallyHidden

Hide content visually but keep it accessible to screen readers.

### File: `components/ui/visually-hidden.tsx`

```tsx
import { forwardRef } from "react";

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

export const VisuallyHidden = forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`
          absolute w-px h-px p-0 -m-px
          overflow-hidden whitespace-nowrap
          border-0
          ${className}
        `}
        {...props}
      >
        {children}
      </span>
    );
  }
);

VisuallyHidden.displayName = "VisuallyHidden";
```

### Usage Example

```tsx
// Icon-only button with accessible label
<button>
  <span className="material-symbols-outlined">search</span>
  <VisuallyHidden>Search</VisuallyHidden>
</button>

// Skip navigation link
<a href="#main-content">
  <VisuallyHidden>Skip to main content</VisuallyHidden>
</a>

// Form field description
<div>
  <label htmlFor="password">Password</label>
  <input id="password" type="password" aria-describedby="password-hint" />
  <VisuallyHidden id="password-hint">
    Must be at least 8 characters with one number and one special character
  </VisuallyHidden>
</div>
```

---

## FocusTrap

Trap focus within a component (for modals/dialogs).

### File: `components/ui/focus-trap.tsx`

```tsx
"use client";

import { useEffect, useRef } from "react";

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  restoreFocus?: boolean;
}

export const FocusTrap = ({ children, active = true, restoreFocus = true }: FocusTrapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // Store currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Get all focusable elements
    const getFocusableElements = () => {
      return container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus first element
    const focusableElements = getFocusableElements();
    focusableElements[0]?.focus();

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      // Restore focus
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, restoreFocus]);

  return <div ref={containerRef}>{children}</div>;
};
```

### Usage Example

```tsx
// In a Dialog component
<Portal>
  <div className="fixed inset-0 z-modal">
    <FocusTrap active={open}>
      <div role="dialog" aria-modal="true">
        <h2>Dialog Title</h2>
        <p>Dialog content</p>
        <Button onClick={handleClose}>Close</Button>
      </div>
    </FocusTrap>
  </div>
</Portal>
```

---

## useMediaQuery

Hook for responsive breakpoints.

### File: `hooks/use-media-query.ts`

```tsx
"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Create listener
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Add listener
    media.addEventListener("change", listener);

    return () => {
      media.removeEventListener("change", listener);
    };
  }, [query]);

  return matches;
}

// Convenience hooks for common breakpoints
export function useBreakpoint(breakpoint: "compact" | "medium" | "expanded" | "large" | "extra-large") {
  const queries = {
    compact: "(max-width: 599px)",
    medium: "(min-width: 600px) and (max-width: 839px)",
    expanded: "(min-width: 840px) and (max-width: 1199px)",
    large: "(min-width: 1200px) and (max-width: 1599px)",
    "extra-large": "(min-width: 1600px)",
  };

  return useMediaQuery(queries[breakpoint]);
}

export function useIsMobile() {
  return useMediaQuery("(max-width: 599px)");
}

export function useIsDesktop() {
  return useMediaQuery("(min-width: 840px)");
}
```

### Usage Example

```tsx
// Custom media query
const isPortrait = useMediaQuery("(orientation: portrait)");
const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

// Breakpoint hooks
const isMobile = useIsMobile();
const isDesktop = useIsDesktop();
const isCompact = useBreakpoint("compact");

// Conditional rendering
{isMobile ? (
  <NavigationBar />
) : (
  <NavigationRail />
)}

// Responsive columns
const columns = isDesktop ? 4 : isMobile ? 1 : 2;
<Grid columns={columns}>...</Grid>
```

---

## useDebounce

Debounce rapidly changing values.

### File: `hooks/use-debounce.ts`

```tsx
"use client";

import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Debounced callback version
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}
```

### Usage Example

```tsx
// Debounced search
const [searchQuery, setSearchQuery] = useState("");
const debouncedQuery = useDebounce(searchQuery, 500);

useEffect(() => {
  if (debouncedQuery) {
    performSearch(debouncedQuery);
  }
}, [debouncedQuery]);

<TextField
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  placeholder="Search..."
/>

// Debounced callback
const debouncedSave = useDebouncedCallback((data) => {
  saveToServer(data);
}, 1000);

<TextField
  onChange={(e) => debouncedSave(e.target.value)}
/>
```

---

## useLocalStorage

Persist state in localStorage with SSR support.

### File: `hooks/use-local-storage.ts`

```tsx
"use client";

import { useState, useEffect } from "react";

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
    }
  }, [key]);

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      // Save state
      setStoredValue(valueToStore);

      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error saving localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
```

### Usage Example

```tsx
// Persist theme preference
const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "light");

<Button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
  Toggle Theme
</Button>

// Persist form data
const [formData, setFormData] = useLocalStorage("form-draft", {
  name: "",
  email: "",
  message: "",
});

<form>
  <TextField
    value={formData.name}
    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
  />
</form>

// Persist user preferences
const [preferences, setPreferences] = useLocalStorage("user-prefs", {
  fontSize: "medium",
  compactMode: false,
  notifications: true,
});

// Persist table column visibility
const [visibleColumns, setVisibleColumns] = useLocalStorage<string[]>(
  "table-columns",
  ["name", "email", "role"]
);
```

---

## Best Practices

### Portal Usage

```tsx
// ✅ Use Portal for overlays to avoid z-index issues
<Portal>
  <Dialog />
</Portal>

<Portal>
  <Tooltip />
</Portal>

// ✅ Clean up on unmount
useEffect(() => {
  return () => {
    // Portal content automatically cleaned up
  };
}, []);
```

### Accessibility Utilities

```tsx
// ✅ Use VisuallyHidden for screen reader only content
<button>
  <span className="material-symbols-outlined">delete</span>
  <VisuallyHidden>Delete item</VisuallyHidden>
</button>

// ✅ Use FocusTrap in modals
<Dialog open={open}>
  <FocusTrap active={open}>
    <DialogContent>...</DialogContent>
  </FocusTrap>
</Dialog>

// ✅ Skip links for keyboard navigation
<VisuallyHidden>
  <a href="#main-content">Skip to main content</a>
</VisuallyHidden>
```

### Responsive Design

```tsx
// ✅ Use media query hooks for conditional rendering
const isMobile = useIsMobile();

{isMobile ? <MobileNav /> : <DesktopNav />}

// ✅ Responsive component variants
const buttonSize = isMobile ? "sm" : "md";
<Button size={buttonSize}>Action</Button>

// ✅ Adapt layout based on screen size
const columns = useBreakpoint("compact") ? 1 : useBreakpoint("medium") ? 2 : 3;
```

### Performance Optimization

```tsx
// ✅ Debounce expensive operations
const debouncedSearch = useDebounce(searchQuery, 300);

useEffect(() => {
  // This only runs 300ms after user stops typing
  performExpensiveSearch(debouncedSearch);
}, [debouncedSearch]);

// ✅ Debounce API calls
const debouncedSave = useDebouncedCallback(async (data) => {
  await saveToAPI(data);
}, 500);

<TextField onChange={(e) => debouncedSave(e.target.value)} />
```

### State Persistence

```tsx
// ✅ Persist user preferences
const [settings, setSettings] = useLocalStorage("app-settings", {
  theme: "light",
  language: "en",
  notifications: true,
});

// ✅ Save form drafts
const [draft, setDraft] = useLocalStorage("comment-draft", "");

useEffect(() => {
  // Auto-save every change
  setDraft(commentText);
}, [commentText]);

// ✅ Remember user choices
const [recentSearches, setRecentSearches] = useLocalStorage<string[]>(
  "recent-searches",
  []
);

const addSearch = (query: string) => {
  setRecentSearches([query, ...recentSearches.slice(0, 9)]); // Keep last 10
};
```

### Hook Composition

```tsx
// ✅ Combine hooks for complex behaviors
const useSearchWithDebounce = (initialQuery = "") => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    setLoading(true);
    performSearch(debouncedQuery).then(data => {
      setResults(data);
      setLoading(false);
    });
  }, [debouncedQuery]);

  return { query, setQuery, results, loading };
};

// Usage
const { query, setQuery, results, loading } = useSearchWithDebounce();

<TextField value={query} onChange={(e) => setQuery(e.target.value)} />
{loading && <LinearProgress indeterminate />}
<SearchResults results={results} />
```

### SSR Considerations

```tsx
// ✅ Check for window before using browser APIs
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) return null;

// ✅ Use useEffect for localStorage
useEffect(() => {
  const saved = localStorage.getItem("key");
  if (saved) {
    setValue(JSON.parse(saved));
  }
}, []);

// ✅ Provide fallback for SSR
const isMobile = typeof window !== "undefined"
  ? useMediaQuery("(max-width: 599px)")
  : false;
```

---

## useAnimations

Reusable animation utilities for consistent motion.

### File: `utils/animations.ts`

```tsx
/**
 * Material Design 3 Animation Utilities
 * Provides consistent animations across all components
 */

export const animations = {
  // Entrance animations
  fadeIn: "animate-in fade-in duration-short",
  fadeInUp: "animate-in fade-in slide-in-from-bottom-4 duration-short",
  fadeInDown: "animate-in fade-in slide-in-from-top-4 duration-short",
  slideInFromBottom: "animate-in slide-in-from-bottom duration-emphasized",
  slideInFromTop: "animate-in slide-in-from-top duration-emphasized",
  slideInFromLeft: "animate-in slide-in-from-left duration-emphasized",
  slideInFromRight: "animate-in slide-in-from-right duration-emphasized",
  zoomIn: "animate-in zoom-in-95 duration-short",

  // Exit animations
  fadeOut: "animate-out fade-out duration-short",
  fadeOutDown: "animate-out fade-out slide-out-to-bottom-4 duration-short",
  fadeOutUp: "animate-out fade-out slide-out-to-top-4 duration-short",
  slideOutToBottom: "animate-out slide-out-to-bottom duration-emphasized",
  slideOutToTop: "animate-out slide-out-to-top duration-emphasized",
  slideOutToLeft: "animate-out slide-out-to-left duration-emphasized",
  slideOutToRight: "animate-out slide-out-to-right duration-emphasized",
  zoomOut: "animate-out zoom-out-95 duration-short",

  // Combined (entrance + exit)
  dialog: "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-short",
  dropdown: "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 duration-short",
  sheet: "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-emphasized",

  // Loading animations
  spin: "animate-spin",
  pulse: "animate-pulse",
  bounce: "animate-bounce",

  // Transition classes
  transition: {
    all: "transition-all duration-short ease-standard",
    colors: "transition-colors duration-short ease-standard",
    transform: "transition-transform duration-short ease-standard",
    opacity: "transition-opacity duration-short ease-standard",
  },
} as const;

/**
 * Hook for animation classes with state management
 */
export function useAnimations(isOpen: boolean, type: "dialog" | "dropdown" | "sheet" | "fade" = "fade") {
  const animationMap = {
    dialog: animations.dialog,
    dropdown: animations.dropdown,
    sheet: animations.sheet,
    fade: isOpen ? animations.fadeIn : animations.fadeOut,
  };

  return animationMap[type];
}

/**
 * Get entrance animation
 */
export function getEntranceAnimation(type: keyof typeof animations = "fadeIn") {
  return animations[type] || animations.fadeIn;
}

/**
 * Get exit animation
 */
export function getExitAnimation(type: "fadeOut" | "slideOutToBottom" | "zoomOut" = "fadeOut") {
  return animations[type];
}
```

### Usage Example

```tsx
import { animations, useAnimations } from "@/utils/animations";

// Dialog with entrance animation
<div
  className={`
    fixed inset-0 z-modal
    ${animations.fadeIn}
  `}
>
  <DialogContent className={animations.zoomIn}>
    Content
  </DialogContent>
</div>

// Dropdown menu
const [open, setOpen] = useState(false);

<div
  data-state={open ? "open" : "closed"}
  className={animations.dropdown}
>
  Menu items
</div>

// List item stagger
{items.map((item, index) => (
  <div
    key={item.id}
    className={animations.fadeInUp}
    style={{ animationDelay: `${index * 50}ms` }}
  >
    {item.name}
  </div>
))}

// Loading state
<div className={animations.spin}>
  <span className="material-symbols-outlined">progress_activity</span>
</div>

// Smooth transitions
<button
  className={`
    ${animations.transition.all}
    hover:scale-105
  `}
>
  Hover me
</button>
```

### CSS (add to global styles):

```css
/* Tailwind animate classes - already supported by Tailwind v4 */
@layer utilities {
  /* Custom animation utilities if needed */
  .animate-in {
    animation-fill-mode: both;
  }

  .animate-out {
    animation-fill-mode: both;
    animation-direction: reverse;
  }
}

/* Custom keyframes for stagger animations */
@keyframes stagger-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-stagger {
  animation: stagger-in 300ms ease-out;
}
```

### Best Practices

```tsx
// ✅ Use appropriate animation for context
<Dialog className={animations.dialog}> // Modal - zoom + fade
<Menu className={animations.dropdown}> // Dropdown - slide from top
<Sheet className={animations.sheet}> // Sheet - slide from bottom

// ✅ Respect user preferences
const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

<div className={prefersReducedMotion ? "" : animations.fadeIn}>
  Content
</div>

// ✅ Stagger list animations
{items.map((item, i) => (
  <div
    className={animations.fadeInUp}
    style={{ animationDelay: `${i * 50}ms` }}
  >
    {item}
  </div>
))}

// ✅ Clean transitions
<button className={animations.transition.all}>
  Smooth state changes
</button>
```

