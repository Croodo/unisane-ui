# Getting Started - Design System Overview

A comprehensive guide to understanding and using this Material Design 3 token-based design system in Next.js.

## Quick Start (5-Minute Setup)

```bash
# 1. Install the CLI
pnpm add -D @unisane/cli
# or
npx @unisane/cli init

# 2. Initialize your project (copies all files locally)
npx @unisane/cli init

# 3. Install dependencies
pnpm add clsx tailwind-merge class-variance-authority

# 4. Add components as needed
npx @unisane/cli add button
npx @unisane/cli add card
```

**Setup Flow:**
```
CLI Init → Files Copied to Project → Install Dependencies → Add Components
```

**What gets copied to your project:**
```
src/
├── styles/
│   ├── uni-tokens.css      # Design tokens (CSS variables)
│   ├── uni-theme.css       # Tailwind v4 theme mapping
│   └── uni-base.css        # Animations & utilities
├── lib/
│   └── utils.ts            # cn(), focusRing, stateLayer
├── components/
│   ├── theme-provider.tsx  # Theme management
│   └── ui/                 # UI components added here
└── app/
    └── globals.css         # Updated with imports
```

---

## Table of Contents

1. [System Architecture](#system-architecture) - Understand the philosophy
2. [Installation & Dependencies](#installation--dependencies) - Install required packages
3. [Design Tokens](#design-tokens) - Define your token system
4. [Global CSS Setup](#global-css-setup) - Configure base styles
5. [Tailwind Integration](#tailwind-integration) - Map tokens to Tailwind
6. [Core Utilities](#core-utilities) - Set up cn, CVA, and Ripple
7. [Component Library](#component-library) - Build your first component
8. [Theme Provider](#theme-provider) - Add theme management
9. [Utilities & Hooks](#utilities--hooks) - Common patterns
10. [Best Practices](#best-practices) - Guidelines and tips

---

## System Architecture

### Philosophy

This design system is built on **design tokens** - a single source of truth for all design decisions:

```
Reference Tokens (Palettes)
    ↓
System Tokens (Semantic Roles)
    ↓
Tailwind Theme Mapping
    ↓
Components (Consumption Only)
```

**Key Principles:**
- ✅ **Token-based**: All values come from CSS custom properties
- ✅ **Semantic naming**: `--color-primary` not `--color-purple-500`
- ✅ **Light/Dark support**: Automatic theme switching via class toggle
- ✅ **Scalable**: Density modes (compact/standard/comfortable/dense)
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Zero runtime**: Pure CSS, no CSS-in-JS overhead

### Component Categories

The system includes **75+ components** across 16 categories:

1. **Buttons & Actions** - Button, IconButton, FAB, SegmentedButton
2. **Inputs & Forms** - TextField, Select, Checkbox, Radio, Switch, Slider
3. **Navigation** - NavigationRail, NavigationDrawer, TopAppBar, Tabs
4. **Containers** - Card, Dialog, Sheet, Popover
5. **Feedback** - Snackbar, Alert, Progress, Badge, Skeleton
6. **Display** - Typography, List, Chip, Avatar, Divider
7. **Overlays** - Tooltip, Menu, Dropdown, BottomSheet
8. **Data Display** - Table, DataGrid, EmptyState, Stat
9. **Media** - Image, ImageGallery, FileUpload, Carousel
10. **Layout** - Container, Grid, Stack, Spacer
11. **Utilities** - Ripple, StateLayer, FocusRing, Portal
12. **Advanced** - ScrollArea, Accordion, Breadcrumb, Stepper, Timeline
13. **Specialized** - Resizable, ContextMenu, Command, DatePicker, Combobox
14. **Forms Extended** - ToggleGroup, RadioGroup, CheckboxGroup, Form, Label
15. **Pagination & Rating** - Pagination, Rating

---

## Installation & Dependencies

### Step 1: Initialize with CLI

The CLI copies all necessary files directly to your project (shadcn-style):

```bash
npx @unisane/cli init
```

This creates:
- `src/styles/uni-tokens.css` - All design tokens as CSS variables
- `src/styles/uni-theme.css` - Tailwind v4 theme mapping
- `src/styles/uni-base.css` - Animations and base utilities
- `src/lib/utils.ts` - cn(), focusRing, stateLayer helpers
- `src/components/theme-provider.tsx` - Theme management
- Updates `src/app/globals.css` with proper imports

### Step 2: Install Component Dependencies

```bash
pnpm add clsx tailwind-merge class-variance-authority
```

**What these do:**
- **`clsx`** - Conditional className composition
- **`tailwind-merge`** - Intelligent Tailwind class merging (resolves conflicts)
- **`class-variance-authority`** - Type-safe component variant management

### Step 3: Add Components

```bash
npx @unisane/cli add button
npx @unisane/cli add card
npx @unisane/cli add dialog
```

Components are copied to `src/components/ui/` with all dependencies auto-resolved.

### Package Versions

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.0",
    "class-variance-authority": "^0.7.0"
  },
  "devDependencies": {
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Configure Paths (Optional)

Create `unisane.json` in your project root to customize paths:

```json
{
  "aliases": {
    "components": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "srcDir": "src"
}
```

---

## Design Tokens

### Three-Tier Token System

#### 1. Reference Tokens (Raw Palettes)

Tonal color palettes (0-100 scale) from Material Design 3:

```css
:root {
  /* Primary Palette */
  --uni-ref-primary-0: #000000;
  --uni-ref-primary-10: #21005D;
  --uni-ref-primary-40: #6750A4;
  --uni-ref-primary-80: #D0BCFF;
  --uni-ref-primary-100: #FFFFFF;
  /* ... other palettes */
}
```

**Never use these directly in components!**

#### 2. System Tokens (Semantic Roles)

Semantic color roles that reference palettes:

```css
:root {
  /* Light theme */
  --uni-sys-color-primary: var(--uni-ref-primary-40);
  --uni-sys-color-on-primary: var(--uni-ref-primary-100);
  --uni-sys-color-surface: var(--uni-ref-neutral-99);
  --uni-sys-color-on-surface: var(--uni-ref-neutral-10);
}

.dark {
  /* Dark theme - same semantic names, different values */
  --uni-sys-color-primary: var(--uni-ref-primary-80);
  --uni-sys-color-on-primary: var(--uni-ref-primary-20);
  --uni-sys-color-surface: var(--uni-ref-neutral-10);
  --uni-sys-color-on-surface: var(--uni-ref-neutral-90);
}
```

#### 3. Tailwind Theme Mapping

Clean utility classes mapped from system tokens:

```css
@theme {
  --color-primary: var(--uni-sys-color-primary);
  --color-on-primary: var(--uni-sys-color-on-primary);
  --spacing-4u: var(--uni-sys-space-4u);
  --shadow-2: var(--uni-sys-elevation-2);
  /* ... */
}
```

### Token Categories

#### Colors
- **Primary/Secondary/Tertiary** - Brand colors with on-colors
- **Error/Success/Warning/Info** - Semantic feedback colors
- **Surface** - Background surfaces with 5 container levels
- **Outline** - Borders and dividers

#### Spacing (Industrial Unit System)
- **Base unit**: `--uni-sys-u: 4px`
- **Scale**: 1u, 2u, 3u, 4u, 6u, 8u, 10u, 12u, 16u, 20u, 24u
- **Responsive**: Automatically scales on mobile

#### Typography (Material Design 3 Type Scale)
- **Display** - Large, Medium, Small (64px → 40px)
- **Headline** - Large, Medium, Small (36px → 28px)
- **Title** - Large, Medium, Small (22px → 16px)
- **Body** - Large, Medium, Small (18px → 14px)
- **Label** - Large, Medium, Small (16px → 10px)

#### Elevation (Shadows)
- **Levels**: 0 (none) → 5 (maximum depth)
- **Usage**: Cards (1-2), Dialogs (3-4), Drawers (5)

#### Shape (Border Radius)
- **Scale**: xs (4px) → xl (32px) + full (9999px)
- **Responsive**: Scales via `--uni-sys-radius-scale`

#### Motion
- **Durations**: short (100ms) → long (500ms)
- **Easings**: standard, emphasized, smooth
- **M3 Compliant**: Follows Material motion guidelines

---

## Global CSS Setup

After running `npx @unisane/cli init`, your `src/app/globals.css` is automatically configured:

```css
/* Unisane UI - Tailwind v4 with Material 3 Design Tokens */
@import "tailwindcss";
@import "../styles/uni-tokens.css";
@import "../styles/uni-theme.css";
@import "../styles/uni-base.css";

/* Scan your project files for Tailwind classes */
@source "../**/*.{ts,tsx,mdx}";

/* Base document styles */
* {
  box-sizing: border-box;
}

html, body {
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--color-background);
  color: var(--color-on-background);
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
}
```

### Understanding the Style Files

**`src/styles/uni-tokens.css`** - Design tokens as CSS variables:
```css
:root {
  /* Scaling Knobs */
  --uni-sys-space-scale: 1;
  --uni-sys-type-scale: 1;
  --uni-sys-radius-scale: 1;
  --uni-sys-u: calc(4px * var(--uni-sys-space-scale));

  /* Color Tokens */
  --uni-sys-color-primary: var(--uni-ref-primary-40);
  --uni-sys-color-on-primary: var(--uni-ref-primary-100);
  /* ... all other tokens */
}

/* Dark theme overrides */
.dark {
  --uni-sys-color-primary: var(--uni-ref-primary-80);
  --uni-sys-color-on-primary: var(--uni-ref-primary-20);
  /* ... dark theme tokens */
}

/* Density modes */
:root[data-density="compact"] {
  --uni-sys-space-scale: 0.875;
  --uni-sys-type-scale: 0.9;
}
```

**`src/styles/uni-theme.css`** - Tailwind v4 theme mapping:
```css
@theme {
  --color-primary: var(--uni-sys-color-primary);
  --color-on-primary: var(--uni-sys-color-on-primary);
  --spacing-4u: var(--uni-sys-space-4u);
  --shadow-2: var(--uni-sys-elevation-2);
  /* ... complete mapping */
}
```

**`src/styles/uni-base.css`** - Animations and utilities:
```css
@keyframes ripple {
  from { opacity: 0.35; transform: scale(0); }
  to { opacity: 0; transform: scale(2); }
}

@layer utilities {
  .animate-ripple {
    animation: ripple 600ms cubic-bezier(0.4, 0, 0.2, 1);
  }
}
```

---

## Tailwind Integration

The CLI automatically sets up Tailwind v4 integration. The theme mapping in `src/styles/uni-theme.css` includes:

```css
@theme {
  /* Colors */
  --color-primary: var(--uni-sys-color-primary);
  --color-on-primary: var(--uni-sys-color-on-primary);
  --color-secondary: var(--uni-sys-color-secondary);
  --color-on-secondary: var(--uni-sys-color-on-secondary);
  --color-tertiary: var(--uni-sys-color-tertiary);

  --color-error: var(--uni-sys-color-error);
  --color-success: var(--uni-sys-color-success);
  --color-warning: var(--uni-sys-color-warning);
  --color-info: var(--uni-sys-color-info);

  --color-surface: var(--uni-sys-color-surface);
  --color-on-surface: var(--uni-sys-color-on-surface);
  --color-surface-container: var(--uni-sys-color-surface-container);
  --color-surface-container-low: var(--uni-sys-color-surface-container-low);
  --color-surface-container-high: var(--uni-sys-color-surface-container-high);

  --color-outline: var(--uni-sys-color-outline);
  --color-outline-variant: var(--uni-sys-color-outline-variant);

  /* Spacing (Industrial Units) */
  --spacing-0\.5u: var(--uni-sys-space-0_5u);
  --spacing-1u: var(--uni-sys-space-1u);
  --spacing-2u: var(--uni-sys-space-2u);
  --spacing-3u: var(--uni-sys-space-3u);
  --spacing-4u: var(--uni-sys-space-4u);
  --spacing-6u: var(--uni-sys-space-6u);
  --spacing-8u: var(--uni-sys-space-8u);
  --spacing-10u: var(--uni-sys-space-10u);
  --spacing-12u: var(--uni-sys-space-12u);
  --spacing-16u: var(--uni-sys-space-16u);
  --spacing-20u: var(--uni-sys-space-20u);
  --spacing-24u: var(--uni-sys-space-24u);

  /* Typography */
  --font-size-display-large: var(--uni-sys-type-display-large-size);
  --font-size-headline-medium: var(--uni-sys-type-headline-medium-size);
  --font-size-title-large: var(--uni-sys-type-title-large-size);
  --font-size-body-large: var(--uni-sys-type-body-large-size);
  --font-size-body-medium: var(--uni-sys-type-body-medium-size);
  --font-size-label-large: var(--uni-sys-type-label-large-size);
  --font-size-label-medium: var(--uni-sys-type-label-medium-size);

  /* Shadows */
  --shadow-1: var(--uni-sys-elevation-1);
  --shadow-2: var(--uni-sys-elevation-2);
  --shadow-3: var(--uni-sys-elevation-3);
  --shadow-4: var(--uni-sys-elevation-4);
  --shadow-5: var(--uni-sys-elevation-5);

  /* Border Radius */
  --radius-xs: var(--uni-sys-shape-corner-extra-small);
  --radius-sm: var(--uni-sys-shape-corner-small);
  --radius-md: var(--uni-sys-shape-corner-medium);
  --radius-lg: var(--uni-sys-shape-corner-large);
  --radius-xl: var(--uni-sys-shape-corner-extra-large);
  --radius-full: var(--uni-sys-shape-corner-full);

  /* Durations */
  --duration-short: var(--uni-sys-motion-duration-short-2);
  --duration-snappy: var(--uni-sys-motion-duration-snappy);
  --duration-medium: var(--uni-sys-motion-duration-medium-2);
  --duration-emphasized: var(--uni-sys-motion-duration-emphasized);
  --duration-long: var(--uni-sys-motion-duration-long-2);

  /* Easings */
  --ease-standard: var(--uni-sys-motion-ease-standard);
  --ease-emphasized: var(--uni-sys-motion-ease-emphasized);
  --ease-smooth: var(--uni-sys-motion-ease-smooth);
}
```

### Available Utility Classes

Now you can use clean Tailwind classes:

```tsx
// Colors
<div className="bg-primary text-on-primary">Primary</div>
<div className="bg-surface text-on-surface border-outline">Surface</div>

// Spacing
<div className="p-4u m-2u gap-6u">Spaced content</div>

// Typography
<h1 className="text-headline-large">Heading</h1>
<p className="text-body-medium">Body text</p>

// Elevation & Shape
<div className="shadow-2 rounded-md">Card</div>

// Animation
<div className="transition-all duration-short ease-standard">Animated</div>
```

---

## Core Utilities

The CLI copies these essential utilities to your project during init.

#### 1. cn Utility (Class Name Merger)

File: `src/lib/utils.ts` (copied by CLI)

This utility intelligently merges Tailwind classes, resolving conflicts automatically:

```tsx
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Extend tailwind-merge to recognize Material Design 3 custom tokens
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // Material Design 3 Typography Scale
      "font-size": [
        {
          text: [
            "display-large", "display-medium", "display-small",
            "headline-large", "headline-medium", "headline-small",
            "title-large", "title-medium", "title-small",
            "body-large", "body-medium", "body-small",
            "label-large", "label-medium", "label-small",
          ],
        },
      ],
      // Material Design 3 Semantic Colors
      "text-color": [
        {
          text: [
            "primary", "on-primary", "primary-container", "on-primary-container",
            "secondary", "on-secondary", "secondary-container", "on-secondary-container",
            "tertiary", "on-tertiary", "tertiary-container", "on-tertiary-container",
            "surface", "on-surface", "surface-variant", "on-surface-variant",
            "surface-container", "surface-container-high", "surface-container-highest",
            "surface-container-low", "surface-container-lowest",
            "background", "on-background",
            "outline", "outline-variant",
            "error", "on-error", "error-container", "on-error-container",
            "success", "on-success", "success-container", "on-success-container",
            "warning", "on-warning", "warning-container", "on-warning-container",
            "info", "on-info", "info-container", "on-info-container",
            "inverse-surface", "inverse-on-surface", "inverse-primary",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Why this is critical:**
- Resolves conflicting Tailwind classes (e.g., `p-4 p-6` → `p-6`)
- Deduplicates classes (e.g., `bg-primary bg-primary` → `bg-primary`)
- Extended to recognize Material Design 3 custom tokens
- User-provided classes override component defaults

#### 2. CVA (Class Variance Authority)

File: `src/components/ui/button.tsx` (and all other components)

**Why use CVA:**
- Type-safe variant props with TypeScript inference
- Compound variants (e.g., `variant + selected` combinations)
- Default variants
- Clean, maintainable code
- Auto-completion in IDEs

#### 3. Ripple Component

File: `src/components/ui/ripple.tsx` (added via CLI)

Material Design ripple effect with proper cleanup:

```tsx
"use client";

import React, { useState, useLayoutEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface RippleProps {
  color?: string;        // Optional color override, defaults to currentColor
  center?: boolean;      // For icon buttons, ripple starts from center
  disabled?: boolean;
  className?: string;
}

interface RippleEffect {
  x: number;
  y: number;
  size: number;
  id: number;
}

export const Ripple: React.FC<RippleProps> = ({
  color = "currentColor",
  center = false,
  disabled = false,
  className,
}) => {
  const [ripples, setRipples] = useState<RippleEffect[]>([]);

  const addRipple = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;

      const container = e.currentTarget.getBoundingClientRect();
      const size = container.width > container.height ? container.width : container.height;

      // If centered (e.g., icon buttons), ignore click coords
      const x = center ? container.width / 2 : e.clientX - container.left;
      const y = center ? container.height / 2 : e.clientY - container.top;

      const newRipple = { x, y, size, id: Date.now() };
      setRipples((prev) => [...prev, newRipple]);
    },
    [disabled, center]
  );

  // Cleanup to prevent memory leaks
  useLayoutEffect(() => {
    if (ripples.length > 0) {
      const timer = setTimeout(() => {
        setRipples([]);
      }, 600); // Matches CSS animation duration
      return () => clearTimeout(timer);
    }
  }, [ripples]);

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden rounded-[inherit] z-0", className)}
      onMouseDown={addRipple}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-current opacity-[var(--uni-sys-opacity-pressed)] animate-ripple pointer-events-none"
          style={{
            top: ripple.y,
            left: ripple.x,
            width: ripple.size * 2,
            height: ripple.size * 2,
            marginTop: -ripple.size,
            marginLeft: -ripple.size,
          }}
        />
      ))}
    </div>
  );
};
```

The ripple animation is already included in `src/styles/uni-base.css` (copied by CLI).

---

## Component Library

After init, add components using the CLI. Components are copied to `src/components/ui/`.

```bash
npx @unisane/cli add button
npx @unisane/cli add card
npx @unisane/cli add ripple
```

### Component Structure with CVA

All components follow this modern pattern:

```tsx
"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Ripple } from "./ripple";
import { cn } from "@/lib/utils";

// Define variants with CVA
const componentVariants = cva(
  // Base styles (always applied)
  "relative inline-flex items-center justify-center gap-2u rounded-full font-medium transition-all duration-snappy ease-emphasized overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-38 disabled:cursor-not-allowed group",
  {
    variants: {
      variant: {
        filled: "bg-primary text-on-primary",
        tonal: "bg-secondary-container text-on-secondary-container",
        outlined: "border border-outline text-primary",
        text: "text-primary",
      },
      size: {
        sm: "h-8u px-4u text-label-medium",
        md: "h-10u px-6u text-label-large",
        lg: "h-12u px-8u text-label-large",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "md",
    },
  }
);

// Infer props from CVA variants
export interface ComponentProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof componentVariants> {
  disabled?: boolean;
}

export const Component = forwardRef<HTMLElement, ComponentProps>(
  ({ variant, size, disabled = false, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(componentVariants({ variant, size }), className)}
        disabled={disabled}
        {...props}
      >
        {/* State layer for hover/focus/pressed states */}
        <span className="absolute inset-0 pointer-events-none bg-current opacity-0 transition-opacity duration-snappy group-hover:opacity-hover group-focus-visible:opacity-focus group-active:opacity-pressed" />

        {/* Ripple effect */}
        <Ripple disabled={disabled} />

        {/* Content with proper z-index */}
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);

Component.displayName = "Component";
```

### Example: Button Component

File: `src/components/ui/button.tsx` (added via `npx @unisane/cli add button`)

**Complete, production-ready implementation:**

```tsx
"use client";

import { type ReactNode, type ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Ripple } from "./ripple";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2u rounded-full font-medium transition-all duration-snappy ease-emphasized overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-38 disabled:cursor-not-allowed group whitespace-nowrap leading-none select-none",
  {
    variants: {
      variant: {
        filled: "bg-primary text-on-primary",
        tonal: "bg-secondary-container text-on-secondary-container",
        outlined: "border border-outline text-primary",
        text: "text-primary",
        elevated: "bg-surface text-primary shadow-1 hover:shadow-2 border border-outline-variant/10",
      },
      size: {
        sm: "h-8u px-4u text-label-medium",
        md: "h-10u px-6u text-label-large",
        lg: "h-12u px-8u text-label-large",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "filled",
      size = "md",
      disabled = false,
      loading = false,
      icon,
      trailingIcon,
      className,
      type = "button",
      ...props
    },
    ref
  ) => {
    const iconSizeClass = "w-4.5u h-4.5u";

    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {/* State layer - hover/focus/pressed states */}
        <span className="absolute inset-0 pointer-events-none bg-current opacity-0 transition-opacity duration-snappy group-hover:opacity-hover group-focus-visible:opacity-focus group-active:opacity-pressed" />

        {/* Ripple effect */}
        <Ripple disabled={disabled || loading} />

        {/* Loading spinner */}
        {loading && (
          <svg
            className={`animate-spin ${iconSizeClass} relative z-10`}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}

        {/* Leading icon */}
        {!loading && icon && (
          <span className={`${iconSizeClass} flex items-center justify-center flex-shrink-0 relative z-10 pointer-events-none`}>
            {icon}
          </span>
        )}

        {/* Button text */}
        <span className={cn("relative z-10 pointer-events-none", loading ? "opacity-0" : "opacity-100")}>
          {children}
        </span>

        {/* Trailing icon */}
        {!loading && trailingIcon && (
          <span className={`${iconSizeClass} flex items-center justify-center flex-shrink-0 relative z-10 pointer-events-none`}>
            {trailingIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
```

**Usage:**

```tsx
import { Button } from "@/components/ui/button";

// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="outlined" size="lg">Large Outlined</Button>

// With icons
<Button icon={<Icon name="add" />}>Add Item</Button>
<Button trailingIcon={<Icon name="arrow-right" />}>Next</Button>

// Loading state
<Button loading>Processing...</Button>

// Custom classes (merged intelligently)
<Button className="w-full">Full Width</Button>
```

---

## Utilities & Hooks

### Material Design 3 Patterns

#### State Layers

Components use **state layers** for hover/focus/pressed states via CSS classes:

```tsx
// State layer pattern (used in all interactive components)
<span className="absolute inset-0 pointer-events-none bg-current opacity-0 transition-opacity duration-snappy group-hover:opacity-hover group-focus-visible:opacity-focus group-active:opacity-pressed" />
```

**Opacity tokens** (defined in your globals.css):
```css
:root {
  --uni-sys-opacity-hover: 0.08;
  --uni-sys-opacity-focus: 0.12;
  --uni-sys-opacity-pressed: 0.12;
}

@theme {
  --opacity-hover: var(--uni-sys-opacity-hover);
  --opacity-focus: var(--uni-sys-opacity-focus);
  --opacity-pressed: var(--uni-sys-opacity-pressed);
}
```

#### Focus Rings

Use Tailwind's `focus-visible` utilities for keyboard navigation:

```tsx
// Standard focus ring (most components)
className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"

// Compact focus ring (dense UI)
className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-0"

// Inner ring (inputs)
className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
```

#### Animations

Add to your `globals.css` for consistent motion:

```css
/* Material Design 3 animations */
@keyframes ripple {
  from { opacity: 0.35; transform: scale(0); }
  to { opacity: 0; transform: scale(2); }
}

@keyframes stagger-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@layer utilities {
  .animate-ripple {
    animation: ripple 600ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .animate-stagger {
    animation: stagger-in 300ms cubic-bezier(0.4, 0, 0.2, 1);
  }
}
```

### Common Hooks

#### useMediaQuery

File: `hooks/use-media-query.ts`

```tsx
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

// Usage
const isMobile = useMediaQuery("(max-width: 768px)");
```

#### useDebounce

File: `hooks/use-debounce.ts`

```tsx
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
const debouncedSearch = useDebounce(searchTerm, 300);
```

#### useLocalStorage

File: `hooks/use-local-storage.ts`

```tsx
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = (newValue: T) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  };

  return [value, setStoredValue] as const;
}
```

**More hooks**: See [02-utilities.md](./02-utilities.md)

---

## Theme Provider

### Setup

File: `src/components/theme-provider.tsx` (copied by CLI during init)

```tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
type Density = "compact" | "standard" | "comfortable" | "dense";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  density: Density;
  setDensity: (density: Density) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, defaultTheme = "system", defaultDensity = "standard" }) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [density, setDensity] = useState<Density>(defaultDensity);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Hydration fix
  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem("theme") as Theme;
    const storedDensity = localStorage.getItem("density") as Density;
    if (storedTheme) setTheme(storedTheme);
    if (storedDensity) setDensity(storedDensity);
  }, []);

  // Apply theme
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.toggle("dark", systemTheme === "dark");
      setResolvedTheme(systemTheme);
    } else {
      root.classList.toggle("dark", theme === "dark");
      setResolvedTheme(theme);
    }
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  // Apply density
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-density", density);
    localStorage.setItem("density", density);
  }, [density, mounted]);

  if (!mounted) return null; // Prevent hydration mismatch

  return (
    <ThemeContext.Provider value={{ theme, setTheme, density, setDensity, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
```

### Usage in Layout

File: `src/app/layout.tsx`

```tsx
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="system" defaultDensity="standard">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Theme Toggle Component

```tsx
"use client";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <Button
      variant="outlined"
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
    >
      {resolvedTheme === "light" ? "🌙 Dark" : "☀️ Light"}
    </Button>
  );
}
```

---

## Best Practices

### 1. Always Use Tokens via Tailwind

```tsx
// ✅ Good - Clean Tailwind classes
<div className="bg-primary text-on-primary p-4u rounded-sm shadow-2">

// ❌ Bad - Arbitrary values
<div className="bg-[var(--uni-sys-color-primary)] p-[calc(var(--uni-sys-u)*4)]">

// ❌ Worse - Hardcoded values
<div className="bg-[#6750A4] p-[16px]">
```

### 2. Semantic Color Usage

```tsx
// ✅ Good - Semantic pairs
<div className="bg-primary text-on-primary">Primary Button</div>
<div className="bg-surface text-on-surface">Surface Card</div>

// ❌ Bad - Mismatched pairs
<div className="bg-primary text-on-surface">Low contrast!</div>
```

### 3. Component Patterns

```tsx
// ✅ Good - Composable, token-based
export const Card = ({ variant = "elevated", className = "", children }) => {
  const variants = {
    elevated: "bg-surface-container shadow-1",
    filled: "bg-surface-container-high",
    outlined: "bg-surface border border-outline",
  };

  return (
    <div className={`rounded-md ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

// ❌ Bad - Hardcoded, inflexible
export const Card = ({ children }) => (
  <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
    {children}
  </div>
);
```

### 4. Use Utility Helpers

```tsx
// ✅ Good - Use state layer utilities
import { useStateLayer } from "@/utils/state-layers";

const stateLayer = useStateLayer("primary", disabled);
<button className={`... ${stateLayer}`}>Button</button>

// ✅ Good - Use focus ring utilities
import { useFocusRing } from "@/utils/focus-ring";

const focusRing = useFocusRing({ variant: "default" });
<button className={focusRing}>Button</button>
```

### 5. Accessibility

```tsx
// ✅ Good - Focus-visible for keyboard navigation
<button className="focus-visible:outline-2 focus-visible:outline-primary">
  Accessible Button
</button>

// ✅ Good - ARIA labels
<button aria-label="Close dialog">
  <Icon name="close" />
</button>

// ✅ Good - Semantic HTML
<nav aria-label="Main navigation">
  <NavigationRail />
</nav>
```

---

## Quick Reference

### File Structure (After CLI Init)

```
project/
├── src/
│   ├── app/
│   │   ├── globals.css          # Imports tokens and theme
│   │   └── layout.tsx           # Add ThemeProvider here
│   ├── styles/
│   │   ├── uni-tokens.css       # All CSS variables
│   │   ├── uni-theme.css        # Tailwind theme mapping
│   │   └── uni-base.css         # Base styles & animations
│   ├── lib/
│   │   └── utils.ts             # cn, focusRing, stateLayer
│   ├── components/
│   │   ├── theme-provider.tsx   # Theme management
│   │   └── ui/
│   │       ├── button.tsx       # After `add button`
│   │       ├── card.tsx         # After `add card`
│   │       └── ...
│   └── hooks/                   # After adding hooks
│       ├── use-media-query.ts
│       └── use-debounce.ts
└── unisane.json                 # Optional: customize paths
```

### Import Patterns

```tsx
// Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Utilities (from lib/utils.ts)
import { cn, focusRing, stateLayer } from "@/lib/utils";

// Theme
import { useTheme, ThemeProvider } from "@/components/theme-provider";

// Hooks
import { useMediaQuery } from "@/hooks/use-media-query";
```

---

## Next Steps

Follow this sequence to set up your design system:

### 1. Initialize Your Project
```bash
npx @unisane/cli init
```
This copies all tokens, theme, utilities, and ThemeProvider to your project.

### 2. Install Dependencies
```bash
pnpm add clsx tailwind-merge class-variance-authority
```

### 3. Add ThemeProvider to Layout
Update `src/app/layout.tsx` to wrap your app with ThemeProvider.

### 4. Add Components
```bash
npx @unisane/cli add button
npx @unisane/cli add card
npx @unisane/cli add dialog
```

### 5. Customize Tokens (Optional)
Edit `src/styles/uni-tokens.css` to change colors, spacing, or other design tokens.

### 6. Explore More Components
Browse the 16 component categories for complete implementations.

**Component Documentation:**
- [04-buttons-actions.md](./04-buttons-actions.md)
- [05-inputs-forms.md](./05-inputs-forms.md)
- [08-navigation.md](./08-navigation.md)
- [07-containers.md](./07-containers.md)
- ... and 11 more categories!

**Utility Documentation:**
- [02-utilities.md](./02-utilities.md) - Complete utility reference
- [15-forms-extended.md](./15-forms-extended.md) - Advanced forms
- [16-pagination-rating.md](./16-pagination-rating.md) - UI patterns
