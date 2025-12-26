# Unisane UI - Quick Start Guide

Get up and running with Unisane UI in minutes.

---

## Installation

### 1. Install the CLI

```bash
pnpm add -D @unisane/cli
# or
npx @unisane/cli init
```

### 2. Initialize your project

```bash
npx @unisane/cli init
```

This copies all necessary files to your project:

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

### 3. Install dependencies

```bash
pnpm add clsx tailwind-merge class-variance-authority
```

### 4. Add components

```bash
npx @unisane/cli add button
npx @unisane/cli add card
npx @unisane/cli add dialog
```

Components are copied to `src/components/ui/` with all dependencies auto-resolved.

For the full component documentation, see [Design System](../design-system/).

### 5. Configure paths (optional)

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

Or add to `package.json`:

```json
{
  "unisane": {
    "aliases": {
      "components": "~/components/ui"
    }
  }
}
```

---

## Project Structure After Init

```
src/
├── app/
│   ├── globals.css          # Imports tokens and theme
│   └── layout.tsx           # Add ThemeProvider here
├── styles/
│   ├── uni-tokens.css       # All CSS variables
│   ├── uni-theme.css        # Tailwind theme mapping
│   └── uni-base.css         # Base styles & animations
├── lib/
│   └── utils.ts             # cn, focusRing, stateLayer
├── components/
│   ├── theme-provider.tsx   # Theme management
│   └── ui/
│       ├── button.tsx       # After `add button`
│       └── ...
└── hooks/                   # After adding hooks
    └── ...
```

---

## globals.css

After init, your `globals.css` looks like:

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

---

## Usage

### Basic Component

```tsx
import { Button } from "@/components/ui/button";

export default function Page() {
  return <Button variant="filled">Click me</Button>;
}
```

### With Theme Provider

```tsx
// app/layout.tsx
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
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

---

## Customization

### Colors (CSS Variables)

Edit `src/styles/uni-tokens.css`:

```css
:root {
  /* Override primary color */
  --uni-sys-color-primary: #FF5722;
  --uni-sys-color-on-primary: #FFFFFF;
  --uni-sys-color-primary-container: #FFCCBC;
  --uni-sys-color-on-primary-container: #BF360C;
}

.dark {
  --uni-sys-color-primary: #FFAB91;
  --uni-sys-color-on-primary: #BF360C;
}
```

### Dark Mode

```tsx
// Use ThemeProvider config
<ThemeProvider config={{ theme: "dark" }}>

// Or "system" to auto-detect
<ThemeProvider config={{ theme: "system" }}>
```

### Density

Options: `dense` | `compact` | `standard` | `comfortable`

```tsx
<ThemeProvider config={{ density: "compact" }}>
```

### Radius Theme

Options: `sharp` | `standard` | `soft`

```tsx
<ThemeProvider config={{ radius: "soft" }}>
```

---

## Component Variants

### Button

```tsx
<Button variant="filled">Primary Action</Button>     {/* CTAs */}
<Button variant="tonal">Secondary Action</Button>    {/* Important */}
<Button variant="outlined">Tertiary Action</Button>  {/* Optional */}
<Button variant="text">Low Emphasis</Button>         {/* Inline */}
<Button variant="elevated">Special</Button>          {/* Floating */}
```

### Sizes

```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>   {/* Default */}
<Button size="lg">Large</Button>
```

See [Buttons & Actions](../design-system/04-buttons-actions.md) for complete documentation.

---

## Spacing System

### Recommended: Industrial Units

```tsx
<div className="p-4u gap-2u">
  {/* 4u = 4 units x 4px x density scale */}
  {/* At standard: 16px */}
  {/* At compact: 14px */}
</div>
```

**Common values:**
- `1u` = 4px (scaled)
- `2u` = 8px (scaled)
- `4u` = 16px (scaled)
- `6u` = 24px (scaled)
- `8u` = 32px (scaled)

### Legacy: Fixed Spacing (Still works)

```tsx
<div className="p-4 gap-2">
  {/* Always 16px and 8px */}
</div>
```

**When to use:**
- Use `4u` for component spacing (scales with density)
- Use `4` only when you need exact pixel values

See [Getting Started](../design-system/01-getting-started.md) for complete spacing documentation.

---

## Typography

### Type Scale

```tsx
<h1 className="text-display-large">Display Large</h1>
<h2 className="text-headline-medium">Headline Medium</h2>
<p className="text-body-large">Body Large</p>
<span className="text-label-small">Label Small</span>
```

**Available scales:**
- Display: `large` | `medium` | `small`
- Headline: `large` | `medium` | `small`
- Title: `large` | `medium` | `small`
- Body: `large` | `medium` | `small`
- Label: `large` | `medium` | `small`

---

## Colors

### Semantic Colors

```tsx
<div className="bg-primary text-on-primary">Primary</div>
<div className="bg-primary-container text-on-primary-container">Tonal</div>

<div className="bg-secondary text-on-secondary">Secondary</div>
<div className="bg-error text-on-error">Error</div>
<div className="bg-success text-on-success">Success</div>
```

### Surface Tones

```tsx
<div className="bg-surface text-on-surface">Base surface</div>
<div className="bg-surface-container">Elevated container</div>
<div className="bg-surface-container-high">Higher elevation</div>
```

---

## Common Patterns

### Form

```tsx
import { TextField, Button, Checkbox } from "@/components/ui";

export function LoginForm() {
  return (
    <form className="flex flex-col gap-4u p-6u">
      <TextField label="Email" type="email" />
      <TextField label="Password" type="password" />
      <Checkbox label="Remember me" />
      <Button variant="filled" type="submit">
        Sign In
      </Button>
    </form>
  );
}
```

### Card with Actions

```tsx
import { Card, Button, IconButton } from "@/components/ui";

export function ProductCard() {
  return (
    <Card className="p-4u">
      <div className="flex justify-between items-start mb-3u">
        <h3 className="text-title-large">Product Name</h3>
        <IconButton variant="text" ariaLabel="Favorite">
          <span className="material-symbols-outlined">favorite</span>
        </IconButton>
      </div>
      <p className="text-body-medium mb-4u">Description...</p>
      <div className="flex gap-2u">
        <Button variant="tonal">Add to Cart</Button>
        <Button variant="outlined">Details</Button>
      </div>
    </Card>
  );
}
```

See [Containers](../design-system/07-containers.md) for more card patterns.

---

## Navigation

### Rail + Drawer Pattern

For sophisticated navigation, see [Navigation](../design-system/08-navigation.md).

```tsx
import { useNavigation } from "@/hooks/use-navigation";
import { NavigationRail, NavigationDrawer } from "@/components/ui";

const navigation = useNavigation(NAV_DATA);

<NavigationRail
  items={railItems}
  value={navigation.activeCategoryId}
  onChange={navigation.handleCategoryClick}
  onItemHover={navigation.handleInteractionEnter}
/>

<NavigationDrawer
  open={navigation.isDrawerVisible}
  modal={false}
/>
```

---

## Accessibility

### Keyboard Navigation

All components support:
- `Tab` - Navigate between elements
- `Enter`/`Space` - Activate buttons
- `Escape` - Close dialogs/menus
- Arrow keys - Navigate lists/menus

### Focus Indicators

Automatic focus rings on all interactive elements:

```tsx
{/* Already styled with focus-visible ring */}
<Button>Accessible</Button>
```

### ARIA Labels

```tsx
<IconButton ariaLabel="Close dialog">
  <span className="material-symbols-outlined">close</span>
</IconButton>
```

---

## Troubleshooting

### Styles not applying

1. Check that globals.css imports are correct:

```css
/* app/globals.css */
@import "tailwindcss";
@import "../styles/uni-tokens.css";
@import "../styles/uni-theme.css";
@import "../styles/uni-base.css";
```

2. Verify the styles directory exists with all three files.

### TypeScript errors

Update your tsconfig.json:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Component not found

Make sure you added the component:

```bash
npx @unisane/cli add button
```

Components are copied to `src/components/ui/`.

### Missing dependencies

After adding components, install any peer dependencies:

```bash
pnpm add clsx tailwind-merge class-variance-authority
```

---

## Next Steps

1. **Explore Components** - Browse [Design System docs](../design-system/)
2. **Navigation Patterns** - Study [Navigation](../design-system/08-navigation.md)
3. **Layout System** - Check [Layout](../design-system/03-layout.md)
4. **Customize Tokens** - Edit `src/styles/uni-tokens.css`

---

## Resources

### Documentation

- [Design System](../design-system/) - Complete component documentation
- [Getting Started](../design-system/01-getting-started.md) - Setup and tokens
- [Utilities](../design-system/02-utilities.md) - Ripple, StateLayer, etc.

### Source

- Component Source: `packages/ui/src/components/`
- Registry: `packages/ui/registry/`

---

**Last Updated**: 2025-12-25
**Version**: 0.2.0
