# Unisane Design System

A Material 3 Expressive design system focused on emotion-driven UX, flexible shapes, vibrant color roles, and token-first motion/typography.

## Token Architecture

```
ref.json → build.mjs → uni-tokens.css → uni-theme.css → Tailwind v4 @theme
```

### Token Namespaces

| Prefix | Description | Example |
|--------|-------------|---------|
| `--uni-ref-*` | Reference palette values | `--uni-ref-primary-40` |
| `--uni-sys-*` | System semantic tokens | `--uni-sys-color-primary` |
| Tailwind classes | Final utility classes | `bg-primary`, `shadow-1` |

---

## Color Tokens

### Surface Tones
| Token | Usage |
|-------|-------|
| `bg-surface` | Base surface background |
| `bg-surface-container-low/high/highest` | Elevated containers |
| `text-on-surface` | Text on surfaces |
| `text-on-surface-variant` | Secondary text |

### Semantic Colors
| Color | Filled | Tonal Container |
|-------|--------|-----------------|
| Primary | `bg-primary text-on-primary` | `bg-primary-container text-on-primary-container` |
| Secondary | `bg-secondary text-on-secondary` | `bg-secondary-container text-on-secondary-container` |
| Tertiary | `bg-tertiary text-on-tertiary` | `bg-tertiary-container text-on-tertiary-container` |
| Error | `bg-error text-on-error` | `bg-error-container text-on-error-container` |

---

## Spacing System

### Unit-Based Spacing
Base unit: `4px * --uni-sys-space-scale`

```css
/* Usage: p-4u → 16px at standard, 14px at compact */
gap-2u   /* 8px */
p-4u     /* 16px */
m-6u     /* 24px */
```

### Density Presets
| Preset | Space Scale | Type Scale | Radius Scale |
|--------|-------------|------------|--------------|
| `dense` | 0.75 | 0.85 | 0.75 |
| `compact` | 0.85 | 0.9 | 0.8 |
| `standard` | 1.0 | 1.0 | 0.85 |
| `comfortable` | 1.1 | 1.0 | 1.0 |

---

## Elevation (Shadows)

| Token | Class | Usage |
|-------|-------|-------|
| Level 0 | `shadow-0` | Flat surfaces |
| Level 1 | `shadow-1` | Elevated cards, resting FABs |
| Level 2 | `shadow-2` | Hover/raised states |
| Level 3 | `shadow-3` | Menus, popovers |
| Level 4 | `shadow-4` | Dialogs, navigation drawer |
| Level 5 | `shadow-5` | Sheets, modal overlays |

Default components (buttons, alerts, switches) stay flat and rely on state layers; elevation is reserved for floating surfaces.

---

## Motion Tokens

### Durations
| Token | Class | Value | Usage |
|-------|-------|-------|-------|
| Short | `duration-short` | 100ms | Micro-interactions |
| Snappy | `duration-snappy` | 150ms | Button clicks, hovers |
| Medium | `duration-medium` | 250ms | Transitions |
| Emphasized | `duration-emphasized` | 300ms | Significant state changes |
| Long | `duration-long` | 500ms | Page/layout transitions |

### Easing
| Token | Class | Usage |
|-------|-------|-------|
| Standard | `ease-standard` | Default for all |
| Emphasized | `ease-emphasized` | Important transitions |
| Smooth | `ease-smooth` | Fluid animations |
| In | `ease-in` | Exiting elements |
| Out | `ease-out` | Entering elements |

---

## Border Radius

| Token | Class | Value (at scale 1) |
|-------|-------|-------------------|
| Extra Small | `rounded-xs` | 4px |
| Small | `rounded-sm` | 8px |
| Medium | `rounded-md` | 12px |
| Large | `rounded-lg` | 20px |
| Extra Large | `rounded-xl` | 32px |
| Extra Extra Large | `rounded-2xl` | 48px |
| Full | `rounded-full` | 9999px |

### Radius Themes

Use `data-radius` to switch corner softness without changing components:

- `data-radius="sharp"` → `--uni-sys-radius-scale: 0.75`
- `data-radius="standard"` → `--uni-sys-radius-scale: 1.0`
- `data-radius="soft"` → `--uni-sys-radius-scale: 1.15`

---

## Component Variant Guidelines

### Button Variants
| Variant | Usage |
|---------|-------|
| `filled` | Primary actions, CTAs |
| `tonal` | Secondary actions |
| `outlined` | Tertiary actions |
| `text` | Low-emphasis actions |
| `elevated` | Special emphasis |

### State Layer Opacity
| State | Opacity | Token |
|-------|---------|-------|
| Hover | 8% | `opacity-hover` |
| Focus | 10% | `opacity-focus` |
| Pressed | 10% | `opacity-pressed` |
| Dragged | 16% | `opacity-dragged` |
| Disabled | 38% | `opacity-38` |

---

## Typography Scale

All 15 M3 typography roles are available:

| Role | Class |
|------|-------|
| Display | `text-display-large/medium/small` |
| Headline | `text-headline-large/medium/small` |
| Title | `text-title-large/medium/small` |
| Body | `text-body-large/medium/small` |
| Label | `text-label-large/medium/small` |

---

## Component Patterns

### CVA Structure (shadcn style)
```tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "base-classes...",
  {
    variants: {
      variant: { filled: "...", outlined: "..." },
      size: { sm: "...", md: "...", lg: "..." },
    },
    defaultVariants: { variant: "filled", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
```

### forwardRef Usage
All interactive components should use `forwardRef` for accessibility and ref attachment.

### Ripple Effect
Use the `<Ripple />` component inside interactive elements for M3-compliant touch feedback.
