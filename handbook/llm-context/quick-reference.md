# LLM Quick Reference

Essential context for AI assistants working with Unisane UI.

---

## System Identity

**Name**: Unisane UI
**Type**: Material 3 Design System
**Tech**: React 19 + Tailwind CSS v4 + TypeScript
**Philosophy**: Token-first, shadcn-style component distribution

---

## Critical Rules

### 1. Token Purity

- ALWAYS use design tokens (--color-*, --ref-*, --hue)
- NEVER hardcode colors (#hex, rgb())
- NEVER use arbitrary pixel values

### 2. Single Variable Theming

- Change `--hue` (0-360) and `--chroma` (0-0.2) to theme the entire app
- Available hues: Blue (240), Green (145), Teal (180), Purple (285), Orange (70), Red (25)
- Monochrome: `--hue: 0; --chroma: 0; --chroma-neutral: 0;`

### 3. CSS-Only Mode Switching

- Dark mode: automatic via `prefers-color-scheme` or `.dark` class
- Scheme: `data-scheme="tonal|monochrome|neutral"`
- Contrast: `data-contrast="standard|medium|high"`
- Density: `data-density="compact|dense|comfortable"`
- Radius: `data-radius="sharp|soft"`

### 4. Spacing System

- PREFER industrial units (4u, 8u) - scales with density
- LEGACY fixed spacing (4, 8) - exact pixels only

### 5. Code Style

- No unnecessary comments in components
- Use JSDoc for public APIs
- Export types alongside components
- Use CVA for variants

---

## Project Structure

```
packages/ui/src/
├── components/         # 49+ UI components
├── primitives/         # 7 base primitives
├── layout/             # 5 layout components
├── hooks/              # Navigation & theme hooks
└── types/              # TypeScript definitions

registry/               # shadcn-style registry
├── styles/
│   └── unisane.css     # Single merged CSS file
├── lib/
│   └── utils.ts        # cn() helper
├── primitives/
├── layout/
└── components/

handbook/
├── design-system/      # Complete component documentation (16 files)
├── guides/             # Implementation guides
├── reference/          # Technical reference
└── llm-context/        # LLM-specific (YOU ARE HERE)
```

---

## Token System (OKLCH)

### Config Tokens (User adjustable)

```css
:root {
  --hue: 240;           /* Primary hue 0-360 */
  --chroma: 0.13;       /* Color intensity (0-0.2) */
}

/* For monochrome/black theme: */
:root {
  --hue: 0;
  --chroma: 0;
  --chroma-neutral: 0;  /* Removes tint from surfaces */
}
```

### Reference Tokens (Auto-generated)

```css
--ref-primary-40: oklch(0.55 0.150 var(--hue));
--ref-primary-80: oklch(0.88 0.105 var(--hue));
--ref-primary-90: oklch(0.94 0.075 var(--hue));
```

### Semantic Tokens (Components use these)

```css
--color-primary: var(--ref-primary-40);
--color-on-primary: var(--ref-primary-100);
--color-primary-container: var(--ref-primary-90);
--color-surface: var(--ref-neutral-99);
--color-secondary-container: var(--ref-secondary-90);
```

---

## CSS Import (Single File)

```css
/* Consumer app globals.css */
@import "tailwindcss";
@import "../styles/unisane.css";

/* Theme your app */
:root {
  --hue: 145;  /* Green theme */
}
```

---

## Navigation System

### Architecture

Complete navigation system with:

1. **NavigationRail**: Vertical rail with icon items
2. **NavigationDrawer**: Expandable drawer with sub-items
3. **useNavigation**: Hook managing hover delays and state

### Key Implementation

`useNavigation` hook provides:
- 150ms entry delay (prevents flickering)
- 300ms exit grace period (diagonal mouse movement)
- Three-layer state: persistent (clicked), transient (hover), visual (content persistence)
- Lock/unlock on click

### Files

- Rail: `packages/ui/src/components/navigation-rail.tsx`
- Drawer: `packages/ui/src/components/navigation-drawer.tsx`
- Docs: `handbook/design-system/08-navigation.md`

---

## Key Concepts

### Industrial Units

```tsx
// Scales with density
<div className="p-4u gap-2u">
  {/* Standard: 16px padding, 8px gap */}
  {/* Compact: ~14px padding, ~7px gap */}
  {/* Dense: ~12px padding, ~6px gap */}
</div>
```

### Theme Configuration (Optional)

ThemeProvider is ONLY needed for runtime UI controls:

```tsx
<ThemeProvider
  config={{
    density: "standard",  // dense | compact | standard | comfortable
    theme: "system",      // light | dark | system
    radius: "standard",   // sharp | standard | soft
  }}
/>
```

### CSS-Only Theming (Recommended)

```html
<!-- Dark mode -->
<html class="dark">

<!-- Scheme (color strategy) -->
<html data-scheme="tonal">        <!-- Full color (default) -->
<html data-scheme="monochrome">   <!-- Pure grayscale -->
<html data-scheme="neutral">      <!-- Low saturation -->

<!-- Contrast (accessibility) -->
<html data-contrast="standard">   <!-- Default -->
<html data-contrast="medium">     <!-- Boosted readability -->
<html data-contrast="high">       <!-- WCAG AAA compliant -->

<!-- Density -->
<html data-density="compact">

<!-- Radius -->
<html data-radius="soft">

<!-- Combining modifiers -->
<html class="dark" data-scheme="neutral" data-contrast="high">
```

---

## User Preferences

### Communication Style

- NO emojis unless explicitly requested
- NO "Material 3" mentions in user-facing code
- NO unnecessary comments in components
- Concise, professional tone
- Technical accuracy over validation

### Implementation Approach

- Prefer editing existing files over creating new ones
- Never create markdown files unless explicitly requested
- Use specialized tools (Read, Edit, Write) over bash commands
- Run multiple independent tool calls in parallel

---

## Component Patterns

### Variant System (CVA)

```typescript
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        filled: "bg-primary text-on-primary",
        tonal: "bg-secondary-container text-on-secondary-container",
      },
      size: {
        sm: "px-4u py-2u text-label-medium",
        md: "px-6u py-3u text-label-large",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "md",
    },
  }
);
```

### forwardRef Pattern

```typescript
export const Component = forwardRef<HTMLElement, ComponentProps>(
  function Component(props, ref) {
    return <element ref={ref} {...props} />;
  }
);

Component.displayName = "Component";
```

---

## Documentation Locations

### For Implementation

- [Design System](../design-system/) - Complete component documentation (16 files)
- [Getting Started](../design-system/01-getting-started.md) - Setup and tokens
- [Navigation](../design-system/08-navigation.md) - Navigation system
- [Layout](../design-system/03-layout.md) - Pane system, Canonical Layouts

### For Users

- [Quick Start](../guides/quick-start.md) - Getting started
- [Blueprint](./blueprint.md) - Complete system architecture

### For Status

- [Current Status](../reference/current-status.md) - Week-by-week progress
- [Final Status](../reference/final-status.md) - Comprehensive report

---

## Component Count

- **Total**: 61+ components
- **Primitives**: 7 (ripple, icon, text, surface, state-layer, focus-ring, menu)
- **Layout**: 5 (container, pane, pane-layout, app-layout, theme-provider)
- **Components**: 49+ (button, text-field, dialog, navigation-rail, etc.)

---

## Current Status (v0.4.0)

### Completed

- OKLCH token system with `--hue` and `--chroma` theming
- CSS-only dark mode (prefers-color-scheme + .dark class)
- CSS-only scheme variants (tonal, monochrome, neutral)
- CSS-only contrast variants (standard, medium, high - WCAG AAA)
- CSS-only density and radius variants
- Monochrome/black theme support (--chroma-neutral: 0)
- Single CSS file import (`unisane.css`)
- Component registry system
- Enhanced ThemeProvider (optional, for runtime controls)
- TypeScript autocomplete
- Navigation system (primitives + sophisticated hover hooks)
- Complete design system documentation (16 files)
- 61+ components implemented

### In Progress

- UI library structure refinement
- CLI distribution improvements
- Storybook integration

### Planned

- Testing infrastructure
- NPM publishing
- Public beta

---

## Development Commands

```bash
# Build tokens
cd packages/tokens && pnpm build

# Build UI
cd packages/ui && pnpm build

# TypeScript check
npx tsc --noEmit

# Run dev
cd apps/web && pnpm dev
```

---

## When to Use Task Tool

### DO use Task tool (Explore agent) for:

- "Where are errors handled?"
- "What is the codebase structure?"
- "How does X work?"
- Open-ended exploration requiring multiple searches

### DON'T use Task tool for:

- Reading specific known file paths
- Searching for specific class/function names
- Searching within 2-3 specific files
- Simple grep/glob operations

---

## Key Files

### Token System
- Config: `packages/tokens/src/theme-config.json`
- Build: `packages/tokens/scripts/build.mjs`
- Output: `packages/tokens/dist/unisane.css`

### Registry
- Styles: `registry/styles/unisane.css`
- Utils: `registry/lib/utils.ts`
- Components: `registry/components/`

### Web App
- Globals: `apps/web/app/globals.css`
- Layout: `apps/web/app/layout.tsx`

---

**Last Updated**: 2025-12-27
**For**: Claude Code & AI Assistants
**Version**: 0.4.0
