# Unisane UI - Quick Start Guide

Get up and running with Unisane UI in minutes.

---

## Installation

### 1. Initialize your project

```bash
npx unisane ui init
```

This creates all necessary files:

```
src/
├── styles/
│   └── unisane.css           # All tokens, theme, and base styles
├── lib/
│   └── utils.ts              # cn(), stateLayer helpers
├── components/
│   ├── theme-provider.tsx    # Optional - for runtime theming
│   └── ui/                   # Components added here
└── app/
    └── globals.css           # Updated with imports
```

### 2. Install dependencies

```bash
pnpm add clsx tailwind-merge class-variance-authority
```

### 3. Add components

```bash
npx unisane ui add button
npx unisane ui add card
npx unisane ui add dialog
```

Components are copied to `src/components/ui/` with all dependencies auto-resolved.

---

## globals.css

After init, your `globals.css` looks like:

```css
/* Tailwind v4 + Unisane UI */
@import "tailwindcss";
@import "@unisane/tokens/unisane.css";

/* Source paths for Tailwind class scanning */
@source "../**/*.{ts,tsx,mdx}";

/* Uses library defaults (blue theme) - no overrides needed */
```

### Customizing the Theme

To override the default blue theme, add your own `:root` block:

```css
/* Tailwind v4 + Unisane UI */
@import "tailwindcss";
@import "@unisane/tokens/unisane.css";

@source "../**/*.{ts,tsx,mdx}";

/* Custom theme - overrides library defaults */
:root {
  --hue: 145;     /* Green theme */
  --chroma: 0.14; /* Color intensity */
}
```

**Available hues:**
- Blue: `240` (default)
- Green: `145`
- Teal: `180`
- Purple: `285`
- Orange: `70`
- Red: `25`

Or use any value from 0-360 for custom colors.

---

## Usage

### Basic Component

```tsx
import { Button } from "@/components/ui/button";

export default function Page() {
  return <Button variant="filled">Click me</Button>;
}
```

### Simple Layout (No ThemeProvider needed!)

```tsx
// app/layout.tsx
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

Dark mode, density, and radius all work automatically via CSS!

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

In your `globals.css`:

```css
:root {
  --hue: 145;     /* Green theme */
  --chroma: 0.14; /* Standard intensity */
}
```

**Quick reference:**
| Color  | Hue  | Recommended Chroma |
|--------|------|-------------------|
| Blue   | 240  | 0.13              |
| Green  | 145  | 0.14              |
| Teal   | 180  | 0.12              |
| Purple | 285  | 0.15              |
| Orange | 70   | 0.16              |
| Red    | 25   | 0.16              |

### Monochrome / Black Theme

For a pure black/white/gray theme:

```css
:root {
  --hue: 0;
  --chroma: 0;
  --chroma-neutral: 0;  /* Important: removes tint from surfaces */
}
```

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

## ThemeProvider (Optional)

ThemeProvider is **only needed** if you want runtime theme switching UI (like a dark mode toggle button).

```tsx
// app/layout.tsx - WITH ThemeProvider (for runtime controls)
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

Then use the hook:

```tsx
import { useTheme } from "@/components/theme-provider";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      Toggle Theme
    </button>
  );
}
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

---

## Spacing System

### Industrial Units (Recommended)

```tsx
<div className="p-4u gap-2u">
  {/* 4u = 4 units x 4px x density scale */}
  {/* At standard: 16px */}
  {/* At compact: 14px */}
</div>
```

**Common values:**
- `1u` = 4px (scaled by density)
- `2u` = 8px (scaled)
- `4u` = 16px (scaled)
- `6u` = 24px (scaled)
- `8u` = 32px (scaled)

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

---

## Troubleshooting

### Styles not applying

1. Check that globals.css has the import:

```css
@import "tailwindcss";
@import "@unisane/tokens/unisane.css";
```

2. Verify `@unisane/tokens` package is installed.

### Theme override not working

Make sure your `:root` block is **after** the imports and is not inside a layer:

```css
@import "tailwindcss";
@import "@unisane/tokens/unisane.css";

/* This will work - unlayered CSS has highest priority */
:root {
  --hue: 145;
  --chroma: 0.14;
}
```

### Colors have unwanted tint in monochrome mode

For pure grayscale, also zero out the neutral chroma:

```css
:root {
  --hue: 0;
  --chroma: 0;
  --chroma-neutral: 0;  /* Removes tint from surfaces */
}
```

### Dark mode not working

Dark mode works automatically via `prefers-color-scheme`. To test:
- Use browser dev tools to simulate dark mode
- Or add `class="dark"` to `<html>`

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
npx unisane ui add button
```

### Missing dependencies

After adding components, install peer dependencies:

```bash
pnpm add clsx tailwind-merge class-variance-authority
```

---

## Summary

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

---

**Last Updated**: 2025-12-27
**Version**: 0.4.0
