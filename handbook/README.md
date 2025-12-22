---
title: "Unisane UI — End-to-End Blueprint"
status: "Authoritative (v1)"
lastUpdated: 2025-12-17
---

---

# Unisane UI — End-to-End Blueprint

This document defines how we build **Unisane UI**: a **Material 3 Expressive** design system (not MUI) implemented with **React + Tailwind v4** and **token-driven theming** (hex or OKLCH), distributed **shadcn-style** (copy source into consumer apps via a CLI).

**Key promise:**

- Looks and behaves like a modern Google/Material 3 system.
- Works like shadcn: developers own the copied source.
- Tokens are the source of truth. Components never hardcode design values.

---

## 0) Naming & Conventions

### Brand vs prefix

- Brand: **Unisane** (marketing/docs)
- Technical prefix: **`uni`** (packages/CLI/config/tokens)

### Packages (preferred)

- `@unisane/tokens`
- `@unisane/ui`
- `@unisane/cli`

### CLI

- Binary: `unisane-ui`
- Commands:
  - `npx unisane-ui init`
  - `npx unisane-ui add button dialog scaffold`
  - `npx unisane-ui doctor`

### Token namespaces

- Reference: `--uni-ref-*`
- System: `--uni-sys-*`
- Component: `--uni-comp-*`

### Tailwind utility naming

We keep utility naming **clean and generic** for DX:

- `bg-primary`, `text-on-primary`, `bg-surface`, `border-outline`, `shadow-2`, `rounded-md`

We achieve this by mapping Tailwind theme variables to our token variables in `uni-theme.css`.

---

## 1) Goals & Non-Negotiables

### Goals

1. **Material 3–style visual language**: color roles, typography roles, shapes, elevations, state layers, motion.
2. **Adaptive layouts**: mobile → tablet → desktop using window size classes and pane-based layouts.
3. **Shadcn workflow**: source copied into app, easy local edits, no package lock-in.
4. **Token purity**: all styling derives from tokens and utilities (no raw values).

### Non-negotiable rules

- No raw `#hex` colors in components.
- No ad-hoc `px` spacing/size in components (except in a tiny handful of “mechanical” cases like hairline borders if unavoidable; prefer tokens).
- No component-specific custom themes unless expressed as component tokens.
- Every interactive component must implement consistent states: hover, pressed, focus-visible, disabled.

---

## 2) Monorepo Architecture

### Repo name

- `unisane-ui`

### Monorepo toolchain

- pnpm workspaces
- Turborepo
- TypeScript (strict)
- Changesets (versioning + releases)

### Full project tree

```txt
unisane-ui/
├─ apps/
│  ├─ docs/                         # Next.js docs site (MDX + live previews)
│  └─ playground/                   # quick sandbox
├─ packages/
│  ├─ tokens/                       # OKLCH tokens SSOT → emits CSS
│  ├─ ui/                           # primitives + components (token-driven)
│  └─ shared/                       # optional shared tooling helpers
├─ registry/                        # shadcn-style registry (what CLI copies)
│  ├─ styles/
│  ├─ primitives/
│  ├─ layout/
│  └─ components/
├─ cli/                             # unisane-ui CLI (init/add/doctor)
├─ scripts/
│  ├─ sync-registry.mjs             # packages/ui → registry/
│  ├─ lint-tokens.mjs               # fail if raw values found
│  └─ release.mjs
├─ .github/workflows/
│  ├─ ci.yml
│  ├─ release.yml
│  └─ docs.yml
├─ pnpm-workspace.yaml
├─ turbo.json
├─ tsconfig.base.json
├─ eslint.config.js
└─ package.json
```

---

## 3) Tailwind v4 Integration Strategy

### Principle

Tailwind v4 is **CSS-first**. We drive Tailwind utilities using `@theme` variables that point to our tokens.

### What gets copied into consumer apps

- `src/styles/uni-tokens.css` (defines `--uni-*` values)
- `src/styles/uni-theme.css` (Tailwind `@theme inline` mapping)

### Consumer app globals

```css
/* app/globals.css */
@import "../styles/uni-tokens.css";
@import "../styles/uni-theme.css";
```

### uni-theme.css (shape)

```css
@import "tailwindcss";

@theme inline {
  /* Colors */
  --color-primary: var(--uni-sys-color-primary);
  --color-on-primary: var(--uni-sys-color-on-primary);
  --color-surface: var(--uni-sys-color-surface);
  --color-on-surface: var(--uni-sys-color-on-surface);
  --color-outline: var(--uni-sys-color-outline);

  /* Radii */
  --radius-sm: var(--uni-sys-shape-corner-sm);
  --radius-md: var(--uni-sys-shape-corner-md);
  --radius-lg: var(--uni-sys-shape-corner-lg);

  /* Shadows */
  --shadow-0: var(--uni-sys-elevation-0);
  --shadow-1: var(--uni-sys-elevation-1);
  --shadow-2: var(--uni-sys-elevation-2);
}
```

Resulting usage:

- `className="bg-primary text-on-primary"`
- `className="bg-surface text-on-surface border border-outline"`

---

## 4) Token System (Token-first, flexible color spaces)

### 4.1 Token layers

1. **Reference tokens** (`--uni-ref-*`) — tonal palettes and scales
2. **System tokens** (`--uni-sys-*`) — semantic roles
3. **Component tokens** (`--uni-comp-*`) — overrides per component

### 4.2 Color tokens

#### Reference tokens (example)

- `--uni-ref-primary-0..100`
- `--uni-ref-neutral-0..100`
- `--uni-ref-neutral-variant-0..100`

Reference values can be hex or OKLCH; roles remain stable:

```css
--uni-ref-primary-40: #4f5bd5;
```

#### System color roles (example subset)

```css
--uni-sys-color-primary: var(--uni-ref-primary-40);
--uni-sys-color-on-primary: oklch(0.98 0 0);
--uni-sys-color-primary-container: var(--uni-ref-primary-90);
--uni-sys-color-on-primary-container: var(--uni-ref-primary-10);

--uni-sys-color-surface: var(--uni-ref-neutral-98);
--uni-sys-color-on-surface: var(--uni-ref-neutral-10);

--uni-sys-color-outline: var(--uni-ref-neutral-50);
--uni-sys-color-outline-variant: var(--uni-ref-neutral-80);
```

#### Dark mode

We switch by `.dark`:

```css
.dark {
  --uni-sys-color-primary: var(--uni-ref-primary-80);
  --uni-sys-color-on-primary: var(--uni-ref-primary-20);
  --uni-sys-color-surface: var(--uni-ref-neutral-10);
  --uni-sys-color-on-surface: var(--uni-ref-neutral-90);
}
```

### 4.3 Typography tokens

Define role-based variants:

- `displayLarge/Medium/Small`
- `headlineLarge/Medium/Small`
- `titleLarge/Medium/Small`
- `bodyLarge/Medium/Small`
- `labelLarge/Medium/Small`

Token structure per variant:

```css
--uni-sys-type-title-medium-font: var(--uni-ref-font-sans);
--uni-sys-type-title-medium-weight: 600;
--uni-sys-type-title-medium-size: 1rem;
--uni-sys-type-title-medium-line: 1.5rem;
--uni-sys-type-title-medium-tracking: 0.01em;
```

### 4.4 Shape tokens

```css
--uni-sys-shape-corner-extra-small: 4px;
--uni-sys-shape-corner-small: 8px;
--uni-sys-shape-corner-medium: 12px;
--uni-sys-shape-corner-large: 16px;
--uni-sys-shape-corner-extra-large: 28px;
```

### 4.5 Elevation tokens

```css
--uni-sys-elevation-0: none;
--uni-sys-elevation-1: 0 1px 2px oklch(0 0 0 / 0.12);
--uni-sys-elevation-2: 0 2px 8px oklch(0 0 0 / 0.14);
```

### 4.6 Motion tokens

- durations: `--uni-sys-motion-duration-short/medium/long`
- easings: `--uni-sys-motion-ease-standard`, etc.

### 4.7 State layer tokens

- `--uni-sys-state-hover-opacity`
- `--uni-sys-state-pressed-opacity`
- `--uni-sys-state-focus-opacity`

### 4.8 Spacing tokens

Define a scale:

- `--uni-sys-space-1..12`
- plus layout spacing tokens:
  - `--uni-sys-layout-margin`
  - `--uni-sys-layout-gutter`
  - `--uni-sys-layout-pane-gap`

---

## 5) Adaptive Layout System

### 5.1 Window Size Classes (WSC)

We classify viewport into:

- compact
- medium
- expanded
- large
- xlarge

We set it on DOM:

```html
<html data-wsc="expanded"></html>
```

### 5.2 Layout tokens adapt by WSC

Example (conceptual):

```css
:root {
  --uni-sys-layout-margin: 16px;
  --uni-sys-layout-gutter: 16px;
  --uni-sys-layout-pane-gap: 20px;
}

html[data-wsc="expanded"] {
  --uni-sys-layout-margin: 24px;
  --uni-sys-layout-gutter: 24px;
  --uni-sys-layout-pane-gap: 24px;
}

html[data-wsc="large"],
html[data-wsc="xlarge"] {
  --uni-sys-layout-margin: 32px;
  --uni-sys-layout-gutter: 32px;
  --uni-sys-layout-pane-gap: 28px;
}
```

### 5.3 Layout primitives

#### (A) Container

Responsibilities:

- max width
- responsive horizontal padding via `--uni-sys-layout-margin`
- content alignment

#### (B) Scaffold

Responsibilities:

- app shell slots: `topBar`, `nav`, `content`, `fab`, `bottomBar`
- swaps navigation patterns based on WSC:
  - compact → bottom nav
  - medium/expanded → nav rail
  - large/xlarge → drawer

#### (C) PaneGroup

Responsibilities:

- 1–3 pane canonical layouts (e.g., list/detail)
- rules:
  - compact → 1 pane, detail is routed/overlay
  - expanded → 2 panes
  - large/xlarge → 3 panes optional

---

## 6) Component System Architecture

### 6.1 Two categories

#### 1) Pure (native) components

Built with native elements, styled by tokens:

- Button, IconButton
- TextField (input/textarea)
- Checkbox/Radio/Switch
- Card/Surface
- Chip
- Badge, Divider, Progress, Skeleton

#### 2) Behavior-heavy components (Radix-backed)

Radix provides robust accessibility + keyboard + portal behavior:

- Dialog / AlertDialog
- Popover
- Tooltip
- DropdownMenu / ContextMenu
- Tabs
- Select

**Radix is for behavior only**; visuals remain Unisane.

### 6.2 Shared primitives (build FIRST)

- `Text` — type variants
- `Surface` — background tone + elevation
- `StateLayer` — hover/pressed overlays
- `FocusRing` — focus-visible styling
- `Icon` — consistent size + alignment

### 6.3 Component contract (mandatory checklist)

For every component, we define:

- Anatomy/slots
- Variants
- Sizes (`sm|md|lg`)
- States (hover/pressed/focus/disabled/loading)
- Accessibility notes
- Token map (which sys/comp tokens it uses)

### 6.4 Variant approach

- Use a variants helper (e.g. `cva` pattern) to keep class logic clean.
- Keep class composition in `*.variants.ts`.

---

## 7) Component Catalog & Roadmap

### Phase 1 — Core

- Text
- Surface / Card
- Button (filled/tonal/outlined/text/elevated)
- IconButton
- TextField (filled + outlined)
- Checkbox / Radio / Switch
- Chip

### Phase 2 — Overlays (Radix)

- Dialog / AlertDialog
- Popover
- Tooltip
- Menu / Dropdown
- Tabs
- Select
- Snackbar / Toast

### Phase 3 — Navigation + App shell

- TopAppBar
- NavigationBar (bottom)
- NavigationRail
- Drawer
- FAB
- Scaffold + PaneGroup + real examples

### Phase 4 — Expansion

- Slider
- SegmentedButtons
- Date/Time inputs (careful—complex)
- Tables (optional)
- Advanced forms patterns

---

## 8) Registry + CLI (shadcn workflow)

### 8.1 Registry layout

`registry/` is the canonical copy source:

- `registry/styles/uni-tokens.css`
- `registry/styles/uni-theme.css`
- `registry/primitives/*`
- `registry/layout/*`
- `registry/components/*`

### 8.2 CLI commands

#### `unisane-ui init`

- Creates `src/styles/uni-tokens.css`
- Creates `src/styles/uni-theme.css`
- Patches `app/globals.css` (or `src/styles/globals.css`) to import them
- Adds `.dark` guidance

#### `unisane-ui add <component>`

- Copies the component file(s) into `src/components/ui/`
- Copies dependencies (primitives/layout files) if missing
- Installs Radix dependencies only when needed

#### `unisane-ui doctor`

- Verifies Tailwind v4 install and `@import "tailwindcss"`
- Verifies css imports exist
- Verifies required files exist

### 8.3 Sync strategy

- Developers edit `packages/ui/src/**` as source of truth
- `scripts/sync-registry.mjs` mirrors files into `registry/**`

---

## 9) Docs (Unisane UI site)

### Structure

- Foundations
  - Color
  - Typography
  - Layout
  - Shape
  - Elevation
  - Motion
  - State

- Components
  - Each component: anatomy/variants/states/a11y/token map

- Patterns
  - Scaffold
  - List-detail
  - Forms
  - Navigation patterns

### Requirements

- Every component has examples for every variant + state
- Include “do/don’t” guidance where relevant

---

## 10) QA & Guardrails (what makes it “perfect”)

### 10.1 Token purity lint

A CI script fails if component code contains:

- `#` colors
- `rgb(`
- uncontrolled `px` values
- random shadows

### 10.2 Accessibility

- Unit + integration tests for:
  - dialog focus trap
  - keyboard navigation in menus/tabs/select
  - focus-visible ring

### 10.3 Visual regression

- Snapshot variants/states (Playwright/Chromatic)

### 10.4 Type safety

- Strict TS
- No `any`

---

## 11) Release & Versioning

### Internal releases

Even though we copy source, packages exist to:

- power docs app imports
- version the CLI

Recommended:

- Use Changesets
- Version CLI as primary deliverable

---

## 12) Execution Plan (exact order)

### Step 1 — Monorepo bootstrap

- pnpm workspace
- turbo pipeline
- docs app (Next.js + Tailwind v4)

### Step 2 — Tokens package

- token schema (ref/sys/comp)
- OKLCH palettes
- emit `uni-tokens.css` + `uni-theme.css`

### Step 3 — Layout primitives

- WindowSizeProvider + hook
- Container
- Scaffold
- PaneGroup

### Step 4 — Primitives

- Text
- Surface
- StateLayer
- FocusRing
- Icon

### Step 5 — Phase 1 components

- Button, IconButton
- TextField
- Checkbox/Radio/Switch
- Card/Chip

### Step 6 — Radix overlays

- Dialog, Popover, Tooltip
- Menu, Tabs, Select

### Step 7 — Navigation + demos

- TopAppBar, NavBar, NavRail, Drawer, FAB
- Full Scaffold demo apps

### Step 8 — Registry + CLI

- init/add/doctor
- sync-registry script

### Step 9 — Docs + QA

- foundation docs pages
- component docs pages
- visual regression + a11y checks

---

# Appendix A — Consumer App Outcome

After:

```bash
npx unisane-ui init
npx unisane-ui add button text-field dialog scaffold pane-group
```

Consumer app looks like:

```txt
src/
  styles/
    uni-tokens.css
    uni-theme.css
  components/
    ui/
      button.tsx
      text-field.tsx
      dialog.tsx
      scaffold.tsx
      pane-group.tsx
```

Usage:

```tsx
import { Button } from "@/components/ui/button";

<Button className="bg-primary text-on-primary">Continue</Button>;
```

---

# Appendix B — “Definition of Done” for v1

- ✅ Token system outputs OKLCH system roles for light/dark
- ✅ Tailwind v4 mapping provides clean utilities (bg/text/border/shadow/radius)
- ✅ Window size class system drives margins/gutters/panes/navigation
- ✅ Core primitives implemented and used by all components
- ✅ Phase 1 + overlay components implemented with consistent states
- ✅ CLI init/add/doctor works on a fresh Next.js app
- ✅ Docs and example apps show adaptive behavior
- ✅ CI enforces token purity + basic a11y + type safety
