# Unisane UI Handbook

Complete documentation for developers and LLMs working with the Unisane UI design system.

---

## Quick Navigation

### Design System Documentation

The comprehensive design system docs covering all components, utilities, and patterns:

| Document | Description |
|----------|-------------|
| [Getting Started](./design-system/01-getting-started.md) | Setup, tokens, Tailwind integration |
| [Utilities](./design-system/02-utilities.md) | Ripple, StateLayer, FocusRing, Portal, Hooks |
| [Layout](./design-system/03-layout.md) | Container, Grid, Stack, Pane System, Canonical Layouts |
| [Buttons & Actions](./design-system/04-buttons-actions.md) | Button, IconButton, FAB, SegmentedButton |
| [Inputs & Forms](./design-system/05-inputs-forms.md) | TextField, Select, Checkbox, Radio, Switch, Slider |
| [Display](./design-system/06-display.md) | Typography, List, Chip, Avatar, Divider |
| [Containers](./design-system/07-containers.md) | Card, Dialog, Sheet, Popover |
| [Navigation](./design-system/08-navigation.md) | NavigationRail, NavigationDrawer, useNavigation, TopAppBar, Tabs |
| [Feedback](./design-system/09-feedback.md) | Snackbar, Alert, Progress, Badge |
| [Overlays](./design-system/10-overlays.md) | Tooltip, Menu, Dropdown, BottomSheet |
| [Data Display](./design-system/11-data-display.md) | Table, DataGrid, EmptyState, Stat |
| [Media](./design-system/12-media.md) | Image, ImageGallery, FileUpload, Carousel |
| [Advanced](./design-system/13-advanced.md) | ScrollArea, Accordion, Breadcrumb, Stepper, Timeline |
| [Specialized](./design-system/14-specialized.md) | Resizable, ContextMenu, Command, DatePicker, Combobox |
| [Forms Extended](./design-system/15-forms-extended.md) | ToggleGroup, RadioGroup, CheckboxGroup, Form, Label |
| [Pagination & Rating](./design-system/16-pagination-rating.md) | Pagination, SimplePagination, Rating |

### Guides

- [Quick Start](./guides/quick-start.md) - Installation and basic setup
- [Implementation Plan](./guides/implementation-plan.md) - Development roadmap
- [Website Plan](./guides/website-plan.md) - Documentation site architecture

### Reference

- [Current Status](./reference/current-status.md) - Project progress tracking
- [Final Status](./reference/final-status.md) - Comprehensive status report
- [Navigation System](./reference/navigation-system.md) - Navigation patterns and hooks

### LLM Context

- [Blueprint](./llm-context/blueprint.md) - System architecture for AI assistants
- [Session Summary](./llm-context/session-summary.md) - Previous session context
- [Quick Reference](./llm-context/quick-reference.md) - Essential context for LLMs

---

## Handbook Structure

```
handbook/
├── design-system/              # Complete component documentation
│   ├── README.md                  # Design system overview
│   ├── 01-getting-started.md      # Setup and configuration
│   ├── 02-utilities.md            # Utility components and hooks
│   ├── 03-layout.md               # Layout system (Container, Pane, Canonical)
│   ├── 04-buttons-actions.md      # Button variants
│   ├── 05-inputs-forms.md         # Form controls
│   ├── 06-display.md              # Display components
│   ├── 07-containers.md           # Container components
│   ├── 08-navigation.md           # Navigation system
│   ├── 09-feedback.md             # Feedback components
│   ├── 10-overlays.md             # Overlay components
│   ├── 11-data-display.md         # Data display components
│   ├── 12-media.md                # Media components
│   ├── 13-advanced.md             # Advanced components
│   ├── 14-specialized.md          # Specialized components
│   ├── 15-forms-extended.md       # Extended form components
│   └── 16-pagination-rating.md    # Pagination and rating
│
├── guides/                     # Implementation guides
│   ├── quick-start.md             # Getting started guide
│   ├── implementation-plan.md     # Complete roadmap
│   └── website-plan.md            # Documentation site plan
│
├── reference/                  # Technical reference
│   ├── current-status.md          # Project status
│   ├── final-status.md            # Comprehensive report
│   └── navigation-system.md       # Navigation documentation
│
└── llm-context/                # LLM-specific context
    ├── blueprint.md               # System architecture
    ├── session-summary.md         # Session history
    └── quick-reference.md         # Quick reference guide
```

---

## System Overview

### Design System

Unisane UI is a Material 3-based design system built with:

- **React 19** - Latest React features
- **Tailwind CSS v4** - Token-driven utilities
- **TypeScript** - Strict mode, full type safety
- **CVA** - Class variance authority for component variants
- **shadcn-style** - Copy components, own your code

### Key Features

- **61+ Components** - Complete component library
- **Dark Mode** - Auto-detect system preference
- **4 Density Presets** - Dense, compact, standard, comfortable
- **3 Radius Themes** - Sharp, standard, soft
- **Industrial Units** - Density-aware spacing (4u, 8u)
- **TypeScript Autocomplete** - Full IntelliSense for M3 tokens
- **Navigation System** - Sophisticated rail + drawer patterns
- **Accessibility** - WCAG AA compliant

---

## Quick Start

### Installation

```bash
pnpm add @unisane/ui
npx @unisane/cli init
npx @unisane/cli add button card dialog
```

### Basic Setup

```tsx
import { ThemeProvider } from "@unisane/ui";
import "@unisane/ui/styles.css";

export default function App({ children }) {
  return (
    <ThemeProvider
      config={{
        density: "standard",
        theme: "system",
        radius: "standard",
      }}
    >
      {children}
    </ThemeProvider>
  );
}
```

### Usage

```tsx
import { Button } from "@/components/ui/button";

<Button variant="filled">Click me</Button>
```

---

## Component Inventory

### Total: 61+ Components

**Primitives (7):**
ripple, icon, text, surface, state-layer, focus-ring, menu

**Layout (5):**
container, pane, pane-layout, app-layout, theme-provider

**Components (49+):**
button, icon-button, fab, fab-menu, text-field, checkbox, radio, switch, slider, card, chip, badge, avatar, dialog, sheet, popover, tooltip, dropdown-menu, select, combobox, tabs, alert, banner, snackbar, progress, skeleton, divider, accordion, list, table, pagination, breadcrumb, stepper, top-app-bar, bottom-app-bar, navigation-bar, navigation-rail, navigation-drawer, search-bar, carousel, date-picker, time-picker, calendar, rating, scroll-area, segmented-button, canonical-layouts, typography, and more

---

## Documentation Philosophy

### 1. Token-First

All styling derives from design tokens:

```css
:root {
  --uni-ref-primary-40: #6750A4;
  --uni-sys-color-primary: var(--uni-ref-primary-40);
}
```

### 2. CVA Pattern

Components use class-variance-authority for type-safe variants:

```tsx
const buttonVariants = cva("base-classes", {
  variants: {
    variant: {
      filled: "bg-primary text-on-primary",
      tonal: "bg-secondary-container",
    },
  },
});
```

### 3. Industrial Units

Spacing that scales with density:

```tsx
<div className="p-4u gap-2u">
  {/* Standard: 16px padding, 8px gap */}
  {/* Compact: 13.6px padding, 6.8px gap */}
</div>
```

---

## Using This Handbook

### As a Developer

1. **Getting Started**: Read [Design System Setup](./design-system/01-getting-started.md)
2. **Component Reference**: Browse [Design System docs](./design-system/)
3. **Navigation Patterns**: Study [Navigation docs](./design-system/08-navigation.md)
4. **Layouts**: Check [Layout docs](./design-system/03-layout.md)

### As an LLM

1. **System Understanding**: Read [Blueprint](./llm-context/blueprint.md)
2. **Quick Context**: Check [Quick Reference](./llm-context/quick-reference.md)
3. **Component Details**: Browse [Design System docs](./design-system/)
4. **Session History**: Review [Session Summary](./llm-context/session-summary.md)

---

## Project Status

### Completed (70%)

- Component registry system
- Enhanced ThemeProvider (dark mode, density, radius)
- TypeScript autocomplete
- Navigation system (primitives + hooks)
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

## Resources

### Internal

- Component Source: `packages/ui/src/components/`
- Registry: `packages/ui/registry/`
- CLI: `packages/cli/`
- Tokens: `packages/tokens/`
- Reference Implementation: `unisane-ui-reference/`

### External

- [Material 3 Guidelines](https://m3.material.io)
- [Tailwind CSS v4](https://tailwindcss.com)
- [React Documentation](https://react.dev)

---

**Last Updated**: 2025-12-25
**Version**: 0.1.0
**Status**: Active Development
