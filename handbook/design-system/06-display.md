# Display

Components for presenting content and data.

## Table of Contents

1. [Typography](#typography)
2. [List](#list)
3. [Badge](#badge)
4. [Divider](#divider)

---

## Typography

Text components following Material Design 3 type scale.

### M3 Specification

| Role | Size | Font Size | Weight | Line Height |
|------|------|-----------|--------|-------------|
| Display | Large | 57sp | Regular (400) | 64sp |
| Display | Medium | 45sp | Regular (400) | 52sp |
| Display | Small | 36sp | Regular (400) | 44sp |
| Headline | Large | 32sp | Regular (400) | 40sp |
| Headline | Medium | 28sp | Regular (400) | 36sp |
| Headline | Small | 24sp | Regular (400) | 32sp |
| Title | Large | 22sp | Regular (400) | 28sp |
| Title | Medium | 16sp | Medium (500) | 24sp |
| Title | Small | 14sp | Medium (500) | 20sp |
| Body | Large | 16sp | Regular (400) | 24sp |
| Body | Medium | 14sp | Regular (400) | 20sp |
| Body | Small | 12sp | Regular (400) | 16sp |
| Label | Large | 14sp | Medium (500) | 20sp |
| Label | Medium | 12sp | Medium (500) | 16sp |
| Label | Small | 11sp | Medium (500) | 16sp |

> **Source**: [M3 Typography](https://m3.material.io/styles/typography/applying-type)

### Unisane Token Mapping

```
Typography classes use Tailwind's text-* utilities:
text-display-large  → Display Large (57sp)
text-display-medium → Display Medium (45sp)
text-display-small  → Display Small (36sp)
text-headline-large → Headline Large (32sp)
text-headline-medium → Headline Medium (28sp)
text-headline-small → Headline Small (24sp)
text-title-large    → Title Large (22sp)
text-title-medium   → Title Medium (16sp)
text-title-small    → Title Small (14sp)
text-body-large     → Body Large (16sp)
text-body-medium    → Body Medium (14sp)
text-body-small     → Body Small (12sp)
text-label-large    → Label Large (14sp)
text-label-medium   → Label Medium (12sp)
text-label-small    → Label Small (11sp)

Font weights:
font-normal → Regular (400)
font-medium → Medium (500)
```

### Usage Guidelines

| Role | Usage |
|------|-------|
| Display | Hero sections, splash screens, short impactful text |
| Headline | Major section headings, prominent titles |
| Title | Dividing secondary content, card titles, dialog titles |
| Body | Long-form text, paragraphs, descriptions |
| Label | Component text (buttons, chips, navigation), captions |

### File: `components/ui/typography.tsx`

```tsx
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

type TypographyVariant =
  | "display-large"
  | "display-medium"
  | "display-small"
  | "headline-large"
  | "headline-medium"
  | "headline-small"
  | "title-large"
  | "title-medium"
  | "title-small"
  | "body-large"
  | "body-medium"
  | "body-small"
  | "label-large"
  | "label-medium"
  | "label-small";

const typographyVariants = cva("", {
  variants: {
    variant: {
      "display-large": "text-display-large font-normal",
      "display-medium": "text-display-medium font-normal",
      "display-small": "text-display-small font-normal",
      "headline-large": "text-headline-large font-normal",
      "headline-medium": "text-headline-medium font-normal",
      "headline-small": "text-headline-small font-normal",
      "title-large": "text-title-large font-normal",
      "title-medium": "text-title-medium font-medium",
      "title-small": "text-title-small font-medium",
      "body-large": "text-body-large font-normal",
      "body-medium": "text-body-medium font-normal",
      "body-small": "text-body-small font-normal",
      "label-large": "text-label-large font-medium",
      "label-medium": "text-label-medium font-medium",
      "label-small": "text-label-small font-medium",
    },
    color: {
      default: "text-on-surface",
      primary: "text-primary",
      secondary: "text-secondary",
      tertiary: "text-tertiary",
      error: "text-error",
      muted: "text-on-surface-variant",
    },
  },
  defaultVariants: {
    variant: "body-medium",
    color: "default",
  },
});

interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  as?: keyof JSX.IntrinsicElements;
}

const defaultTags: Record<TypographyVariant, keyof JSX.IntrinsicElements> = {
  "display-large": "h1",
  "display-medium": "h1",
  "display-small": "h1",
  "headline-large": "h2",
  "headline-medium": "h2",
  "headline-small": "h3",
  "title-large": "h3",
  "title-medium": "h4",
  "title-small": "h5",
  "body-large": "p",
  "body-medium": "p",
  "body-small": "p",
  "label-large": "span",
  "label-medium": "span",
  "label-small": "span",
};

export const Typography = forwardRef<HTMLElement, TypographyProps>(
  ({ variant = "body-medium", as, color = "default", className, children, ...props }, ref) => {
    const Component = as || defaultTags[variant];

    return (
      <Component
        ref={ref as any}
        className={cn(typographyVariants({ variant, color }), className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Typography.displayName = "Typography";
```

### Usage Example

```tsx
<Typography variant="display-large">Large Display</Typography>
<Typography variant="headline-medium" as="h1">Page Title</Typography>
<Typography variant="title-large" color="primary">Section Heading</Typography>
<Typography variant="body-medium">
  This is body text using the Material Design 3 type scale.
</Typography>
<Typography variant="label-small" color="muted">Helper text</Typography>
```

---

## List

Display collections of items with leading/trailing elements.

### M3 Specification

| Property | One-line | Two-line | Three-line |
|----------|----------|----------|------------|
| Min Height | 56dp | 72dp | 88dp |
| Padding Horizontal | 16dp | 16dp | 16dp |
| Padding Vertical | 8dp | 8dp | 12dp |
| Leading Element Width | 24dp (icon) / 40dp (avatar) | 24dp / 40dp | 24dp / 40dp |
| Leading Element Gap | 16dp | 16dp | 16dp |
| Trailing Element Gap | 16dp | 16dp | 16dp |
| Headline Typography | Body Large | Body Large | Body Large |
| Supporting Text Typography | — | Body Medium | Body Medium |
| Overline Typography | — | Label Small | Label Small |

| State | Opacity |
|-------|---------|
| Hover | 8% |
| Focus | 12% |
| Pressed | 12% |
| Disabled | 38% opacity on content |

> **Source**: [M3 Lists](https://m3.material.io/components/lists/specs)

### Unisane Token Mapping

```
List Item Heights:
56dp = h-14u (one-line)
72dp = h-18u (two-line)
88dp = h-22u (three-line)

Spacing:
16dp padding = px-4u
8dp vertical padding = py-2u
16dp gap = gap-4u

Leading Elements:
24dp icon = w-6u h-6u
40dp avatar = w-10u h-10u

State Layers:
group-hover:opacity-8
group-focus-visible:opacity-12
group-active:opacity-12
```

### File: `components/ui/list.tsx`

```tsx
"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Ripple } from "./ripple";
import { cn } from "@/lib/utils";

const listVariants = cva("", {
  variants: {
    dense: {
      true: "py-1u",
      false: "py-2u",
    },
  },
  defaultVariants: {
    dense: false,
  },
});

interface ListProps
  extends React.HTMLAttributes<HTMLUListElement>,
    VariantProps<typeof listVariants> {}

export const List = forwardRef<HTMLUListElement, ListProps>(
  ({ dense = false, className, children, ...props }, ref) => {
    return (
      <ul
        ref={ref}
        className={cn(listVariants({ dense }), className)}
        {...props}
      >
        {children}
      </ul>
    );
  }
);

List.displayName = "List";

// List Item
const listItemVariants = cva(
  "flex items-center gap-4u px-4u min-h-14u py-2u transition-colors duration-short relative overflow-hidden group",
  {
    variants: {
      interactive: {
        true: "cursor-pointer",
        false: "",
      },
      selected: {
        true: "bg-secondary-container text-on-secondary-container",
        false: "",
      },
      disabled: {
        true: "opacity-38 pointer-events-none",
        false: "",
      },
    },
    defaultVariants: {
      interactive: false,
      selected: false,
      disabled: false,
    },
  }
);

interface ListItemProps
  extends React.LiHTMLAttributes<HTMLLIElement>,
    VariantProps<typeof listItemVariants> {
  leadingContent?: React.ReactNode;
  trailingContent?: React.ReactNode;
  overline?: string;
  headline?: string;
  supportingText?: string;
}

export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(
  (
    {
      interactive = false,
      selected = false,
      disabled = false,
      leadingContent,
      trailingContent,
      overline,
      headline,
      supportingText,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const content = children || (
      <>
        {/* Leading content - 24dp for icons */}
        {leadingContent && (
          <div className="flex-shrink-0 w-6u h-6u flex items-center justify-center text-on-surface-variant relative z-10">
            {leadingContent}
          </div>
        )}

        {/* Text content */}
        <div className="flex-1 min-w-0 py-2u relative z-10">
          {overline && (
            <div className="text-label-small text-on-surface-variant mb-0.5u">
              {overline}
            </div>
          )}
          {headline && (
            <div className="text-body-large text-on-surface truncate">
              {headline}
            </div>
          )}
          {supportingText && (
            <div className="text-body-medium text-on-surface-variant mt-1u line-clamp-2">
              {supportingText}
            </div>
          )}
        </div>

        {/* Trailing content */}
        {trailingContent && (
          <div className="flex-shrink-0 text-on-surface-variant relative z-10">
            {trailingContent}
          </div>
        )}
      </>
    );

    return (
      <li
        ref={ref}
        className={cn(listItemVariants({ interactive, selected, disabled }), className)}
        {...props}
      >
        {/* State layer for interactive items */}
        {interactive && !selected && (
          <span className="absolute inset-0 pointer-events-none bg-on-surface opacity-0 transition-opacity duration-short group-hover:opacity-8 group-focus-visible:opacity-12 group-active:opacity-12 z-0" />
        )}

        {/* Ripple effect for interactive items */}
        {interactive && <Ripple disabled={disabled} />}

        {content}
      </li>
    );
  }
);

ListItem.displayName = "ListItem";

// List Divider - 1dp thickness per M3 spec
export const ListDivider = ({ className }: { className?: string }) => (
  <li className={cn("h-px bg-outline-variant mx-4u", className)} role="separator" />
);

// List Subheader
export const ListSubheader = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <li className={cn("px-4u py-2u text-label-small font-medium text-on-surface-variant", className)}>
    {children}
  </li>
);
```

### Usage Example

```tsx
<List>
  <ListSubheader>Recent</ListSubheader>

  <ListItem
    interactive
    selected
    leadingContent={<span className="material-symbols-outlined">folder</span>}
    headline="Work Documents"
    supportingText="Last modified 2 hours ago"
    trailingContent={<span className="material-symbols-outlined">chevron_right</span>}
  />

  <ListItem
    interactive
    leadingContent={<span className="material-symbols-outlined">image</span>}
    headline="Photos"
    supportingText="1,234 items"
  />

  <ListDivider />

  <ListSubheader>Starred</ListSubheader>

  <ListItem
    interactive
    leadingContent={<span className="material-symbols-outlined fill">star</span>}
    headline="Important Project"
    overline="Starred"
    supportingText="Contains critical files and documentation"
    trailingContent={<Badge variant="error">3</Badge>}
  />
</List>
```

---

## Badge

Status indicators and notification counts.

### M3 Specification

| Property | Small (Dot) | Large (Label) |
|----------|-------------|---------------|
| Container Height | 6dp | 16dp |
| Container Width | 6dp | min 16dp |
| Shape | Full (circle) | Stadium (full) |
| Typography | — | Label Small |
| Horizontal Padding | 0dp | 4dp |

| Placement | Offset |
|-----------|--------|
| On icon | -4dp from top-right corner |
| On navigation | Aligned with icon center |

> **Source**: [M3 Badges](https://m3.material.io/components/badges/specs)

### Unisane Token Mapping

```
Small Badge (dot):
6dp = w-1.5u h-1.5u (1.5 × 4 = 6dp)
Shape: rounded-full

Large Badge (with label):
16dp height = h-4u
min-width 16dp = min-w-4u
Horizontal padding 4dp = px-1u
Typography: text-label-small
Shape: rounded-full (stadium)

Colors:
Default: bg-error text-on-error
Numeric overflow: shows "99+" for > 99
```

### File: `components/ui/badge.tsx`

```tsx
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center font-medium rounded-full",
  {
    variants: {
      variant: {
        default: "bg-error text-on-error",
        primary: "bg-primary text-on-primary",
        secondary: "bg-secondary text-on-secondary",
        tertiary: "bg-tertiary text-on-tertiary",
        surface: "bg-surface-container-highest text-on-surface",
      },
      size: {
        // Small dot badge - 6dp
        dot: "w-1.5u h-1.5u",
        // Large label badge - 16dp height
        label: "h-4u min-w-4u px-1u text-label-small",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "label",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  count?: number;
  max?: number;
  showZero?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = "default",
      size = "label",
      count,
      max = 99,
      showZero = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    // Handle numeric badges
    if (count !== undefined) {
      if (count === 0 && !showZero) {
        return null;
      }
      const displayCount = count > max ? `${max}+` : count.toString();
      return (
        <span
          ref={ref}
          className={cn(badgeVariants({ variant, size: "label" }), className)}
          {...props}
        >
          {displayCount}
        </span>
      );
    }

    // Handle dot or custom content
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {size !== "dot" && children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

// Badge wrapper for positioning on icons
interface BadgeWrapperProps {
  children: React.ReactNode;
  badge: React.ReactNode;
  className?: string;
}

export const BadgeWrapper = ({ children, badge, className }: BadgeWrapperProps) => (
  <div className={cn("relative inline-flex", className)}>
    {children}
    <div className="absolute -top-1u -right-1u">
      {badge}
    </div>
  </div>
);
```

### Usage Example

```tsx
// Dot badge (notification indicator)
<Badge size="dot" />

// Numeric badge
<Badge count={5} />

// Large count with max
<Badge count={150} max={99} /> {/* Shows "99+" */}

// Different colors
<Badge variant="primary" count={3} />
<Badge variant="secondary">New</Badge>

// Badge on icon
<BadgeWrapper badge={<Badge count={3} />}>
  <span className="material-symbols-outlined text-6u">notifications</span>
</BadgeWrapper>

// Dot indicator on icon
<BadgeWrapper badge={<Badge size="dot" />}>
  <span className="material-symbols-outlined text-6u">mail</span>
</BadgeWrapper>
```

---

## Divider

Visual separator between content sections.

### M3 Specification

| Property | Value |
|----------|-------|
| Thickness | 1dp |
| Color | `outline-variant` (on-surface at 12% opacity) |
| Inset Start | 0dp (full-bleed) or 16dp (inset) |
| Inset End | 0dp (full-bleed) or 16dp (inset) |

| Variant | Description |
|---------|-------------|
| Full-bleed | Extends edge to edge |
| Inset | Indented on leading side (for lists with leading content) |
| Middle | Indented on both sides |

> **Source**: [M3 Dividers](https://m3.material.io/components/divider/specs)

### Unisane Token Mapping

```
Thickness:
1dp = border-t (CSS border)

Insets:
16dp inset = mx-4u (full inset) or ml-4u (leading inset)
72dp leading inset (for lists with avatars) = ml-18u

Color:
outline-variant = border-outline-variant
```

### File: `components/ui/divider.tsx`

```tsx
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const dividerVariants = cva("bg-outline-variant", {
  variants: {
    orientation: {
      horizontal: "h-px w-full",
      vertical: "w-px h-full",
    },
    inset: {
      none: "",
      start: "",     // Leading inset
      middle: "",    // Both sides inset
      full: "",      // Full-bleed (same as none)
    },
  },
  compoundVariants: [
    // Horizontal insets
    { orientation: "horizontal", inset: "start", className: "ml-4u" },
    { orientation: "horizontal", inset: "middle", className: "mx-4u" },
    // Vertical insets
    { orientation: "vertical", inset: "start", className: "mt-4u" },
    { orientation: "vertical", inset: "middle", className: "my-4u" },
  ],
  defaultVariants: {
    orientation: "horizontal",
    inset: "none",
  },
});

interface DividerProps
  extends React.HTMLAttributes<HTMLHRElement>,
    VariantProps<typeof dividerVariants> {
  withText?: boolean;
}

export const Divider = forwardRef<HTMLHRElement, DividerProps>(
  (
    {
      orientation = "horizontal",
      inset = "none",
      withText = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    // Divider with centered text (only for horizontal)
    if (withText && children && orientation === "horizontal") {
      return (
        <div
          className={cn(
            "flex items-center gap-4u",
            inset === "middle" && "mx-4u",
            className
          )}
          role="separator"
        >
          <div className="flex-1 h-px bg-outline-variant" />
          <span className="text-label-medium text-on-surface-variant">
            {children}
          </span>
          <div className="flex-1 h-px bg-outline-variant" />
        </div>
      );
    }

    // Standard divider - use div instead of hr for better styling control
    return (
      <div
        ref={ref as any}
        role="separator"
        aria-orientation={orientation}
        className={cn(dividerVariants({ orientation, inset }), className)}
        {...props}
      />
    );
  }
);

Divider.displayName = "Divider";
```

### Usage Example

```tsx
// Full-bleed horizontal divider
<Divider />

// Inset divider (for lists)
<Divider inset="start" />

// Middle inset (both sides)
<Divider inset="middle" />

// Vertical divider
<div className="flex items-center h-12u gap-4u">
  <Button variant="text">Action 1</Button>
  <Divider orientation="vertical" />
  <Button variant="text">Action 2</Button>
</div>

// Divider with text
<Divider withText>OR</Divider>
```

---

## Accessibility

### Typography

- Use semantic HTML elements (`h1`-`h6`, `p`, `span`)
- Maintain proper heading hierarchy (don't skip levels)
- Ensure sufficient color contrast (4.5:1 for body text, 3:1 for large text)

### Lists

- Use `<ul>` for unordered lists, `<ol>` for ordered
- Interactive items should have `role="button"` or be actual buttons
- Selected items should use `aria-selected="true"`
- Disabled items should have `aria-disabled="true"`

### Badges

- Numeric badges should be announced to screen readers
- Use `aria-label` for context: `aria-label="3 notifications"`
- Dot badges are decorative and can be hidden with `aria-hidden="true"`

### Dividers

- Use `role="separator"` for semantic dividers
- Decorative dividers can use `aria-hidden="true"`
- Vertical dividers should have `aria-orientation="vertical"`
