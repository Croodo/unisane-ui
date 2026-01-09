# SaasKit Component Guidelines

This document defines the standards for writing saaskit components using @unisane/ui to ensure consistency with Material Design 3 patterns.

## Import Pattern

Always use **direct file imports** from @unisane/ui:

```typescript
// CORRECT - Direct file imports
import { cn } from "@unisane/ui/lib/utils";
import { Button } from "@unisane/ui/components/button";
import { Card } from "@unisane/ui/components/card";
import { Text } from "@unisane/ui/primitives/text";
import { Surface } from "@unisane/ui/primitives/surface";
import { Icon } from "@unisane/ui/primitives/icon";

// Folder-based components (sidebar, navigation, data-table, command)
import {
  SidebarProvider,
  useSidebar,
  Sidebar,
  SidebarRail,
  SidebarDrawer,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarNavItem,
} from "@unisane/ui/components/sidebar";

import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@unisane/ui/components/command";

import { StatCard, StatGrid } from "@unisane/ui/components/stat-card";
import { toast, Toaster } from "@unisane/ui/components/toast";

// INCORRECT - Barrel imports
import { Button, Card, Text } from "@unisane/ui";

// INCORRECT - Local copies (these have been deleted)
import { SidebarTrigger } from "@/src/components/ui/sidebar";
import { Command } from "@/src/components/ui/command";
import { toast } from "sonner";
```

## Core Primitives

### Text Component

Use `Text` for all typography instead of raw HTML tags or Tailwind text classes:

```tsx
import { Text } from "@unisane/ui/primitives/text";

// CORRECT - Using Text component
<Text variant="titleLarge" weight="semibold">Page Title</Text>
<Text variant="bodyMedium" color="onSurfaceVariant">Description text</Text>
<Text variant="labelSmall" color="error">Error message</Text>

// INCORRECT - Raw HTML with Tailwind
<h1 className="text-2xl font-semibold">Page Title</h1>
<p className="text-sm text-muted-foreground">Description text</p>
```

**Text Variants (Material 3 Type Scale):**
| Variant | Use Case |
|---------|----------|
| `displayLarge/Medium/Small` | Hero sections, large headings |
| `headlineLarge/Medium/Small` | Page titles, section headers |
| `titleLarge/Medium/Small` | Card titles, dialog titles |
| `bodyLarge/Medium/Small` | Body text, descriptions |
| `labelLarge/Medium/Small` | Buttons, form labels, captions |

**Text Colors:**
| Color | Use Case |
|-------|----------|
| `onSurface` | Primary text (default) |
| `onSurfaceVariant` | Secondary/muted text |
| `primary` | Accent/link text |
| `error` | Error messages |
| `onError` | Text on error backgrounds |

### Surface Component

Use `Surface` for container backgrounds instead of raw divs with bg classes:

```tsx
import { Surface } from "@unisane/ui/primitives/surface";

// CORRECT - Using Surface
<Surface tone="surfaceContainer" rounded="md" elevation={1} className="p-4">
  Content
</Surface>

// INCORRECT - Raw div with Tailwind
<div className="bg-card rounded-lg shadow-sm p-4">
  Content
</div>
```

**Surface Tones (Material 3 Color Roles):**
| Tone | Use Case |
|------|----------|
| `surface` | Default background |
| `surfaceVariant` | Alternate background |
| `surfaceContainerLowest` | Lowest emphasis containers |
| `surfaceContainerLow` | Low emphasis containers |
| `surfaceContainer` | Standard containers |
| `surfaceContainerHigh` | High emphasis containers |
| `surfaceContainerHighest` | Highest emphasis containers |
| `primaryContainer` | Primary action containers |
| `secondaryContainer` | Secondary containers |
| `errorContainer` | Error state containers |
| `tertiaryContainer` | Tertiary containers |

### Icon Component

Use Material Symbols via the `Icon` component:

```tsx
import { Icon } from "@unisane/ui/primitives/icon";

// CORRECT - Using Icon component
<Icon symbol="error" size="sm" className="text-error" />
<Icon symbol="check_circle" size="md" />
<Icon symbol="refresh" />

// INCORRECT - Using Lucide directly for system icons
import { AlertCircle } from "lucide-react";
<AlertCircle className="h-5 w-5" />
```

**Icon Sizes:**
| Size | Dimensions |
|------|------------|
| `xs` | 16px |
| `sm` | 20px |
| `md` | 24px (default) |
| `lg` | 32px |
| `xl` | 40px |

**Common Material Symbols:**
- Error states: `error`, `warning`, `info`, `check_circle`
- Actions: `refresh`, `close`, `add`, `edit`, `delete`
- Navigation: `arrow_back`, `arrow_forward`, `menu`, `more_vert`
- Status: `check`, `schedule`, `pending`

## Component Patterns

### Card Pattern

Use the Card component with its subcomponents:

```tsx
import { Card } from "@unisane/ui/components/card";

<Card variant="outlined">
  <Card.Header>
    <Card.Title>Card Title</Card.Title>
  </Card.Header>
  <Card.Content>
    Card content goes here
  </Card.Content>
  <Card.Footer>
    <Button variant="text">Cancel</Button>
    <Button variant="filled">Save</Button>
  </Card.Footer>
</Card>
```

**Card Variants:**
| Variant | Use Case |
|---------|----------|
| `elevated` | Prominent cards with shadow |
| `filled` | Default filled background |
| `outlined` | Cards with border |
| `low` | Subtle low-emphasis cards |
| `high` | High-emphasis cards |

### Alert Pattern

Use the props-based Alert component:

```tsx
import { Alert } from "@unisane/ui/components/alert";

// CORRECT - Props-based API
<Alert variant="error" title="Error occurred">
  Something went wrong. Please try again.
</Alert>

<Alert variant="success" title="Success!">
  Your changes have been saved.
</Alert>

// INCORRECT - Compound component pattern
<Alert>
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong</AlertDescription>
</Alert>
```

**Alert Variants:**
| Variant | Color Scheme | Use Case |
|---------|--------------|----------|
| `info` | Secondary container | Informational messages |
| `success` | Primary container | Success confirmations |
| `warning` | Tertiary container | Warning messages |
| `error` | Error container | Error messages |

### Button Pattern

Use Material 3 button variants:

```tsx
import { Button } from "@unisane/ui/components/button";

<Button variant="filled">Primary Action</Button>
<Button variant="tonal">Secondary Action</Button>
<Button variant="outlined">Tertiary Action</Button>
<Button variant="text">Low-emphasis</Button>
<Button variant="elevated">Elevated Action</Button>

// With icons
<Button variant="filled" icon={<Icon symbol="add" />}>
  Add Item
</Button>

// Loading state
<Button variant="filled" loading>
  Saving...
</Button>
```

**Button Variant Mapping (from shadcn):**
| shadcn Variant | @unisane/ui Variant |
|----------------|---------------------|
| `default` | `filled` |
| `secondary` | `tonal` |
| `outline` | `outlined` |
| `ghost` | `text` |
| `destructive` | Use `filled` + custom class |

### IconButton Pattern

Use IconButton for icon-only buttons:

```tsx
import { IconButton } from "@unisane/ui/components/icon-button";
import { Icon } from "@unisane/ui/primitives/icon";

<IconButton
  variant="standard"
  ariaLabel="Close"
>
  <Icon symbol="close" />
</IconButton>

<IconButton
  variant="filled"
  ariaLabel="Add item"
  size="lg"
>
  <Icon symbol="add" />
</IconButton>
```

**IconButton Variants:**
| Variant | Use Case |
|---------|----------|
| `standard` | Default, no background |
| `filled` | Primary emphasis |
| `tonal` | Medium emphasis |
| `outlined` | Border, no fill |

### Dialog Pattern

Use props-based Dialog instead of compound components:

```tsx
import { Dialog } from "@unisane/ui/components/dialog";

// CORRECT - Props-based API
<Dialog
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  icon={<Icon symbol="warning" />}
  actions={
    <>
      <Button variant="text" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="filled" onClick={handleConfirm}>Confirm</Button>
    </>
  }
>
  Are you sure you want to proceed?
</Dialog>

// INCORRECT - Compound pattern
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

### ConfirmDialog Pattern

Use for confirmation dialogs (replaces AlertDialog):

```tsx
import { ConfirmDialog } from "@unisane/ui/components/confirm-dialog";

<ConfirmDialog
  open={isDeleteOpen}
  onOpenChange={setIsDeleteOpen}
  title="Delete Item?"
  description="This action cannot be undone."
  variant="danger"
  confirmLabel="Delete"
  cancelLabel="Cancel"
  onConfirm={handleDelete}
  loading={isDeleting}
/>
```

## Color Tokens

### DO NOT use shadcn color classes:

```tsx
// INCORRECT - shadcn color classes
className="text-muted-foreground"
className="bg-destructive"
className="border-border"
className="text-foreground"

// CORRECT - Material 3 color tokens
className="text-on-surface-variant"
className="bg-error"
className="border-outline-variant"
className="text-on-surface"
```

### Color Mapping Reference:

| shadcn Class | Material 3 Token |
|--------------|------------------|
| `text-foreground` | `text-on-surface` |
| `text-muted-foreground` | `text-on-surface-variant` |
| `bg-background` | `bg-surface` |
| `bg-card` | `bg-surface-container` |
| `bg-muted` | `bg-surface-container-high` |
| `border-border` | `border-outline-variant` |
| `bg-destructive` | `bg-error` |
| `text-destructive` | `text-error` |
| `bg-primary` | `bg-primary` |
| `text-primary` | `text-primary` |

## Spacing & Sizing

Use Material 3 spacing tokens (based on 4px grid):

```tsx
// Standard spacing classes work (p-4, gap-3, etc.)
// Use size tokens for icons
className="size-icon-sm"   // 20px
className="size-icon-md"   // 24px
className="size-icon-lg"   // 32px

// Rounded corners
className="rounded-xs"     // Extra small
className="rounded-sm"     // Small (default for cards)
className="rounded-md"     // Medium
className="rounded-lg"     // Large
className="rounded-xl"     // Extra large
className="rounded-full"   // Full/pill
```

## Complete Component Example

Here's a complete example of a properly written saaskit component:

```tsx
"use client";

import { forwardRef } from "react";
import { cn } from "@unisane/ui/lib/utils";
import { Surface } from "@unisane/ui/primitives/surface";
import { Text } from "@unisane/ui/primitives/text";
import { Button } from "@unisane/ui/components/button";
import { Icon } from "@unisane/ui/primitives/icon";

export type ErrorCardProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
  message?: string;
  requestId?: string;
  onRetry?: () => void;
};

const ErrorCard = forwardRef<HTMLDivElement, ErrorCardProps>(
  ({ className, title = "Something went wrong", message, requestId, onRetry, ...props }, ref) => {
    return (
      <Surface
        ref={ref}
        tone="errorContainer"
        rounded="md"
        className={cn("p-6 border border-error/20", className)}
        {...props}
      >
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-error/10">
            <Icon symbol="error" className="text-error" size="sm" />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <Text variant="titleMedium" color="error" weight="semibold">
              {title}
            </Text>
            {message && (
              <Text variant="bodyMedium" color="onSurfaceVariant">
                {message}
              </Text>
            )}
            {requestId && (
              <Text variant="labelSmall" color="onSurfaceVariant" className="font-mono">
                Ref: {requestId}
              </Text>
            )}
            {onRetry && (
              <Button
                variant="outlined"
                size="sm"
                onClick={onRetry}
                className="mt-2 self-start"
                icon={<Icon symbol="refresh" size="sm" />}
              >
                Try again
              </Button>
            )}
          </div>
        </div>
      </Surface>
    );
  }
);
ErrorCard.displayName = "ErrorCard";

export { ErrorCard };
```

## Checklist for Component Migration

When migrating a component to use @unisane/ui properly:

- [ ] Replace `@/src/components/ui/*` imports with `@unisane/ui/*` direct imports
- [ ] Replace raw `<h1>`, `<p>`, `<span>` with `<Text>` component
- [ ] Replace `<div className="bg-*">` containers with `<Surface>`
- [ ] Replace Lucide icons with `<Icon symbol="..." />` for system icons
- [ ] Update button `variant` values (ghost→text, outline→outlined, default→filled)
- [ ] Replace shadcn color classes with Material 3 tokens
- [ ] Update compound Alert/Dialog patterns to props-based API
- [ ] Replace AlertDialog with ConfirmDialog
- [ ] Replace Separator with Divider
- [ ] Replace `sonner` toast with `@unisane/ui/components/toast`
- [ ] Use `@unisane/ui/components/sidebar` for all sidebar components
- [ ] Use `@unisane/ui/components/command` for command palette
- [ ] Use `@unisane/ui/components/stat-card` for dashboard stat cards

## Component Migration Status

Components that have been consolidated into @unisane/ui:

| Component | @unisane/ui Path | Status |
|-----------|------------------|--------|
| Sidebar | `@unisane/ui/components/sidebar` | ✅ Migrated |
| Command | `@unisane/ui/components/command` | ✅ Migrated |
| StatCard | `@unisane/ui/components/stat-card` | ✅ Migrated |
| Toast | `@unisane/ui/components/toast` | ✅ Migrated |

Components still in saaskit (app-specific):

| Component | Location | Reason |
|-----------|----------|--------|
| StatusBadge | `@/src/components/ui/status-badge` | Depends on app-specific status constants |
