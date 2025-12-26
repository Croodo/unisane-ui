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

- ALWAYS use design tokens (--uni-sys-*, --uni-ref-*)
- NEVER hardcode colors (#hex, rgb())
- NEVER use arbitrary pixel values

### 2. Spacing System

- PREFER industrial units (4u, 8u) - scales with density
- LEGACY fixed spacing (4, 8) - exact pixels only

### 3. Material 3 Compliance

- Keep M3 references in internal docs only
- Don't mention "Material 3" in user-facing code/comments
- Follow M3 spec for component behavior

### 4. Code Style

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

handbook/
├── design-system/      # Complete component documentation (16 files)
│   ├── 01-getting-started.md      # Setup, tokens, Tailwind
│   ├── 02-utilities.md            # Ripple, StateLayer, FocusRing
│   ├── 03-layout.md               # Container, Pane, Canonical Layouts
│   ├── 04-buttons-actions.md      # Button, IconButton, FAB
│   ├── 05-inputs-forms.md         # TextField, Select, Checkbox
│   ├── 06-display.md              # Typography, List, Chip
│   ├── 07-containers.md           # Card, Dialog, Sheet
│   ├── 08-navigation.md           # NavigationRail, NavigationDrawer
│   ├── 09-feedback.md             # Snackbar, Alert, Progress
│   ├── 10-overlays.md             # Tooltip, Menu, Dropdown
│   ├── 11-data-display.md         # Table, DataGrid
│   ├── 12-media.md                # Image, Carousel
│   ├── 13-advanced.md             # ScrollArea, Accordion
│   ├── 14-specialized.md          # DatePicker, Combobox
│   ├── 15-forms-extended.md       # ToggleGroup, Form
│   └── 16-pagination-rating.md    # Pagination, Rating
├── guides/             # Implementation guides
├── reference/          # Technical reference
└── llm-context/        # LLM-specific (YOU ARE HERE)
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

- Rail: [packages/ui/src/components/navigation-rail.tsx](../../packages/ui/src/components/navigation-rail.tsx)
- Drawer: [packages/ui/src/components/navigation-drawer.tsx](../../packages/ui/src/components/navigation-drawer.tsx)
- Docs: [handbook/design-system/08-navigation.md](../design-system/08-navigation.md)

---

## Key Concepts

### Industrial Units

```tsx
// Scales with density
<div className="p-4u gap-2u">
  {/* Standard: 16px padding, 8px gap */}
  {/* Compact: 13.6px padding, 6.8px gap */}
  {/* Dense: 12px padding, 6px gap */}
</div>
```

### Theme Configuration

```tsx
<ThemeProvider
  config={{
    density: "standard",  // dense | compact | standard | comfortable
    theme: "system",      // light | dark | system
    radius: "standard",   // sharp | standard | soft
  }}
/>
```

### Navigation Pattern

```tsx
const navigation = useNavigation(NAV_DATA);

const {
  activeCategoryId,
  activeSubItemId,
  effectiveCategory,
  isDrawerVisible,
  isPushMode,
  isMobileMenuOpen,
  handleCategoryClick,
  handleSubItemClick,
  handleInteractionEnter,
  handleInteractionLeave,
  handleDrawerEnter,
  handleDrawerLeave,
  toggleMobileMenu,
} = navigation;
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
- [Website Plan](../guides/website-plan.md) - Documentation site

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

## Current Status (v0.1.0-beta)

### Completed

- Component registry system
- Enhanced ThemeProvider (dark mode, density, radius)
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

## Session Context

This handbook was reorganized on 2025-12-25. The design system documentation was moved from a separate `design-system/` folder into `handbook/design-system/` to consolidate all documentation.

Key achievements:
1. Complete design system documentation (16 files covering all components)
2. Navigation system with sophisticated hover hooks
3. Pane system and Canonical Layouts
4. CVA + cn pattern throughout all components

See [Session Summary](./session-summary.md) for full context.

---

**Last Updated**: 2025-12-25
**For**: Claude Code & AI Assistants
**Version**: 0.1.0
