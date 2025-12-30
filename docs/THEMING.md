# Unisane UI Theming System

Comprehensive guide to the Unisane UI theming system, built on OKLCH color science and Material 3 tonal palettes.

## Architecture Overview

The theming system uses a **three-layer architecture**:

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: Reference Palette (--ref-*)                          │
│  OKLCH colors derived from --hue and --chroma                  │
│  e.g., --ref-primary-40, --ref-neutral-90                      │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: Tone Mapping (--tone-*)                              │
│  Maps reference tones to semantic roles                        │
│  e.g., --tone-primary: var(--ref-primary-40)                   │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: Semantic Colors (--color-*)                          │
│  Used in components                                            │
│  e.g., --color-primary: var(--tone-primary)                    │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Basic Setup

```tsx
// app/layout.tsx
import { ThemeProvider } from "@unisane/ui";
import type { ThemeConfig, Theme } from "@unisane/ui";

const themeConfig = {
  density: "standard",
  radius: "standard",
  scheme: "tonal",
  contrast: "standard",
  elevation: "subtle",
  colorTheme: "blue",
  theme: "system",
} satisfies Required<ThemeConfig> & { theme: Theme };

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-density={themeConfig.density}
      data-radius={themeConfig.radius}
      data-scheme={themeConfig.scheme}
      data-contrast={themeConfig.contrast}
      data-elevation={themeConfig.elevation}
      data-color-theme={themeConfig.colorTheme}
      data-theme-mode={themeConfig.theme}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

### CSS Import

```css
/* globals.css */
@import "tailwindcss";
@import "@unisane/tokens/unisane.css";
```

## Theme Options

### Color Themes (`data-color-theme`)

Available color themes:

| Theme | Hue | Description |
|-------|-----|-------------|
| `blue` | 240 | Default, professional |
| `purple` | 285 | Creative, premium |
| `pink` | 340 | Playful, feminine |
| `red` | 25 | Urgent, bold |
| `orange` | 55 | Energetic, warm |
| `yellow` | 85 | Optimistic, attention |
| `green` | 145 | Growth, success |
| `cyan` | 195 | Technical, calm |
| `neutral` | 60 | Subtle warmth, professional |
| `black` | 0 | Pure monochrome, dark buttons |

### Dark/Light Mode (`data-theme-mode`)

| Value | Description |
|-------|-------------|
| `light` | Force light mode |
| `dark` | Force dark mode |
| `system` | Follow OS preference |

### Color Schemes (`data-scheme`)

| Value | Description |
|-------|-------------|
| `tonal` | Full M3 tonal palette with vibrant colors (default) |
| `monochrome` | Pure grayscale with black/white buttons |
| `neutral` | Low saturation, subtle color hints |

### Contrast Levels (`data-contrast`)

| Value | Description |
|-------|-------------|
| `standard` | M3 baseline contrast (default) |
| `medium` | Boosted readability |
| `high` | Maximum contrast (WCAG AAA) |

### Density (`data-density`)

| Value | Space Scale | Type Scale | Radius Scale |
|-------|-------------|------------|--------------|
| `dense` | 0.75 | 0.85 | 0.85 |
| `compact` | 0.875 | 0.9 | 0.9 |
| `standard` | 1.0 | 1.0 | 1.0 |
| `comfortable` | 1.1 | 1.0 | 1.0 |

### Corner Radius (`data-radius`)

| Value | Scale | Description |
|-------|-------|-------------|
| `none` | 0 | Square corners |
| `minimal` | 0.25 | Very subtle rounding |
| `sharp` | 0.5 | Slightly rounded |
| `standard` | 1.0 | Balanced (default) |
| `soft` | 1.25 | More rounded |

### Elevation (`data-elevation`)

| Value | Shadow Opacity | Description |
|-------|----------------|-------------|
| `flat` | 0 | No shadows |
| `subtle` | 0.5 | Minimal depth |
| `standard` | 1.0 | M3 default |
| `pronounced` | 1.5 | Strong shadows |

## Runtime Theme Changes

Use the `useTheme` hook to change themes at runtime:

```tsx
import { useTheme } from "@unisane/ui";

function ThemeSwitcher() {
  const {
    theme, setTheme, resolvedTheme,
    colorTheme, setColorTheme,
    density, setDensity,
    radius, setRadius,
    scheme, setScheme,
    contrast, setContrast,
    elevation, setElevation
  } = useTheme();

  return (
    <div>
      <select value={colorTheme} onChange={(e) => setColorTheme(e.target.value)}>
        <option value="blue">Blue</option>
        <option value="green">Green</option>
        <option value="purple">Purple</option>
      </select>

      <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
        Toggle Dark Mode
      </button>
    </div>
  );
}
```

### Validation

All setters validate values at runtime and warn in the console if invalid:

```tsx
setColorTheme("invalid"); // Console: Invalid colorTheme "invalid". Valid values: blue, purple, ...
```

## CSS Custom Properties

### Spacing (`--unit`)

Spacing scales with density:

```css
--unit: calc(4px * var(--scale-space));

/* Usage */
.element {
  padding: calc(var(--unit) * 4); /* 16px at standard density */
}
```

### Radius (Decoupled Scaling)

Radius has independent density and theme scaling:

```css
--scale-radius: calc(var(--scale-radius-density) * var(--scale-radius-theme));

/* Density sets --scale-radius-density */
/* Radius theme sets --scale-radius-theme */
/* Both multiply together for final scale */
```

This means:
- `data-density="compact"` + `data-radius="soft"` = 0.9 × 1.25 = 1.125 scale
- They work independently without conflict

### Colors

Use semantic color tokens:

```css
.button {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.card {
  background: var(--color-surface-container);
  border: 1px solid var(--color-outline-variant);
}
```

## Custom Color Themes

Add custom color themes in your CSS:

```css
:root[data-color-theme="brand"] {
  --hue: 180 !important;
  --chroma: 0.12 !important;
}
```

Then register with ThemeProvider validation (optional):

```tsx
// Extend the ColorTheme type
declare module "@unisane/ui" {
  interface CustomColorThemes {
    brand: true;
  }
}
```

## Persistence

Theme preferences are stored in localStorage under `unisane-theme`:

```json
{
  "theme": "dark",
  "colorTheme": "purple",
  "density": "compact"
}
```

### Disable Persistence

```tsx
<ThemeProvider storageKey={false}>
  {/* HTML attributes become the sole source of truth */}
</ThemeProvider>
```

### Reset to Defaults

```tsx
import { clearStoredTheme } from "@unisane/ui";

function ResetButton() {
  return (
    <button onClick={() => {
      clearStoredTheme();
      window.location.reload();
    }}>
      Reset Theme
    </button>
  );
}
```

## SSR / Hydration

The system is designed for SSR frameworks:

1. **HTML Attributes**: Set defaults on `<html>` element (SSR source of truth)
2. **Blocking Script**: Optional script to prevent flash (not required with HTML attributes)
3. **ThemeProvider**: Syncs React state with DOM on mount

The priority order is:
```
localStorage > HTML attributes > DEFAULTS
```

## Tailwind Integration

All tokens are mapped to Tailwind utilities:

```tsx
<div className="bg-surface text-on-surface">
  <button className="bg-primary text-on-primary rounded-md shadow-2">
    Click me
  </button>
</div>
```

### Typography Scale

```tsx
<h1 className="text-display-large">Display</h1>
<h2 className="text-headline-medium">Headline</h2>
<p className="text-body-large">Body text</p>
<span className="text-label-small">Label</span>
```

### Spacing with Density

```tsx
<div className="p-4 gap-2"> {/* Scales with density */}
```

## Best Practices

1. **Use semantic tokens**: `bg-primary` not `bg-blue-500`
2. **Respect the cascade**: Don't override with `!important` unless necessary
3. **Test all combinations**: Verify light/dark × scheme × contrast
4. **Consider accessibility**: Test with `data-contrast="high"`
5. **Trust the system**: Let density affect spacing/type/radius together

## Migration from v3

If upgrading from earlier versions:

1. Rename `data-theme` to `data-color-theme` for color themes
2. `data-theme-mode` is for light/dark/system mode
3. Density no longer conflicts with radius (they multiply)
