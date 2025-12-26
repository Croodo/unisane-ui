# Feedback

Components for user feedback and status indication.

## Table of Contents

1. [Snackbar](#snackbar)
2. [Progress Indicators](#progress-indicators)
3. [Skeleton](#skeleton)

---

## Snackbar

Brief messages about app processes displayed at the bottom of the screen.

### M3 Specification

| Property | Value |
|----------|-------|
| Min Height | 48dp |
| Min Width | 288dp |
| Max Width | 560dp (or screen width - 32dp on mobile) |
| Horizontal Padding | 16dp |
| Vertical Padding | 14dp (single-line) / 12dp (two-line) |
| Corner Radius | Extra Small (4dp) |
| Elevation | Level 3 (6dp) |
| Typography | Body Medium |
| Max Lines | 2 |

| Element | Specification |
|---------|---------------|
| Action Button | Text button, inverse primary color |
| Close Icon | 24dp, optional |
| Gap (text to action) | 8dp |

| Duration | Value |
|----------|-------|
| Short | 4 seconds |
| Long | 10 seconds |
| Indefinite | Until dismissed |

| Color | Token |
|-------|-------|
| Container | `inverse-surface` |
| Text | `inverse-on-surface` |
| Action | `inverse-primary` |

> **Source**: [M3 Snackbar](https://m3.material.io/components/snackbar/specs)

### Unisane Token Mapping

```
Dimensions:
48dp min-height = min-h-12u
288dp min-width = min-w-72u
560dp max-width = max-w-140u
16dp padding = px-4u
14dp padding = py-3.5u
4dp corner radius = rounded-xs

Elevation:
Level 3 = shadow-3

Typography:
Body Medium = text-body-medium

Colors:
inverse-surface = bg-inverse-surface
inverse-on-surface = text-inverse-on-surface
inverse-primary = text-inverse-primary
```

### File: `components/ui/snackbar.tsx`

```tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/portal";

interface SnackbarContextType {
  show: (message: string, options?: SnackbarOptions) => void;
  hide: () => void;
}

interface SnackbarOptions {
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number | "short" | "long" | "indefinite";
  onClose?: () => void;
}

interface SnackbarState {
  open: boolean;
  message: string;
  options?: SnackbarOptions;
}

const DURATIONS = {
  short: 4000,
  long: 10000,
  indefinite: Infinity,
};

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const SnackbarProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<SnackbarState>({
    open: false,
    message: "",
  });

  const show = useCallback((message: string, options?: SnackbarOptions) => {
    setState({ open: true, message, options });
  }, []);

  const hide = useCallback(() => {
    setState((prev) => {
      prev.options?.onClose?.();
      return { ...prev, open: false };
    });
  }, []);

  useEffect(() => {
    if (!state.open) return;

    const durationOption = state.options?.duration ?? "short";
    const duration = typeof durationOption === "number"
      ? durationOption
      : DURATIONS[durationOption];

    if (duration === Infinity) return;

    const timer = setTimeout(hide, duration);
    return () => clearTimeout(timer);
  }, [state.open, state.options?.duration, hide]);

  return (
    <SnackbarContext.Provider value={{ show, hide }}>
      {children}
      {state.open && (
        <Portal>
          <div className="fixed bottom-4u left-4u right-4u md:left-auto md:right-4u z-50 flex justify-center md:justify-end">
            <div
              className={cn(
                "min-h-12u min-w-72u max-w-140u",
                "px-4u py-3.5u rounded-xs shadow-3",
                "bg-inverse-surface text-inverse-on-surface",
                "flex items-center gap-2u",
                "animate-in slide-in-from-bottom-4 fade-in duration-short"
              )}
              role="status"
              aria-live="polite"
            >
              {/* Message - max 2 lines */}
              <span className="text-body-medium flex-1 line-clamp-2">
                {state.message}
              </span>

              {/* Action button */}
              {state.options?.action && (
                <button
                  onClick={() => {
                    state.options?.action?.onClick();
                    hide();
                  }}
                  className={cn(
                    "text-label-large font-medium text-inverse-primary",
                    "px-2u py-1.5u -mr-2u rounded-xs",
                    "hover:bg-inverse-primary/8 active:bg-inverse-primary/12",
                    "transition-colors duration-short"
                  )}
                >
                  {state.options.action.label}
                </button>
              )}

              {/* Close button */}
              <button
                onClick={hide}
                className={cn(
                  "w-6u h-6u flex items-center justify-center rounded-xs",
                  "hover:bg-inverse-on-surface/8 active:bg-inverse-on-surface/12",
                  "transition-colors duration-short"
                )}
                aria-label="Dismiss"
              >
                <span className="material-symbols-outlined text-5u">close</span>
              </button>
            </div>
          </div>
        </Portal>
      )}
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within SnackbarProvider");
  }
  return context;
};
```

### Usage Example

```tsx
// 1. Wrap app with provider
<SnackbarProvider>
  <App />
</SnackbarProvider>

// 2. Use in components
const MyComponent = () => {
  const snackbar = useSnackbar();

  const handleSave = async () => {
    try {
      await saveData();
      snackbar.show("Changes saved", { duration: "short" });
    } catch (error) {
      snackbar.show("Failed to save changes", {
        duration: "long",
        action: {
          label: "Retry",
          onClick: handleSave,
        },
      });
    }
  };

  const handleDelete = () => {
    const item = deleteItem();
    snackbar.show("Item deleted", {
      action: {
        label: "Undo",
        onClick: () => restoreItem(item),
      },
    });
  };

  return <Button onClick={handleSave}>Save</Button>;
};
```

---

## Progress Indicators

Visual indicators for loading states and progress.

### M3 Specification

#### Linear Progress Indicator

| Property | Value |
|----------|-------|
| Track Thickness | 4dp (default) / 8dp (thick) |
| Track Corner Radius | Full (50%) |
| Indicator-Track Gap | 4dp |
| Stop Indicator Size | 4dp (determinate only) |
| Active Indicator Corner | Rounded |

#### Circular Progress Indicator

| Property | Value |
|----------|-------|
| Diameter | 48dp (default) |
| Medium Diameter | 40dp |
| Small Diameter | 32dp |
| Extra Small Diameter | 24dp |
| Stroke Width | 4dp |
| Inset | 4dp |
| Gap Size | 4dp |

| Color | Token |
|-------|-------|
| Active Indicator | `primary` |
| Track | `surface-container-highest` |

> **Source**: [M3 Progress Indicators](https://m3.material.io/components/progress-indicators/specs)

### Unisane Token Mapping

```
Linear Track:
4dp thickness = h-1u
8dp thickness = h-2u
Full corner = rounded-full

Circular Sizes:
48dp = w-12u h-12u
40dp = w-10u h-10u
32dp = w-8u h-8u
24dp = w-6u h-6u

Stroke Width:
4dp = strokeWidth: 4 (SVG)

Colors:
primary = text-primary / stroke-primary
surface-container-highest = text-surface-container-highest
```

### File: `components/ui/progress.tsx`

```tsx
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Linear Progress Indicator
const linearProgressVariants = cva(
  "w-full bg-surface-container-highest rounded-full overflow-hidden",
  {
    variants: {
      size: {
        sm: "h-1u",    // 4dp - default M3
        md: "h-1.5u",  // 6dp
        lg: "h-2u",    // 8dp - thick variant
      },
    },
    defaultVariants: {
      size: "sm",
    },
  }
);

interface LinearProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof linearProgressVariants> {
  value?: number; // 0-100
  indeterminate?: boolean;
}

export const LinearProgress = forwardRef<HTMLDivElement, LinearProgressProps>(
  ({ value = 0, indeterminate = false, size = "sm", className, ...props }, ref) => {
    const clampedValue = Math.min(100, Math.max(0, value));

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(linearProgressVariants({ size }), className)}
        {...props}
      >
        <div
          className={cn(
            "h-full bg-primary rounded-full transition-[width] duration-medium ease-standard",
            indeterminate && "animate-indeterminate-progress"
          )}
          style={{
            width: indeterminate ? "30%" : `${clampedValue}%`,
          }}
        />
      </div>
    );
  }
);

LinearProgress.displayName = "LinearProgress";

// Circular Progress Indicator
const circularProgressSizes = {
  xs: { size: 24, stroke: 3 },  // Extra small
  sm: { size: 32, stroke: 3 },  // Small
  md: { size: 40, stroke: 4 },  // Medium
  lg: { size: 48, stroke: 4 },  // Default
} as const;

interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0-100
  indeterminate?: boolean;
  size?: keyof typeof circularProgressSizes;
}

export const CircularProgress = forwardRef<HTMLDivElement, CircularProgressProps>(
  ({ value = 0, indeterminate = false, size = "lg", className, ...props }, ref) => {
    const { size: diameter, stroke } = circularProgressSizes[size];
    const radius = (diameter - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const clampedValue = Math.min(100, Math.max(0, value));
    const progress = indeterminate ? 25 : clampedValue;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn("inline-flex", className)}
        {...props}
      >
        <svg
          width={diameter}
          height={diameter}
          className={cn(indeterminate && "animate-spin")}
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Track circle */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-surface-container-highest"
          />
          {/* Active indicator */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-primary transition-[stroke-dashoffset] duration-medium ease-standard"
          />
        </svg>
      </div>
    );
  }
);

CircularProgress.displayName = "CircularProgress";
```

### Usage Example

```tsx
// Linear progress - determinate
<LinearProgress value={75} />

// Linear progress - indeterminate
<LinearProgress indeterminate />

// Linear progress - thick variant
<LinearProgress value={50} size="lg" />

// Circular progress - different sizes
<div className="flex items-center gap-4u">
  <CircularProgress size="xs" indeterminate />
  <CircularProgress size="sm" indeterminate />
  <CircularProgress size="md" value={60} />
  <CircularProgress size="lg" value={80} />
</div>

// Loading button
<Button disabled={loading}>
  {loading && <CircularProgress size="xs" indeterminate className="mr-2u" />}
  {loading ? "Saving..." : "Save"}
</Button>

// Full page loading
<div className="flex items-center justify-center h-full">
  <CircularProgress size="lg" indeterminate />
</div>
```

---

## Skeleton

Placeholder content shown during loading states.

### M3 Specification

| Property | Value |
|----------|-------|
| Background | `surface-container-highest` |
| Animation | Pulse (opacity 0.4 → 1.0) |
| Animation Duration | 1.5s |
| Corner Radius | Match content shape |

| Variant | Shape |
|---------|-------|
| Text | 4dp corners, height matches line-height |
| Rectangular | 12dp corners (Medium) |
| Circular | Full (50%) |

### Unisane Token Mapping

```
Background:
surface-container-highest = bg-surface-container-highest

Animation:
Tailwind pulse = animate-pulse

Corner Radius:
Text: rounded-xs (4dp)
Rectangular: rounded-md (12dp)
Circular: rounded-full

Heights:
Text line: h-4u (matches body text)
Avatar: w-10u h-10u
Card: variable
```

### File: `components/ui/skeleton.tsx`

```tsx
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const skeletonVariants = cva("bg-surface-container-highest animate-pulse", {
  variants: {
    variant: {
      text: "rounded-xs h-4u",           // 4dp corners, body text height
      rectangular: "rounded-md",          // 12dp corners
      circular: "rounded-full",           // Full circle
    },
  },
  defaultVariants: {
    variant: "text",
  },
});

interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  width?: string | number;
  height?: string | number;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = "text", width, height, className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant }), className)}
        style={{
          width: width ?? (variant === "circular" ? height : "100%"),
          height: height ?? (variant === "text" ? undefined : "100%"),
          ...style,
        }}
        aria-hidden="true"
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

// Pre-built skeleton patterns
export const SkeletonText = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-2u">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        width={i === lines - 1 ? "60%" : "100%"}
      />
    ))}
  </div>
);

export const SkeletonCard = () => (
  <div className="rounded-md bg-surface-container p-4u space-y-4u">
    <Skeleton variant="rectangular" height="160px" />
    <Skeleton variant="text" width="70%" />
    <Skeleton variant="text" width="90%" />
    <Skeleton variant="text" width="50%" />
  </div>
);

export const SkeletonListItem = () => (
  <div className="flex items-center gap-4u px-4u py-3u">
    <Skeleton variant="circular" width={40} height={40} />
    <div className="flex-1 space-y-2u">
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="text" width="60%" />
    </div>
  </div>
);
```

### Usage Example

```tsx
// Basic skeleton shapes
<Skeleton variant="text" />
<Skeleton variant="rectangular" width="100%" height="200px" />
<Skeleton variant="circular" width={48} height={48} />

// Text block skeleton
<SkeletonText lines={4} />

// Card skeleton
<SkeletonCard />

// List skeleton
<div>
  <SkeletonListItem />
  <SkeletonListItem />
  <SkeletonListItem />
</div>

// Loading state pattern
{isLoading ? (
  <div className="space-y-4u">
    <SkeletonCard />
    <SkeletonCard />
  </div>
) : (
  <CardList items={items} />
)}

// Avatar with text loading
<div className="flex items-center gap-3u">
  <Skeleton variant="circular" width={40} height={40} />
  <div className="flex-1 space-y-2u">
    <Skeleton variant="text" width="30%" />
    <Skeleton variant="text" width="50%" />
  </div>
</div>
```

---

## Accessibility

### Snackbar

- Use `role="status"` and `aria-live="polite"` for non-urgent messages
- Use `role="alert"` and `aria-live="assertive"` for urgent messages
- Ensure action buttons have descriptive labels
- Don't rely on snackbars for critical information

### Progress Indicators

- Always include `role="progressbar"`
- Set `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` for determinate progress
- Omit `aria-valuenow` for indeterminate progress
- Add descriptive `aria-label` when context isn't clear

```tsx
<LinearProgress
  value={uploadProgress}
  aria-label="Uploading file"
/>

<CircularProgress
  indeterminate
  aria-label="Loading content"
/>
```

### Skeleton

- Use `aria-hidden="true"` since skeletons are purely decorative
- Ensure the loading state is announced to screen readers separately
- Consider adding `aria-busy="true"` to the loading container

```tsx
<div aria-busy={isLoading} aria-label="Content loading">
  {isLoading ? <SkeletonCard /> : <Card data={data} />}
</div>
```

---

## Best Practices

### Snackbar Usage

```tsx
// ✅ Brief, actionable messages
snackbar.show("Email sent", { action: { label: "Undo", onClick: undo } });

// ✅ Error with retry action
snackbar.show("Connection failed", {
  duration: "long",
  action: { label: "Retry", onClick: retry },
});

// ❌ Don't use for critical errors
// Use a dialog or inline error instead

// ❌ Don't show too much text
snackbar.show("Your changes have been saved successfully to the database..."); // Too long
```

### Progress Indicator Selection

```tsx
// ✅ Linear for page-level operations
<LinearProgress indeterminate /> // Top of page during navigation

// ✅ Circular for component-level loading
<Button>
  <CircularProgress size="xs" />
  Loading...
</Button>

// ✅ Determinate when progress is known
<LinearProgress value={(uploaded / total) * 100} />

// ✅ Indeterminate when duration is unknown
<CircularProgress indeterminate />
```

### Skeleton Patterns

```tsx
// ✅ Match skeleton to content structure
<SkeletonListItem /> // Matches ListItem layout

// ✅ Use realistic proportions
<Skeleton variant="text" width="70%" /> // Not always 100%

// ✅ Animate with pulse, not shimmer (M3 recommendation)
className="animate-pulse" // Built into Skeleton component

// ❌ Don't use for very short loading times
// Show content directly if loading < 200ms
```
