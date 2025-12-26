---
title: "Unisane UI — End-to-End Blueprint"
status: "Authoritative (v2)"
lastUpdated: 2025-12-26
---

---

# Unisane UI — End-to-End Blueprint

This document defines how we build **Unisane UI**: a **Material 3 Expressive** design system implemented with **React + Tailwind v4** and **OKLCH token-driven theming**, distributed **shadcn-style** (copy source into consumer apps via a CLI).

**Key promises:**

- Looks and behaves like a modern Google/Material 3 system.
- Works like shadcn: developers own the copied source.
- Tokens are the source of truth. Components never hardcode design values.
- **Single variable theming**: Just set `--hue` to change the entire color scheme.
- **CSS-only dark mode**: No JavaScript required.

---

## 0) Naming & Conventions

### Brand vs prefix

- Brand: **Unisane** (marketing/docs)
- Technical prefix: **`uni`** (packages) or none for tokens

### Packages

- `@unisane/tokens` — CSS design tokens
- `@unisane/ui` — React components
- `@unisane/cli` — CLI tool

### CLI

- Binary: `unisane-ui` or `npx @unisane/cli`
- Commands:
  - `npx @unisane/cli init`
  - `npx @unisane/cli add button dialog`
  - `npx @unisane/cli doctor`

### Token namespaces (simplified)

- Reference: `--ref-*` (tonal palettes)
- Semantic: `--color-*`, `--radius-*`, `--shadow-*`, etc.
- Config: `--hue`, `--chroma`, `--scale-*`

### Tailwind utility naming

Clean and generic for DX:

- `bg-primary`, `text-on-primary`, `bg-surface`, `border-outline`, `shadow-2`, `rounded-md`

---

## 1) Goals & Non-Negotiables

### Goals

1. **Material 3–style visual language**: color roles, typography roles, shapes, elevations, state layers, motion.
2. **Adaptive layouts**: mobile → tablet → desktop using window size classes and pane-based layouts.
3. **Shadcn workflow**: source copied into app, easy local edits, no package lock-in.
4. **Token purity**: all styling derives from tokens and utilities (no raw values).
5. **Simplest possible theming**: Change ONE variable (`--hue`) to theme the entire app.

### Non-negotiable rules

- No raw `#hex` colors in components.
- No ad-hoc `px` spacing/size in components.
- Every interactive component must implement consistent states: hover, pressed, focus-visible, disabled.
- CSS-only dark mode support (no JS required for basic theming).

---

## 2) Monorepo Architecture

### Repo name

- `unisane-ui`

### Monorepo toolchain

- pnpm workspaces
- Turborepo
- TypeScript (strict)

### Full project tree

```txt
unisane-ui/
├─ apps/
│  └─ web/                           # Next.js docs site
├─ packages/
│  ├─ tokens/                        # OKLCH tokens → emits CSS
│  │  ├─ src/
│  │  │  ├─ theme-config.json        # Theme configuration
│  │  │  └─ ref.json                 # Generated reference palettes
│  │  ├─ scripts/
│  │  │  └─ build.mjs                # Token generator
│  │  └─ dist/
│  │     └─ unisane.css              # Single merged output
│  ├─ ui/                            # React components
│  └─ cli/                           # CLI tool
├─ registry/                         # shadcn-style registry
│  ├─ styles/
│  │  └─ unisane.css                 # Copied tokens
│  ├─ primitives/
│  ├─ layout/
│  └─ components/
└─ handbook/                         # Documentation
```

---

## 3) Tailwind v4 Integration Strategy

### Principle

Tailwind v4 is **CSS-first**. We drive Tailwind utilities using `@theme` variables that point to our tokens.

### Single file import

Consumer apps import ONE file:

```css
/* app/globals.css */
@import "tailwindcss";
@import "@unisane/tokens/unisane.css";

/* Or after CLI init: */
@import "../styles/unisane.css";
```

### What unisane.css contains

The merged file includes:
1. **Design tokens** — All CSS variables (`:root`, `.dark`, density/radius variants)
2. **Tailwind theme mapping** — `@theme { }` block
3. **Base styles** — Focus rings, animations, utilities

### Runtime theming

```css
/* Just change ONE variable to theme your app */
:root {
  --hue: 145;  /* Green theme */
}

/* Available hues:
   Blue: 240 (default)  Green: 145   Teal: 180
   Purple: 285          Orange: 70   Red: 25
*/
```

---

## 4) Token System (OKLCH-based)

### 4.1 Token layers

1. **Config tokens** (`--hue`, `--chroma`, `--scale-*`) — User-adjustable
2. **Reference tokens** (`--ref-*`) — Tonal palettes derived from hue
3. **Semantic tokens** (`--color-*`, `--radius-*`, etc.) — What components use

### 4.2 Color tokens

#### Config (user-adjustable)

```css
:root {
  --hue: 240;           /* Primary hue (0-360) */
  --chroma: 0.15;       /* Color intensity */

  /* Auto-derived: */
  --hue-secondary: var(--hue);
  --hue-tertiary: calc(var(--hue) + 60);
  --hue-neutral: var(--hue);
  --hue-error: 25;
}
```

#### Reference tokens (auto-generated from hue)

```css
/* Primary palette */
--ref-primary-10: oklch(0.22 0.105 var(--hue));
--ref-primary-40: oklch(0.55 0.150 var(--hue));
--ref-primary-80: oklch(0.88 0.105 var(--hue));
--ref-primary-90: oklch(0.94 0.075 var(--hue));

/* Secondary, tertiary, neutral, error follow same pattern */
```

#### Semantic color roles

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

### 4.3 Dark mode (CSS-only)

Dark mode works automatically via `prefers-color-scheme` OR `.dark` class:

```css
/* Automatic system preference */
@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    --color-primary: var(--ref-primary-80);
    --color-surface: var(--ref-neutral-10);
    /* ... */
  }
}

/* Manual override */
.dark {
  --color-primary: var(--ref-primary-80);
  --color-surface: var(--ref-neutral-10);
  /* ... */
}
```

### 4.4 Density & Radius (CSS-only)

```html
<!-- Usage -->
<html data-density="compact">
<html data-radius="soft">
```

```css
[data-density="compact"] {
  --scale-space: 0.875;
  --scale-type: 0.9;
  --scale-radius: 0.8;
}

[data-density="dense"] {
  --scale-space: 0.75;
  --scale-type: 0.85;
}

[data-radius="sharp"] {
  --scale-radius: 0.75;
}

[data-radius="soft"] {
  --scale-radius: 1.15;
}
```

### 4.5 Typography tokens

```css
--type-display-large-size: calc(57px * var(--scale-type));
--type-display-large-line: calc(64px * var(--scale-type));
--type-headline-large-size: calc(32px * var(--scale-type));
--type-body-medium-size: calc(14px * var(--scale-type));
--type-label-large-size: calc(14px * var(--scale-type));
```

### 4.6 Shape tokens

```css
--radius-none: 0px;
--radius-xs: calc(4px * var(--scale-radius));
--radius-sm: calc(8px * var(--scale-radius));
--radius-md: calc(12px * var(--scale-radius));
--radius-lg: calc(20px * var(--scale-radius));
--radius-xl: calc(32px * var(--scale-radius));
--radius-full: 9999px;
```

### 4.7 Elevation tokens

```css
--shadow-0: none;
--shadow-1: 0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30);
--shadow-2: 0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30);
--shadow-3: 0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.30);
```

### 4.8 Spacing tokens (unit-based)

```css
--unit: calc(4px * var(--scale-space));
--space-1u: calc(var(--unit) * 1);    /* 4px */
--space-2u: calc(var(--unit) * 2);    /* 8px */
--space-3u: calc(var(--unit) * 3);    /* 12px */
--space-4u: calc(var(--unit) * 4);    /* 16px */
/* ... up to 16u, plus 20u, 24u, 28u, 38u */
```

---

## 5) Component System Architecture

### 5.1 Two categories

#### 1) Pure (native) components

Built with native elements, styled by tokens:

- Button, IconButton, FAB
- TextField
- Checkbox/Radio/Switch
- Card/Surface
- Chip, Badge
- Progress, Skeleton
- List, Table

#### 2) Behavior-heavy components (Radix-backed)

Radix provides accessibility + keyboard + portal behavior:

- Dialog / AlertDialog
- Popover
- Tooltip
- DropdownMenu
- Tabs
- Select

### 5.2 Shared primitives

- `Text` — typography variants
- `Surface` — background tone + elevation
- `StateLayer` — hover/pressed overlays
- `FocusRing` — focus-visible styling
- `Icon` — Material Symbols integration
- `Ripple` — touch feedback

### 5.3 State layer pattern

All interactive components use state layers:

```tsx
<button className="relative overflow-hidden bg-primary">
  <StateLayer />
  <Ripple />
  <span className="relative z-10">{children}</span>
</button>
```

---

## 6) Registry + CLI

### 6.1 Registry layout

```txt
registry/
├─ styles/
│  └─ unisane.css           # All tokens + theme + base
├─ lib/
│  └─ utils.ts              # cn(), stateLayer helpers
├─ primitives/
│  ├─ text.tsx
│  ├─ surface.tsx
│  ├─ state-layer.tsx
│  ├─ focus-ring.tsx
│  └─ icon.tsx
├─ layout/
│  ├─ theme-provider.tsx    # Optional runtime theming
│  ├─ app-layout.tsx
│  └─ container.tsx
└─ components/
   ├─ button.tsx
   ├─ text-field.tsx
   ├─ dialog.tsx
   └─ ...
```

### 6.2 CLI commands

#### `npx @unisane/cli init`

Creates:
- `src/styles/unisane.css` — All tokens
- `src/lib/utils.ts` — Utilities
- `src/components/theme-provider.tsx` — Optional
- Updates `app/globals.css`

#### `npx @unisane/cli add <component>`

- Copies component into `src/components/ui/`
- Copies dependencies (primitives) if missing
- Installs Radix dependencies when needed

#### `npx @unisane/cli doctor`

- Verifies Tailwind v4 setup
- Checks CSS imports
- Validates required files

---

## 7) Consumer App Outcome

After:

```bash
npx @unisane/cli init
npx @unisane/cli add button text-field dialog
```

Consumer app structure:

```txt
src/
├─ styles/
│  └─ unisane.css
├─ lib/
│  └─ utils.ts
├─ components/
│  ├─ theme-provider.tsx    # Optional
│  └─ ui/
│     ├─ button.tsx
│     ├─ text-field.tsx
│     └─ dialog.tsx
└─ app/
   └─ globals.css
```

globals.css:

```css
@import "tailwindcss";
@import "../styles/unisane.css";

/* Theming - just ONE variable! */
:root {
  --hue: 145;  /* Green theme */
}
```

Usage:

```tsx
import { Button } from "@/components/ui/button";

<Button variant="filled">Continue</Button>
<Button variant="outlined">Cancel</Button>
```

---

## 8) ThemeProvider (Optional)

ThemeProvider is **optional** — CSS handles everything by default.

Use it only when you need:
- Runtime light/dark toggle UI
- Runtime density switching
- LocalStorage persistence

```tsx
// layout.tsx - WITHOUT ThemeProvider (recommended)
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

// layout.tsx - WITH ThemeProvider (for runtime controls)
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

---

## 9) Definition of Done for v1

- ✅ OKLCH token system with single `--hue` variable theming
- ✅ CSS-only dark mode (prefers-color-scheme + .dark class)
- ✅ CSS-only density and radius variants
- ✅ Tailwind v4 mapping provides clean utilities
- ✅ Core primitives implemented
- ✅ Phase 1 components with consistent states
- ✅ CLI init/add/doctor works on fresh Next.js app
- ✅ Single CSS file import (`unisane.css`)
