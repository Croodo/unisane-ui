# Getting Started - Design System Overview

A comprehensive guide to understanding and using this Material Design 3 token-based design system in Next.js.

## Quick Start (5-Minute Setup)

```bash
# 1. Initialize your project (copies all files locally)
npx unisane ui init

# 2. Install dependencies
pnpm add clsx tailwind-merge class-variance-authority

# 3. Add components as needed
npx unisane ui add button
npx unisane ui add card
```

**Setup Flow:**
```
CLI Init → Files Copied to Project → Install Dependencies → Add Components
```

**What gets copied to your project:**
```
src/
├── styles/
│   └── unisane.css           # All tokens, theme, and base styles (single file!)
├── lib/
│   └── utils.ts              # cn(), stateLayer helpers
├── components/
│   ├── theme-provider.tsx    # Optional - only for runtime controls
│   └── ui/                   # Components added here
└── app/
    └── globals.css           # Updated with imports
```

---

## Table of Contents

1. [System Architecture](#system-architecture) - Understand the philosophy
2. [Installation & Dependencies](#installation--dependencies) - Install required packages
3. [Design Tokens](#design-tokens) - OKLCH token system
4. [Global CSS Setup](#global-css-setup) - Single file import
5. [Theming](#theming) - ONE variable theming
6. [Tailwind Integration](#tailwind-integration) - Map tokens to Tailwind
7. [Core Utilities](#core-utilities) - Set up cn, CVA, and Ripple
8. [Component Library](#component-library) - Build your first component
9. [ThemeProvider (Optional)](#theme-provider-optional) - Runtime theme controls
10. [Best Practices](#best-practices) - Guidelines and tips

---

## System Architecture

### Philosophy

This design system is built on **OKLCH-based design tokens** with single-variable theming:

```
Config Tokens (--hue, --chroma)
    ↓
Reference Tokens (Tonal Palettes)
    ↓
Semantic Tokens (Color Roles)
    ↓
Tailwind Theme Mapping
    ↓
Components (Consumption Only)
```

**Key Principles:**
- ✅ **Token-based**: All values come from CSS custom properties
- ✅ **Single variable theming**: Just set `--hue` to change the entire color scheme
- ✅ **CSS-only dark mode**: Automatic via `prefers-color-scheme` or `.dark` class
- ✅ **CSS-only density/radius**: Via data attributes
- ✅ **OKLCH colors**: Perceptually uniform, vibrant colors
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
npx unisane ui init
```

This creates:
- `src/styles/unisane.css` - All tokens, theme mapping, and base utilities (single file!)
- `src/lib/utils.ts` - cn(), stateLayer helpers
- `src/components/theme-provider.tsx` - Optional runtime theming
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
npx unisane ui add button
npx unisane ui add card
npx unisane ui add dialog
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

### Three-Tier Token System (OKLCH-based)

#### 1. Config Tokens (User-adjustable)

```css
:root {
  --hue: 240;           /* Primary hue (0-360) - CHANGE THIS! */
  --chroma: 0.13;       /* Color intensity (0-0.2) */
}
```

**Quick reference:**

| Color  | Hue  | Recommended Chroma |
|--------|------|-------------------|
| Blue   | 240  | 0.13 (default)    |
| Green  | 145  | 0.14              |
| Teal   | 180  | 0.12              |
| Purple | 285  | 0.15              |
| Orange | 70   | 0.16              |
| Red    | 25   | 0.16              |

Or use any hue from 0-360 for custom colors.

**Monochrome / Black Theme:**

```css
:root {
  --hue: 0;
  --chroma: 0;
  --chroma-neutral: 0;  /* Important: removes tint from surfaces */
}
```

#### 2. Reference Tokens (Auto-generated from hue)

Tonal palettes generated using OKLCH:

```css
/* Primary palette (auto-generated) */
--ref-primary-10: oklch(0.22 0.105 var(--hue));
--ref-primary-40: oklch(0.55 0.150 var(--hue));
--ref-primary-80: oklch(0.88 0.105 var(--hue));
--ref-primary-90: oklch(0.94 0.075 var(--hue));

/* Secondary, tertiary, neutral, error follow same pattern */
```

**Never use these directly in components!**

#### 3. Semantic Tokens (What components use)

```css
/* Light mode */
--color-primary: var(--ref-primary-40);
--color-on-primary: var(--ref-primary-100);
--color-primary-container: var(--ref-primary-90);
--color-on-primary-container: var(--ref-primary-10);

--color-surface: var(--ref-neutral-99);
--color-on-surface: var(--ref-neutral-10);
--color-surface-container: var(--ref-neutral-90);
```

### Token Categories

#### Colors
- **Primary/Secondary/Tertiary** - Brand colors with on-colors
- **Error/Success/Warning/Info** - Semantic feedback colors
- **Surface** - Background surfaces with 5 container levels
- **Outline** - Borders and dividers

#### Spacing (Industrial Unit System)
- **Base unit**: `--unit: 4px * scale`
- **Scale**: 1u, 2u, 3u, 4u, 6u, 8u, 10u, 12u, 16u, 20u, 24u
- **Responsive**: Automatically scales with density

#### Typography (Material Design 3 Type Scale)
- **Display** - Large, Medium, Small
- **Headline** - Large, Medium, Small
- **Title** - Large, Medium, Small
- **Body** - Large, Medium, Small
- **Label** - Large, Medium, Small

#### Elevation (Shadows)
- **Levels**: 0 (none) → 5 (maximum depth)
- **Usage**: Cards (1-2), Dialogs (3-4), Drawers (5)

#### Shape (Border Radius)
- **Scale**: xs (4px) → xl (32px) + full (9999px)
- **Responsive**: Scales via `--scale-radius`

#### Motion
- **Durations**: short (100ms) → long (500ms)
- **Easings**: standard, emphasized, smooth

---

## Global CSS Setup

After running `npx unisane ui init`, your `src/app/globals.css` looks like:

```css
/* Unisane UI - Tailwind v4 with Material 3 Design Tokens */
@import "tailwindcss";
@import "../styles/unisane.css";

/* Scan your project files for Tailwind classes */
@source "../**/*.{ts,tsx,mdx}";

/* ============================================================
   THEMING - Just change ONE variable!
   ============================================================

   :root { --hue: 145; }  // Green theme
   :root { --hue: 285; }  // Purple theme
   :root { --hue: 70; }   // Orange theme

   Available hues:
   Blue: 240 (default)  Green: 145   Teal: 180
   Purple: 285          Orange: 70   Red: 25

   DARK MODE: Automatic via prefers-color-scheme
              Or add class="dark" to <html>

   DENSITY: Add data-density="compact|dense|comfortable" to <html>

   RADIUS: Add data-radius="sharp|soft" to <html>
   ============================================================ */
```

### Single File Import

The `unisane.css` file contains everything:
1. **Design tokens** - All CSS variables (`:root`, `.dark`, density/radius variants)
2. **Tailwind theme mapping** - `@theme { }` block
3. **Base styles** - Focus rings, animations, utilities

---

## Theming

### Theme Architecture

The theming system uses OKLCH color science with a simple 2-variable approach:

```
--hue (0-360)     →  Primary color on the color wheel
--chroma (0-0.2)  →  Color intensity (0 = gray, 0.2 = vibrant)
        ↓
All palettes auto-generated:
  - Primary, Secondary, Tertiary
  - Neutral surfaces
  - Error, Success, Warning, Info
```

### Change Theme Color

Add to your `globals.css` (after the imports):

```css
:root {
  --hue: 145;     /* Green theme */
  --chroma: 0.14; /* Standard intensity */
}
```

That's it! The entire color scheme updates automatically.

### Dark Mode (CSS-only)

Dark mode works automatically via `prefers-color-scheme`.

To force a specific mode:
```html
<html class="dark">  <!-- Force dark -->
<html class="light"> <!-- Force light -->
```

### Theme Modifiers (HTML Attributes)

Add these to your `<html>` element:

**Scheme** (color strategy):
```html
<html data-scheme="tonal">        <!-- Full color (default) -->
<html data-scheme="monochrome">   <!-- Pure grayscale -->
<html data-scheme="neutral">      <!-- Low saturation, professional -->
```

**Contrast** (accessibility):
```html
<html data-contrast="standard">   <!-- Default -->
<html data-contrast="medium">     <!-- Boosted readability -->
<html data-contrast="high">       <!-- WCAG AAA compliant -->
```

**Density**:
```html
<html data-density="compact">     <!-- Tighter spacing (87.5%) -->
<html data-density="dense">       <!-- Even tighter (75%) -->
<html data-density="comfortable"> <!-- More spacious (110%) -->
```

**Radius**:
```html
<html data-radius="sharp">  <!-- Sharper corners (75%) -->
<html data-radius="soft">   <!-- Rounder corners (115%) -->
```

**Combining modifiers:**
```html
<html class="dark" data-scheme="neutral" data-contrast="high">
```

---

## Tailwind Integration

The theme mapping in `unisane.css` provides clean utility classes:

```css
@theme {
  /* Colors */
  --color-primary: var(--color-primary);
  --color-on-primary: var(--color-on-primary);
  --color-secondary: var(--color-secondary);
  --color-surface: var(--color-surface);
  --color-surface-container: var(--color-surface-container);
  --color-outline: var(--color-outline);

  /* Spacing (Industrial Units) */
  --spacing-1u: var(--space-1u);
  --spacing-2u: var(--space-2u);
  --spacing-4u: var(--space-4u);
  --spacing-6u: var(--space-6u);
  --spacing-8u: var(--space-8u);

  /* Typography */
  --font-size-display-large: var(--type-display-large-size);
  --font-size-headline-medium: var(--type-headline-medium-size);
  --font-size-body-medium: var(--type-body-medium-size);

  /* Shadows */
  --shadow-1: var(--shadow-1);
  --shadow-2: var(--shadow-2);
  --shadow-3: var(--shadow-3);

  /* Border Radius */
  --radius-xs: var(--radius-xs);
  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);

  /* Durations */
  --duration-short: var(--duration-short);
  --duration-medium: var(--duration-medium);

  /* Easings */
  --ease-standard: var(--ease-standard);
  --ease-emphasized: var(--ease-emphasized);
}
```

### Available Utility Classes

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

### 1. cn Utility (Class Name Merger)

File: `src/lib/utils.ts` (copied by CLI)

```tsx
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
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
      "text-color": [
        {
          text: [
            "primary", "on-primary", "primary-container", "on-primary-container",
            "secondary", "on-secondary", "secondary-container", "on-secondary-container",
            "surface", "on-surface", "surface-variant", "on-surface-variant",
            "error", "on-error", "success", "on-success",
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

### 2. CVA (Class Variance Authority)

Used in all components for type-safe variants:

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        filled: "bg-primary text-on-primary",
        tonal: "bg-secondary-container text-on-secondary-container",
      },
      size: {
        sm: "h-8u px-4u",
        md: "h-10u px-6u",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "md",
    },
  }
);
```

### 3. Ripple Component

File: `src/components/ui/ripple.tsx` (added via CLI)

Material Design ripple effect for touch feedback.

---

## Component Library

After init, add components using the CLI:

```bash
npx unisane ui add button
npx unisane ui add card
npx unisane ui add ripple
```

### Component Structure with CVA

All components follow this pattern:

```tsx
"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Ripple } from "./ripple";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2u rounded-full font-medium transition-all duration-snappy overflow-hidden focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-38 group",
  {
    variants: {
      variant: {
        filled: "bg-primary text-on-primary",
        tonal: "bg-secondary-container text-on-secondary-container",
        outlined: "border border-outline text-primary",
        text: "text-primary",
        elevated: "bg-surface text-primary shadow-1 hover:shadow-2",
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
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled}
        {...props}
      >
        {/* State layer */}
        <span className="absolute inset-0 bg-current opacity-0 group-hover:opacity-8 group-active:opacity-12" />

        {/* Ripple */}
        <Ripple disabled={disabled} />

        {/* Content */}
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";
```

**Usage:**

```tsx
import { Button } from "@/components/ui/button";

<Button>Click me</Button>
<Button variant="outlined" size="lg">Large Outlined</Button>
<Button variant="tonal">Secondary Action</Button>
```

---

## ThemeProvider (Optional)

ThemeProvider is **only needed** if you want runtime theme switching UI (like a dark mode toggle button).

CSS handles everything by default:
- Dark mode via `prefers-color-scheme`
- Density via `data-density` attribute
- Radius via `data-radius` attribute

### When to Use ThemeProvider

Use it when you need:
- Runtime light/dark toggle UI
- Runtime density switching
- LocalStorage persistence

### Setup

File: `src/components/theme-provider.tsx` (copied by CLI)

```tsx
// app/layout.tsx - WITHOUT ThemeProvider (recommended for most apps)
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

// app/layout.tsx - WITH ThemeProvider (for runtime controls)
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          config={{
            density: "standard",
            theme: "system",
            radius: "standard",
          }}
        >
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
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outlined"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      Toggle Theme
    </Button>
  );
}
```

---

## Best Practices

### 1. Always Use Tokens via Tailwind

```tsx
// Good - Clean Tailwind classes
<div className="bg-primary text-on-primary p-4u rounded-sm shadow-2">

// Bad - Arbitrary values
<div className="bg-[var(--color-primary)] p-[16px]">

// Worse - Hardcoded values
<div className="bg-[#6750A4] p-[16px]">
```

### 2. Semantic Color Usage

```tsx
// Good - Semantic pairs
<div className="bg-primary text-on-primary">Primary Button</div>
<div className="bg-surface text-on-surface">Surface Card</div>

// Bad - Mismatched pairs
<div className="bg-primary text-on-surface">Low contrast!</div>
```

### 3. Industrial Units for Spacing

```tsx
// Good - Scales with density
<div className="p-4u gap-2u">Content</div>

// Standard: 16px padding, 8px gap
// Compact: ~14px padding, ~7px gap
// Dense: ~12px padding, ~6px gap
```

### 4. Accessibility

```tsx
// Good - Focus-visible for keyboard navigation
<button className="focus-visible:outline-2 focus-visible:outline-primary">
  Accessible Button
</button>

// Good - ARIA labels
<button aria-label="Close dialog">
  <Icon name="close" />
</button>
```

---

## Quick Reference

### File Structure (After CLI Init)

```
project/
├── src/
│   ├── app/
│   │   ├── globals.css          # Imports unisane.css
│   │   └── layout.tsx           # Optional ThemeProvider
│   ├── styles/
│   │   └── unisane.css          # All tokens + theme + base
│   ├── lib/
│   │   └── utils.ts             # cn() helper
│   ├── components/
│   │   ├── theme-provider.tsx   # Optional
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       └── ...
└── unisane.json                 # Optional: customize paths
```

### Theming Summary

| Feature | How it works |
|---------|--------------|
| **Theme color** | Set `--hue` and `--chroma` in CSS |
| **Dark mode** | Automatic, or add `.dark` class |
| **Scheme** | Add `data-scheme="monochrome"` attribute |
| **Contrast** | Add `data-contrast="high"` attribute |
| **Density** | Add `data-density="compact"` attribute |
| **Radius** | Add `data-radius="soft"` attribute |
| **Runtime controls** | Optional ThemeProvider |

**Key insight**: CSS handles everything by default. ThemeProvider is only for runtime UI controls.

### Import Patterns

```tsx
// Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Utilities
import { cn } from "@/lib/utils";

// Theme (optional)
import { useTheme, ThemeProvider } from "@/components/theme-provider";
```

---

## Next Steps

1. **Initialize**: `npx unisane ui init`
2. **Install**: `pnpm add clsx tailwind-merge class-variance-authority`
3. **Theme**: Set `--hue` in globals.css for your brand color
4. **Add Components**: `npx unisane ui add button card dialog`
5. **Build**: Start using components!

**Component Documentation:**
- [04-buttons-actions.md](./04-buttons-actions.md)
- [05-inputs-forms.md](./05-inputs-forms.md)
- [08-navigation.md](./08-navigation.md)
- [07-containers.md](./07-containers.md)

---

**Last Updated**: 2025-12-27
**Version**: 0.4.0
