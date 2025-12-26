# Buttons & Actions

Interactive components for user actions following Material Design 3 specifications.

## Table of Contents

1. [Button](#button)
2. [IconButton](#iconbutton)
3. [FAB (Floating Action Button)](#fab)
4. [SegmentedButton](#segmentedbutton)
5. [Chip](#chip)
6. [Design Tokens](#design-tokens)

---

## M3 Button Specifications

### Common Button (Filled, Tonal, Outlined, Elevated, Text)

| Property | Value | Unisane Token |
|----------|-------|---------------|
| Container height | 40dp | `h-10u` |
| Container shape | Full (stadium) | `rounded-full` |
| Label text | Label Large (14sp) | `text-label-large` |
| Icon size | 18dp | `text-[18px]` or `w-4.5u h-4.5u` |
| Left/Right padding | 24dp | `px-6u` |
| With leading icon - left padding | 16dp | `pl-4u` |
| With leading icon - right padding | 24dp | `pr-6u` |
| Icon-label gap | 8dp | `gap-2u` |
| Minimum width | 48dp | `min-w-12u` |

### State Layer Opacity

| State | Opacity |
|-------|---------|
| Hover | 8% |
| Focus | 12% |
| Pressed | 12% |
| Disabled | 38% (content) |

Sources: [M3 Buttons Specs](https://m3.material.io/components/buttons/specs), [Material Web](https://material-web.dev/components/button/)

---

## Button

Primary action component with five variants per M3 specification.

### File: `components/ui/button.tsx`

```tsx
"use client";

import { type ReactNode, type ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Ripple } from "./ripple";
import { cn } from "@/lib/utils";

/**
 * Material Design 3 Button
 *
 * M3 Spec:
 * - Height: 40dp (standard)
 * - Shape: Full (stadium/pill - corner radius = height/2)
 * - Padding: 24dp horizontal (with icon: 16dp left, 24dp right)
 * - Typography: Label Large (14sp)
 * - Icon size: 18dp
 *
 * @see https://m3.material.io/components/buttons/specs
 */
const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2u rounded-full font-medium transition-all duration-short ease-standard overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-38 disabled:cursor-not-allowed group whitespace-nowrap leading-none select-none",
  {
    variants: {
      variant: {
        // Filled: High emphasis, primary actions
        filled: "bg-primary text-on-primary",
        // Tonal: Medium emphasis, secondary actions
        tonal: "bg-secondary-container text-on-secondary-container",
        // Outlined: Medium emphasis, secondary actions with border
        outlined: "border border-outline text-primary bg-transparent",
        // Text: Low emphasis, tertiary actions
        text: "text-primary bg-transparent",
        // Elevated: Medium emphasis with shadow (use sparingly)
        elevated: "bg-surface-container-low text-primary shadow-1",
      },
      size: {
        sm: "h-8u px-4u text-label-medium",
        md: "h-10u px-6u text-label-large",
        lg: "h-12u px-8u text-label-large",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "filled",
      size = "md",
      disabled = false,
      loading = false,
      icon,
      trailingIcon,
      fullWidth = false,
      className = "",
      type = "button",
      ...props
    },
    ref
  ) => {
    // M3 spec: icon size 18dp = 4.5u
    const iconSizeClass = "w-4.5u h-4.5u";

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          buttonVariants({ variant, size }),
          // Adjust padding when icon is present (M3: 16dp left with icon)
          icon && "pl-4u",
          trailingIcon && "pr-4u",
          fullWidth && "w-full",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {/* State layer - M3 opacity: hover 8%, focus 12%, pressed 12% */}
        <span className="absolute inset-0 pointer-events-none bg-current opacity-0 transition-opacity duration-short group-hover:opacity-8 group-focus-visible:opacity-12 group-active:opacity-12" />

        {/* Ripple effect */}
        <Ripple disabled={disabled || loading} />

        {/* Loading spinner */}
        {loading && (
          <svg
            className={`animate-spin ${iconSizeClass} relative z-10`}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {/* Leading icon */}
        {!loading && icon && (
          <span className={`${iconSizeClass} flex items-center justify-center flex-shrink-0 relative z-10`}>
            {icon}
          </span>
        )}

        {/* Label text */}
        <span className={cn("relative z-10", loading && "opacity-0")}>
          {children}
        </span>

        {/* Trailing icon */}
        {!loading && trailingIcon && (
          <span className={`${iconSizeClass} flex items-center justify-center flex-shrink-0 relative z-10`}>
            {trailingIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
```

### Variants

| Variant | Use Case | Emphasis |
|---------|----------|----------|
| `filled` | Primary actions, CTAs | Highest |
| `tonal` | Important but not primary | Medium-High |
| `elevated` | Actions on patterned backgrounds | Medium |
| `outlined` | Secondary actions | Medium |
| `text` | Tertiary, low-priority actions | Lowest |

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"filled" \| "tonal" \| "outlined" \| "text" \| "elevated"` | `"filled"` | Visual style |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Button size (32dp, 40dp, 48dp) |
| `icon` | `ReactNode` | - | Leading icon (18dp) |
| `trailingIcon` | `ReactNode` | - | Trailing icon (18dp) |
| `loading` | `boolean` | `false` | Show loading spinner |
| `fullWidth` | `boolean` | `false` | Expand to container width |
| `disabled` | `boolean` | `false` | Disable interaction |

### Usage Examples

```tsx
// Filled - Primary action (max 1 per view)
<Button variant="filled">Save Changes</Button>

// Tonal - Important secondary
<Button variant="tonal">Learn More</Button>

// Outlined - Standard secondary
<Button variant="outlined">Cancel</Button>

// Text - Low emphasis
<Button variant="text">Skip</Button>

// Elevated - On patterned surfaces
<Button variant="elevated">Create</Button>

// With leading icon (M3: 16dp left padding, 24dp right)
<Button variant="filled" icon={<Icon name="add" />}>
  Add Item
</Button>

// With trailing icon
<Button variant="tonal" trailingIcon={<Icon name="arrow_forward" />}>
  Continue
</Button>

// Loading state
<Button variant="filled" loading>
  Saving...
</Button>

// Sizes
<Button size="sm">Small (32dp)</Button>
<Button size="md">Medium (40dp)</Button>
<Button size="lg">Large (48dp)</Button>
```

---

## IconButton

Compact button for icon-only actions.

### M3 Icon Button Specifications

| Property | Value | Unisane Token |
|----------|-------|---------------|
| Container size | 40dp x 40dp | `w-10u h-10u` |
| Container shape | Full (circular) | `rounded-full` |
| Icon size | 24dp | `text-[24px]` |
| Touch target | 48dp | Built-in |
| State layer size | 40dp | Same as container |

### File: `components/ui/icon-button.tsx`

```tsx
"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Ripple } from "./ripple";
import { cn } from "@/lib/utils";

/**
 * Material Design 3 Icon Button
 *
 * M3 Spec:
 * - Size: 40dp x 40dp
 * - Shape: Full (circular)
 * - Icon size: 24dp
 * - Touch target: 48dp
 *
 * @see https://m3.material.io/components/icon-buttons/specs
 */
const iconButtonVariants = cva(
  "relative inline-flex items-center justify-center rounded-full transition-all duration-short ease-standard focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-38 disabled:cursor-not-allowed overflow-hidden group",
  {
    variants: {
      variant: {
        // Standard: No container, icon only
        standard: "text-on-surface-variant",
        // Filled: Solid background
        filled: "bg-primary text-on-primary",
        // Tonal: Container with secondary color
        tonal: "bg-secondary-container text-on-secondary-container",
        // Outlined: Border only
        outlined: "border border-outline text-on-surface-variant",
      },
      size: {
        sm: "w-8u h-8u",
        md: "w-10u h-10u",
        lg: "w-12u h-12u",
      },
    },
    defaultVariants: {
      variant: "standard",
      size: "md",
    },
  }
);

// Icon sizes matching M3 spec
const iconSizes = {
  sm: "text-[20px]",
  md: "text-[24px]",
  lg: "text-[24px]",
};

interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  ariaLabel: string; // Required for accessibility
  selected?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = "standard",
      size = "md",
      ariaLabel,
      selected = false,
      className = "",
      disabled = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        aria-pressed={selected}
        disabled={disabled}
        className={cn(
          iconButtonVariants({ variant, size }),
          iconSizes[size || "md"],
          className
        )}
        {...props}
      >
        {/* State layer */}
        <span className="absolute inset-0 pointer-events-none bg-current opacity-0 transition-opacity duration-short group-hover:opacity-8 group-focus-visible:opacity-12 group-active:opacity-12" />

        {/* Ripple effect - centered for icon buttons */}
        <Ripple disabled={disabled} center />

        {/* Icon content */}
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
```

### Usage Examples

```tsx
// Standard (most common)
<IconButton variant="standard" ariaLabel="Menu">
  <Icon name="menu" />
</IconButton>

// Filled (high emphasis)
<IconButton variant="filled" ariaLabel="Favorite">
  <Icon name="favorite" />
</IconButton>

// Tonal (medium emphasis)
<IconButton variant="tonal" ariaLabel="Share">
  <Icon name="share" />
</IconButton>

// Outlined (medium emphasis)
<IconButton variant="outlined" ariaLabel="Edit">
  <Icon name="edit" />
</IconButton>

// Toggle state (selected/unselected)
<IconButton
  variant={isFavorite ? "filled" : "standard"}
  ariaLabel={isFavorite ? "Remove from favorites" : "Add to favorites"}
  selected={isFavorite}
  onClick={() => setIsFavorite(!isFavorite)}
>
  <Icon name={isFavorite ? "favorite" : "favorite_border"} />
</IconButton>
```

---

## FAB (Floating Action Button)

Prominent button for the primary action on a screen.

### M3 FAB Specifications

| Size | Container | Shape | Icon Size |
|------|-----------|-------|-----------|
| Small | 40dp | 12dp radius | 24dp |
| Standard | 56dp | 16dp radius | 24dp |
| Large | 96dp | 28dp radius | 36dp |
| Extended | 56dp height | 16dp radius | 24dp |

**Note:** Small FAB is deprecated in M3 but supported for backwards compatibility.

### File: `components/ui/fab.tsx`

```tsx
"use client";

import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Ripple } from "./ripple";
import { cn } from "@/lib/utils";

/**
 * Material Design 3 Floating Action Button
 *
 * M3 Spec:
 * - Standard: 56dp, 16dp radius, 24dp icon
 * - Large: 96dp, 28dp radius, 36dp icon
 * - Extended: 56dp height, auto width
 * - Elevation: Level 3 (6dp)
 *
 * @see https://m3.material.io/components/floating-action-button/specs
 */
const fabVariants = cva(
  "relative inline-flex items-center justify-center font-medium transition-all duration-emphasized ease-standard focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-38 disabled:cursor-not-allowed overflow-hidden group shadow-3 hover:shadow-4 active:shadow-3",
  {
    variants: {
      variant: {
        // Primary: Uses primary container colors (default)
        primary: "bg-primary-container text-on-primary-container",
        // Secondary: Uses secondary container colors
        secondary: "bg-secondary-container text-on-secondary-container",
        // Tertiary: Uses tertiary container colors
        tertiary: "bg-tertiary-container text-on-tertiary-container",
        // Surface: Uses surface colors (lowest emphasis)
        surface: "bg-surface-container-high text-primary",
      },
      size: {
        // Small: 40dp (deprecated but supported)
        small: "w-10u h-10u rounded-md text-[24px]",
        // Standard: 56dp (default)
        standard: "w-14u h-14u rounded-lg text-[24px]",
        // Large: 96dp
        large: "w-24u h-24u rounded-xl text-[36px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "standard",
    },
  }
);

interface FABProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof fabVariants> {
  icon: ReactNode;
  label?: string; // If provided, renders as Extended FAB
  lowered?: boolean; // Reduce elevation (for scrolling states)
}

export const FAB = forwardRef<HTMLButtonElement, FABProps>(
  (
    {
      variant = "primary",
      size = "standard",
      icon,
      label,
      lowered = false,
      className = "",
      disabled = false,
      ...props
    },
    ref
  ) => {
    const isExtended = !!label;

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          fabVariants({ variant, size: isExtended ? undefined : size }),
          // Extended FAB styling
          isExtended && "h-14u px-4u rounded-lg gap-2u text-label-large w-auto",
          // Lowered elevation
          lowered && "shadow-1 hover:shadow-2",
          className
        )}
        {...props}
      >
        {/* State layer */}
        <span className="absolute inset-0 pointer-events-none bg-current opacity-0 transition-opacity duration-emphasized group-hover:opacity-8 group-focus-visible:opacity-12 group-active:opacity-12" />

        {/* Ripple effect */}
        <Ripple disabled={disabled} center={!isExtended} />

        {/* Icon */}
        <span className="relative z-10 flex items-center justify-center">
          {icon}
        </span>

        {/* Label (Extended FAB only) */}
        {label && (
          <span className="relative z-10 text-label-large font-medium">
            {label}
          </span>
        )}
      </button>
    );
  }
);

FAB.displayName = "FAB";
```

### Usage Examples

```tsx
// Standard FAB (56dp)
<FAB
  variant="primary"
  icon={<Icon name="add" />}
  aria-label="Create new"
/>

// Extended FAB with label
<FAB
  variant="primary"
  icon={<Icon name="edit" />}
  label="Compose"
/>

// Large FAB (96dp)
<FAB
  variant="primary"
  size="large"
  icon={<Icon name="add" />}
  aria-label="Create new"
/>

// Color variants
<FAB variant="secondary" icon={<Icon name="share" />} aria-label="Share" />
<FAB variant="tertiary" icon={<Icon name="favorite" />} aria-label="Favorite" />
<FAB variant="surface" icon={<Icon name="edit" />} aria-label="Edit" />

// Lowered FAB (for scroll behavior)
<FAB
  variant="primary"
  icon={<Icon name="add" />}
  lowered={isScrolled}
  aria-label="Create new"
/>

// Fixed positioning (common pattern)
<FAB
  variant="primary"
  icon={<Icon name="add" />}
  className="fixed bottom-6u right-6u"
  aria-label="Create new"
/>
```

---

## SegmentedButton

Single or multi-select button group for filtering or switching views.

### M3 Segmented Button Specifications

| Property | Value | Unisane Token |
|----------|-------|---------------|
| Container height | 40dp | `h-10u` |
| Container shape | Full (stadium) | `rounded-full` |
| Segment min width | 48dp | `min-w-12u` |
| Label text | Label Large | `text-label-large` |
| Icon size | 18dp | `text-[18px]` |
| Horizontal padding | 12-24dp | `px-3u` to `px-6u` |
| Border width | 1dp | `border` |

### File: `components/ui/segmented-button.tsx`

```tsx
"use client";

import { forwardRef, ReactNode } from "react";
import { cva } from "class-variance-authority";
import { Ripple } from "./ripple";
import { cn } from "@/lib/utils";

const segmentVariants = cva(
  "relative flex-1 inline-flex items-center justify-center gap-2u h-10u px-4u min-w-12u text-label-large font-medium transition-all duration-short ease-standard focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary overflow-hidden group",
  {
    variants: {
      selected: {
        true: "bg-secondary-container text-on-secondary-container",
        false: "bg-transparent text-on-surface",
      },
      position: {
        first: "rounded-l-full",
        middle: "",
        last: "rounded-r-full",
        only: "rounded-full",
      },
    },
    defaultVariants: {
      selected: false,
      position: "middle",
    },
  }
);

interface SegmentedButtonOption {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface SegmentedButtonProps {
  options: SegmentedButtonOption[];
  value: string | string[]; // Single or multi-select
  onChange: (value: string | string[]) => void;
  multiSelect?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export const SegmentedButton = forwardRef<HTMLDivElement, SegmentedButtonProps>(
  ({ options, value, onChange, multiSelect = false, fullWidth = false, className = "" }, ref) => {
    const selectedValues = Array.isArray(value) ? value : [value];

    const handleClick = (optionValue: string) => {
      if (multiSelect) {
        const newValue = selectedValues.includes(optionValue)
          ? selectedValues.filter((v) => v !== optionValue)
          : [...selectedValues, optionValue];
        onChange(newValue);
      } else {
        onChange(optionValue);
      }
    };

    const getPosition = (index: number): "first" | "middle" | "last" | "only" => {
      if (options.length === 1) return "only";
      if (index === 0) return "first";
      if (index === options.length - 1) return "last";
      return "middle";
    };

    return (
      <div
        ref={ref}
        role="group"
        className={cn(
          "inline-flex border border-outline rounded-full",
          fullWidth && "w-full",
          className
        )}
      >
        {options.map((option, index) => {
          const isSelected = selectedValues.includes(option.value);
          const position = getPosition(index);

          return (
            <button
              key={option.value}
              type="button"
              role={multiSelect ? "checkbox" : "radio"}
              aria-checked={isSelected}
              disabled={option.disabled}
              onClick={() => handleClick(option.value)}
              className={cn(
                segmentVariants({ selected: isSelected, position }),
                index !== 0 && "border-l border-outline",
                option.disabled && "opacity-38 cursor-not-allowed"
              )}
            >
              {/* State layer */}
              {!isSelected && (
                <span className="absolute inset-0 pointer-events-none bg-on-surface opacity-0 transition-opacity duration-short group-hover:opacity-8 group-focus-visible:opacity-12 group-active:opacity-12" />
              )}

              {/* Ripple effect */}
              <Ripple disabled={option.disabled} />

              {/* Selected checkmark (M3 pattern) */}
              {isSelected && (
                <span className="relative z-10 w-4.5u h-4.5u flex items-center justify-center text-[18px]">
                  <Icon name="check" />
                </span>
              )}

              {/* Icon */}
              {option.icon && !isSelected && (
                <span className="relative z-10 w-4.5u h-4.5u flex items-center justify-center text-[18px]">
                  {option.icon}
                </span>
              )}

              {/* Label */}
              <span className="relative z-10">{option.label}</span>
            </button>
          );
        })}
      </div>
    );
  }
);

SegmentedButton.displayName = "SegmentedButton";
```

### Usage Examples

```tsx
// Single select (default)
<SegmentedButton
  options={[
    { value: "day", label: "Day" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
  ]}
  value={view}
  onChange={setView}
/>

// With icons
<SegmentedButton
  options={[
    { value: "list", label: "List", icon: <Icon name="list" /> },
    { value: "grid", label: "Grid", icon: <Icon name="grid_view" /> },
  ]}
  value={layout}
  onChange={setLayout}
/>

// Multi-select
<SegmentedButton
  options={[
    { value: "bold", label: "B", icon: <Icon name="format_bold" /> },
    { value: "italic", label: "I", icon: <Icon name="format_italic" /> },
    { value: "underline", label: "U", icon: <Icon name="format_underlined" /> },
  ]}
  value={formatting}
  onChange={setFormatting}
  multiSelect
/>

// Full width
<SegmentedButton
  options={[
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
  ]}
  value={filter}
  onChange={setFilter}
  fullWidth
/>
```

---

## Chip

Compact elements for input, attributes, or actions.

### M3 Chip Specifications

| Property | Value | Unisane Token |
|----------|-------|---------------|
| Container height | 32dp | `h-8u` |
| Container shape | 8dp radius | `rounded-sm` |
| Label text | Label Large | `text-label-large` |
| Icon size | 18dp | `text-[18px]` |
| Left padding | 16dp (8dp with avatar) | `pl-4u` |
| Right padding | 16dp (8dp with trailing icon) | `pr-4u` |
| Icon-label gap | 8dp | `gap-2u` |

### Chip Types

| Type | Purpose |
|------|---------|
| Assist | Represent smart actions |
| Filter | Filter content |
| Input | Represent user input |
| Suggestion | Dynamically generated suggestions |

See [06-selection.md](./06-selection.md) for full Chip documentation.

---

## Design Tokens

### Spacing Scale (with density)

Our spacing uses an industrial unit system where `1u = 4dp × density scale`:

| Token | Standard | Compact | Comfortable |
|-------|----------|---------|-------------|
| `1u` | 4dp | 3.5dp | 4.4dp |
| `2u` | 8dp | 7dp | 8.8dp |
| `4u` | 16dp | 14dp | 17.6dp |
| `6u` | 24dp | 21dp | 26.4dp |
| `8u` | 32dp | 28dp | 35.2dp |
| `10u` | 40dp | 35dp | 44dp |

### Button Sizing

| Size | Height | Padding | Use Case |
|------|--------|---------|----------|
| `sm` | 32dp (8u) | 16dp (4u) | Compact UIs, toolbars |
| `md` | 40dp (10u) | 24dp (6u) | Standard (M3 default) |
| `lg` | 48dp (12u) | 32dp (8u) | Touch-first, accessibility |

### State Layer Colors

All interactive elements use the same state layer pattern:

```css
/* State layer opacity values */
--opacity-hover: 0.08;    /* 8% */
--opacity-focus: 0.12;    /* 12% */
--opacity-pressed: 0.12;  /* 12% */
--opacity-disabled: 0.38; /* 38% for content */
```

---

## Best Practices

### Button Hierarchy

1. **Filled**: Primary action (max 1 per screen region)
2. **Tonal/Elevated**: Important secondary actions
3. **Outlined**: Medium emphasis secondary actions
4. **Text**: Low-priority, tertiary actions

### FAB Guidelines

- One FAB per screen (represents the most important action)
- Position in bottom-right corner
- Hide or shrink on scroll if it obstructs content
- Use Extended FAB when action needs clarification

### Accessibility

```tsx
// Always provide aria-label for icon buttons
<IconButton ariaLabel="Close dialog">
  <Icon name="close" />
</IconButton>

// Announce loading states
<Button variant="filled" loading aria-busy="true">
  <span className="sr-only">Saving, please wait</span>
  Saving...
</Button>

// Toggle buttons should use aria-pressed
<IconButton
  ariaLabel="Favorite"
  aria-pressed={isFavorite}
  onClick={() => setIsFavorite(!isFavorite)}
>
  <Icon name={isFavorite ? "favorite" : "favorite_border"} />
</IconButton>
```

### Touch Targets

All interactive elements maintain a minimum 48dp touch target:

```tsx
// IconButton: 40dp visible, 48dp touch target (built-in)
<IconButton variant="standard" ariaLabel="Menu">
  <Icon name="menu" />
</IconButton>

// Small buttons should have adequate spacing
<div className="flex gap-2u">
  <Button size="sm">Option 1</Button>
  <Button size="sm">Option 2</Button>
</div>
```

---

## Related Components

- [Chip](./06-selection.md#chip) - For filtering and input
- [Ripple](./02-utilities.md#ripple) - Touch feedback
- [Icon](./02-utilities.md#icon) - Material Symbols integration

---

**Sources:**
- [M3 Buttons Guidelines](https://m3.material.io/components/buttons/guidelines)
- [M3 Buttons Specs](https://m3.material.io/components/buttons/specs)
- [M3 Icon Buttons Specs](https://m3.material.io/components/icon-buttons/specs)
- [M3 FAB Specs](https://m3.material.io/components/floating-action-button/specs)
- [M3 Segmented Button Specs](https://m3.material.io/components/segmented-buttons/specs)
- [Material Web Buttons](https://material-web.dev/components/button/)
