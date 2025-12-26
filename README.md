# Unisane UI

A Material 3-based design system built with React, Tailwind CSS v4, and TypeScript. Production-ready components with sophisticated theming, accessibility, and developer experience.

---

## Features

- ✅ **61 Components** - Complete Material 3 component library
- ✅ **Dark Mode** - Auto-detect system preference with manual override
- ✅ **4 Density Presets** - Dense, compact, standard, comfortable
- ✅ **3 Radius Themes** - Sharp, standard, soft
- ✅ **Industrial Units** - Density-aware spacing system (4u, 8u)
- ✅ **TypeScript** - Full autocomplete for M3 tokens and components
- ✅ **Navigation System** - Sophisticated rail + drawer patterns
- ✅ **Accessibility** - WCAG AA compliant
- ✅ **shadcn-style** - Copy components, own your code

---

## Quick Start

```bash
# Install
pnpm add @unisane/ui

# Initialize
npx @unisane/cli init

# Add components
npx @unisane/cli add button card dialog
```

```tsx
import { ThemeProvider, Button } from "@unisane/ui";
import "@unisane/ui/styles.css";

export default function App() {
  return (
    <ThemeProvider config={{ theme: "system", density: "standard" }}>
      <Button variant="filled">Click me</Button>
    </ThemeProvider>
  );
}
```

---

## Documentation

**📚 [Complete Handbook](./handbook/README.md)** - Internal documentation for developers and LLMs

### For Developers
- [Getting Started](./handbook/guides/quick-start.md)
- [Customization Guide](./handbook/design-system/customization.md)
- [Spacing System](./handbook/design-system/spacing.md)
- [Navigation System](./handbook/reference/navigation-system.md)

### For Contributors
- [Implementation Plan](./handbook/guides/implementation-plan.md)
- [Current Status](./handbook/reference/current-status.md)
- [System Blueprint](./handbook/llm-context/blueprint.md)

---

## Project Structure

```
unisane-ui/
├── apps/
│   ├── docs/                    # Documentation site
│   └── web/                     # Demo app
│
├── packages/
│   ├── ui/                      # Component library
│   │   ├── src/
│   │   │   ├── components/      # 49 components
│   │   │   ├── primitives/      # 7 primitives
│   │   │   ├── layout/          # 5 layout components
│   │   │   └── hooks/           # Navigation & theme hooks
│   │   └── registry/            # shadcn-style registry
│   │
│   ├── cli/                     # CLI tool
│   ├── tokens/                  # Design tokens
│   └── tailwind-config/         # Tailwind preset
│
├── handbook/                    # 📚 Documentation
│   ├── design-system/           # Design fundamentals
│   ├── components/              # Component docs
│   ├── guides/                  # How-to guides
│   ├── reference/               # Technical reference
│   └── llm-context/             # LLM-specific context
│
└── docs/                        # Legacy docs (moved to handbook)
```

---

## Technology Stack

- **React 19** - Latest React features
- **Tailwind CSS v4** - Token-driven utilities with `@theme inline`
- **TypeScript** - Strict mode, full type safety
- **Material Design 3** - Google's design system
- **pnpm + Turborepo** - Monorepo management
- **Class Variance Authority** - Type-safe variants

---

## Components

### Primitives (7)
ripple, icon, text, surface, state-layer, focus-ring, menu

### Layout (5)
container, pane, app-layout, theme-provider, window-size-provider

### Components (49)
button, icon-button, fab, text-field, checkbox, radio, switch, slider, card, chip, badge, avatar, dialog, sheet, popover, tooltip, dropdown-menu, select, combobox, tabs, alert, banner, snackbar, progress, skeleton, divider, accordion, list, table, pagination, breadcrumb, stepper, navigation-bar, navigation-rail, navigation-drawer, and more.

---

## Key Features

### Dark Mode
```tsx
<ThemeProvider config={{ theme: "system" }}>
  <ThemeSwitcher />
</ThemeProvider>
```

### Density Control
```tsx
<ThemeProvider config={{ density: "compact" }}>
  {/* All components scale automatically */}
</ThemeProvider>
```

### Industrial Units
```tsx
<div className="p-4u gap-2u">
  {/* Scales with density: 16px → 13.6px at compact */}
</div>
```

### Navigation System
```tsx
const { isDrawerVisible, handleItemHover } = useNavigationHover({
  items: navItems,
  hoverDelay: 150,
  exitDelay: 300,
});
```

---

## Development

```bash
# Install dependencies
pnpm install

# Build tokens
cd packages/tokens
pnpm build

# Build UI library
cd packages/ui
pnpm build

# Run dev app
cd apps/web
pnpm dev
```

---

## Status

- **Version**: 0.1.0-beta
- **Progress**: 65% complete
- **Components**: 61/61 implemented
- **Documentation**: 10/71 docs complete
- **Status**: Production-ready for internal use

See [Current Status](./handbook/reference/current-status.md) for details.

---

## Contributing

1. Read the [Implementation Plan](./handbook/guides/implementation-plan.md)
2. Check [Current Status](./handbook/reference/current-status.md)
3. Follow the [System Blueprint](./handbook/llm-context/blueprint.md)
4. Submit a PR with tests

---

## License

MIT

---

## Links

- [Handbook](./handbook/README.md) - Complete documentation
- [Quick Start](./handbook/guides/quick-start.md) - Get started guide
- [Customization](./handbook/design-system/customization.md) - Theming guide
- [Navigation System](./handbook/reference/navigation-system.md) - Navigation docs

---

**Built with ❤️ using Material Design 3**
