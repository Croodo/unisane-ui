# Layout

Components for page structure and responsive layouts.

## Table of Contents

1. [Container](#container)
2. [Grid](#grid)
3. [Stack](#stack)
4. [Spacer](#spacer)
5. [Pane System](#pane-system)
6. [Canonical Layouts](#canonical-layouts)

---

## Container

Centered content container with max-width.

### File: `components/ui/container.tsx`

```tsx
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const containerVariants = cva("mx-auto w-full", {
  variants: {
    size: {
      sm: "max-w-screen-sm",   // 640px
      md: "max-w-screen-md",   // 768px
      lg: "max-w-screen-lg",   // 1024px
      xl: "max-w-screen-xl",   // 1280px
      "2xl": "max-w-screen-2xl", // 1536px
      full: "max-w-full",
    },
    padding: {
      true: "px-4u md:px-6u lg:px-8u",
      false: "px-0",
    },
  },
  defaultVariants: {
    size: "lg",
    padding: true,
  },
});

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ size, padding, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(containerVariants({ size, padding }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = "Container";
```

### Usage Example

```tsx
// Standard container
<Container>
  <h1>Page Content</h1>
  <p>Centered with max-width</p>
</Container>

// Different sizes
<Container size="sm">Narrow content (640px)</Container>
<Container size="xl">Wide content (1280px)</Container>
<Container size="2xl">Extra wide content (1536px)</Container>

// Full width, no padding
<Container size="full" padding={false}>
  <Image src="/banner.jpg" alt="Banner" />
</Container>

// Nested containers
<Container size="full" className="bg-surface-container">
  <Container size="lg">
    <Article />
  </Container>
</Container>
```

---

## Grid

Responsive grid layout system.

### File: `components/ui/grid.tsx`

```tsx
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const gridVariants = cva("grid", {
  variants: {
    columns: {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
      5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
      6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
      12: "grid-cols-12",
    },
    gap: {
      none: "gap-0",
      sm: "gap-2u",
      md: "gap-4u",
      lg: "gap-6u",
      xl: "gap-8u",
    },
    responsive: {
      true: "",  // Responsive classes built into columns variant
      false: "", // Non-responsive handled separately
    },
  },
  defaultVariants: {
    columns: 12,
    gap: "md",
    responsive: true,
  },
});

export interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {}

export const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ columns, gap, responsive, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(gridVariants({ columns, gap, responsive }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Grid.displayName = "Grid";

// Grid Item with CVA
const gridItemVariants = cva("", {
  variants: {
    colSpan: {
      1: "col-span-1",
      2: "col-span-2",
      3: "col-span-3",
      4: "col-span-4",
      5: "col-span-5",
      6: "col-span-6",
      7: "col-span-7",
      8: "col-span-8",
      9: "col-span-9",
      10: "col-span-10",
      11: "col-span-11",
      12: "col-span-12",
    },
    colStart: {
      1: "col-start-1",
      2: "col-start-2",
      3: "col-start-3",
      4: "col-start-4",
      5: "col-start-5",
      6: "col-start-6",
      7: "col-start-7",
      8: "col-start-8",
      9: "col-start-9",
      10: "col-start-10",
      11: "col-start-11",
      12: "col-start-12",
    },
    rowSpan: {
      1: "row-span-1",
      2: "row-span-2",
      3: "row-span-3",
      4: "row-span-4",
      5: "row-span-5",
      6: "row-span-6",
    },
  },
});

export interface GridItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridItemVariants> {}

export const GridItem = forwardRef<HTMLDivElement, GridItemProps>(
  ({ colSpan, colStart, rowSpan, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(gridItemVariants({ colSpan, colStart, rowSpan }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GridItem.displayName = "GridItem";
```

### Usage Example

```tsx
// Responsive 3-column grid
<Grid columns={3} gap="lg">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
  <Card>Item 4</Card>
</Grid>

// 12-column grid with custom spans
<Grid columns={12} gap="md">
  <GridItem colSpan={8}>
    <Card>Main content (8 cols)</Card>
  </GridItem>
  <GridItem colSpan={4}>
    <Card>Sidebar (4 cols)</Card>
  </GridItem>
</Grid>

// Complex layout
<Grid columns={12} gap="lg">
  <GridItem colSpan={12}>
    <Card>Full width header</Card>
  </GridItem>

  <GridItem colSpan={6} rowSpan={2}>
    <Card className="h-full">Featured content</Card>
  </GridItem>

  <GridItem colSpan={6}>
    <Card>Content 1</Card>
  </GridItem>

  <GridItem colSpan={6}>
    <Card>Content 2</Card>
  </GridItem>
</Grid>
```

---

## Stack

Vertical or horizontal stack layout.

### File: `components/ui/stack.tsx`

```tsx
import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const stackVariants = cva("flex", {
  variants: {
    direction: {
      vertical: "flex-col",
      horizontal: "flex-row",
    },
    gap: {
      none: "gap-0",
      xs: "gap-1u",
      sm: "gap-2u",
      md: "gap-4u",
      lg: "gap-6u",
      xl: "gap-8u",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    },
    wrap: {
      true: "flex-wrap",
      false: "flex-nowrap",
    },
  },
  defaultVariants: {
    direction: "vertical",
    gap: "md",
    align: "stretch",
    justify: "start",
    wrap: false,
  },
});

export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {
  divider?: React.ReactNode;
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  (
    {
      direction,
      gap,
      align,
      justify,
      wrap,
      divider,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // If divider is provided, insert it between children
    const childrenArray = React.Children.toArray(children);
    const childrenWithDividers = divider
      ? childrenArray.reduce((acc: React.ReactNode[], child, index) => {
          acc.push(child);
          if (index < childrenArray.length - 1) {
            acc.push(
              <div key={`divider-${index}`} className="flex-shrink-0">
                {divider}
              </div>
            );
          }
          return acc;
        }, [])
      : children;

    return (
      <div
        ref={ref}
        className={cn(
          stackVariants({
            direction,
            gap: divider ? "none" : gap, // Use gap:none when dividers present
            align,
            justify,
            wrap
          }),
          className
        )}
        {...props}
      >
        {childrenWithDividers}
      </div>
    );
  }
);

Stack.displayName = "Stack";

// Convenience exports
export const VStack = forwardRef<HTMLDivElement, Omit<StackProps, "direction">>(
  (props, ref) => <Stack ref={ref} direction="vertical" {...props} />
);

VStack.displayName = "VStack";

export const HStack = forwardRef<HTMLDivElement, Omit<StackProps, "direction">>(
  (props, ref) => <Stack ref={ref} direction="horizontal" {...props} />
);

HStack.displayName = "HStack";
```

### Usage Example

```tsx
// Vertical stack
<VStack gap="md">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</VStack>

// Horizontal stack with center alignment
<HStack gap="lg" align="center" justify="between">
  <Typography variant="headline-medium">Title</Typography>
  <Button variant="filled">Action</Button>
</HStack>

// Stack with dividers
<VStack gap="md" divider={<Divider />}>
  <ListItem>Item 1</ListItem>
  <ListItem>Item 2</ListItem>
  <ListItem>Item 3</ListItem>
</VStack>

// Wrap on overflow
<HStack gap="sm" wrap>
  <Chip>Tag 1</Chip>
  <Chip>Tag 2</Chip>
  <Chip>Tag 3</Chip>
  <Chip>Tag 4</Chip>
</HStack>

// Complex layout
<VStack gap="lg">
  <HStack justify="between" align="center">
    <Typography variant="headline-large">Dashboard</Typography>
    <HStack gap="sm">
      <IconButton variant="standard" ariaLabel="Settings">
        <span className="material-symbols-outlined">settings</span>
      </IconButton>
      <IconButton variant="standard" ariaLabel="Notifications">
        <span className="material-symbols-outlined">notifications</span>
      </IconButton>
    </HStack>
  </HStack>

  <StatGroup />

  <Grid columns={3} gap="lg">
    <Card>Chart 1</Card>
    <Card>Chart 2</Card>
    <Card>Chart 3</Card>
  </Grid>
</VStack>
```

---

## Spacer

Flexible spacing component.

### File: `components/ui/spacer.tsx`

```tsx
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const spacerVariants = cva("", {
  variants: {
    size: {
      xs: "h-1u",
      sm: "h-2u",
      md: "h-4u",
      lg: "h-6u",
      xl: "h-8u",
      "2xl": "h-12u",
    },
    grow: {
      true: "flex-1",
      false: "",
    },
  },
  defaultVariants: {
    size: "md",
    grow: false,
  },
});

export interface SpacerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spacerVariants> {}

export const Spacer = forwardRef<HTMLDivElement, SpacerProps>(
  ({ size, grow, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(spacerVariants({ size: grow ? undefined : size, grow }), className)}
        aria-hidden="true"
        {...props}
      />
    );
  }
);

Spacer.displayName = "Spacer";
```

### Usage Example

```tsx
// Fixed spacing
<div>
  <Typography variant="headline-large">Title</Typography>
  <Spacer size="md" />
  <Typography variant="body-medium">Content below title</Typography>
</div>

// Flexible spacing (pushes content apart)
<VStack className="h-screen">
  <TopAppBar title="App" />
  <Spacer grow />
  <Footer />
</VStack>

// Responsive spacing
<div>
  <Card>Card 1</Card>
  <Spacer size="md" className="md:h-8u lg:h-12u" />
  <Card>Card 2</Card>
</div>
```

---

## Best Practices

### Container Usage

```tsx
// ✅ Use Container for content pages
<Container size="lg">
  <Article />
</Container>

// ✅ Full-width sections with inner Container
<section className="bg-surface-container py-12u">
  <Container size="lg">
    <FeatureGrid />
  </Container>
</section>

// ✅ Nested containers for different widths
<Container size="full" className="bg-primary">
  <Container size="md" className="py-8u">
    <HeroContent />
  </Container>
</Container>
```

### Grid Layouts

```tsx
// ✅ Responsive grid patterns
<Grid columns={12} gap="lg">
  {/* Desktop: 8-4 split, Mobile: stack */}
  <GridItem colSpan={12} className="md:col-span-8">
    <MainContent />
  </GridItem>
  <GridItem colSpan={12} className="md:col-span-4">
    <Sidebar />
  </GridItem>
</Grid>

// ✅ Auto-fit grid for cards
<div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4u">
  {items.map(item => <Card key={item.id}>{item}</Card>)}
</div>
```

### Stack Patterns

```tsx
// ✅ Form layout with VStack
<VStack gap="lg" as="form">
  <TextField label="Name" />
  <TextField label="Email" />
  <TextField label="Message" multiline />
  <HStack justify="end" gap="sm">
    <Button variant="text">Cancel</Button>
    <Button variant="filled" type="submit">Submit</Button>
  </HStack>
</VStack>

// ✅ Toolbar with HStack
<HStack justify="between" align="center" className="p-4u border-b">
  <HStack gap="sm">
    <IconButton variant="standard" ariaLabel="Menu">
      <span className="material-symbols-outlined">menu</span>
    </IconButton>
    <Typography variant="title-large">Page Title</Typography>
  </HStack>

  <HStack gap="sm">
    <Button variant="text">Action 1</Button>
    <Button variant="filled">Action 2</Button>
  </HStack>
</HStack>
```

### Spacing Consistency

```tsx
// ✅ Use Spacer for consistent spacing
<VStack gap="md">
  <Section1 />
  <Spacer size="xl" /> {/* Extra space between sections */}
  <Section2 />
  <Spacer size="xl" />
  <Section3 />
</VStack>

// ✅ Push footer to bottom
<div className="min-h-screen flex flex-col">
  <Header />
  <main className="flex-1">
    <Content />
  </main>
  <Footer />
</div>
```

### Responsive Layouts

```tsx
// ✅ Mobile-first responsive design
<Container>
  {/* Mobile: Stack, Desktop: Side-by-side */}
  <div className="flex flex-col lg:flex-row gap-6u">
    <div className="lg:w-2/3">
      <MainContent />
    </div>
    <div className="lg:w-1/3">
      <Sidebar />
    </div>
  </div>
</Container>

// ✅ Responsive grid
<Grid columns={1} gap="md" className="md:grid-cols-2 lg:grid-cols-3">
  {items.map(item => <Card key={item.id}>{item}</Card>)}
</Grid>
```

### Accessibility

```tsx
// ✅ Semantic HTML with layout components
<Container as="main" role="main">
  <Stack as="section" aria-labelledby="section-title">
    <Typography variant="headline-large" id="section-title">
      Section Title
    </Typography>
    <Content />
  </Stack>
</Container>

// ✅ Skip to content link
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
<Container id="main-content">
  <Content />
</Container>
```

### Performance

```tsx
// ✅ Use CSS Grid over JavaScript for layout
<Grid columns={3}> {/* Pure CSS, no JS */}
  <Cards />
</Grid>

// ✅ Avoid unnecessary nesting
// ❌ Bad
<Container>
  <VStack>
    <HStack>
      <Card>Content</Card>
    </HStack>
  </VStack>
</Container>

// ✅ Good
<Container>
  <Card>Content</Card>
</Container>
```

---

## Pane System

Material 3 adaptive pane primitives for building responsive multi-pane layouts.

### File: `layout/pane.tsx`

```tsx
"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// --- Pane ---

const paneVariants = cva(
  "relative h-full overflow-hidden transition-all duration-long ease-emphasized bg-surface",
  {
    variants: {
      role: {
        list: "border-r border-outline-variant/20 z-0",
        main: "flex-1 z-0",
        supporting: "border-l border-outline-variant/20 z-10 bg-surface-container-low",
      },
      isActive: {
        true: "block",
        false: "hidden medium:block",
      },
    },
    defaultVariants: {
      role: "main",
      isActive: true,
    },
  }
);

export interface PaneProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "role">,
    VariantProps<typeof paneVariants> {
  width?: string | number;
  showScrollbar?: boolean;
}

export const Pane = React.forwardRef<HTMLDivElement, PaneProps>(
  ({ className, role, isActive, width, style, children, showScrollbar, ...props }, ref) => {
    // Determine responsive width classes based on role
    let widthClass = "";
    if (!width) {
      if (role === "list")
        widthClass = "w-full medium:w-[var(--width-pane-list,calc(var(--uni-sys-u)*90))] shrink-0";
      if (role === "supporting")
        widthClass = "w-full medium:w-[var(--width-pane-supporting,calc(var(--uni-sys-u)*100))] shrink-0";
      if (role === "main") widthClass = "w-full flex-1 min-w-0";
    }

    // Main pane defaults to visible scrollbar with gutter stable
    const shouldShowScrollbar = showScrollbar ?? role === "main";

    return (
      <div
        ref={ref}
        className={cn(paneVariants({ role, isActive }), widthClass, className)}
        style={{ ...style, ...(width ? { width } : {}) }}
        {...props}
      >
        <div
          className={cn(
            "h-full overflow-y-auto",
            shouldShowScrollbar ? "[scrollbar-gutter:stable]" : "no-scrollbar"
          )}
        >
          {children}
        </div>
      </div>
    );
  }
);
Pane.displayName = "Pane";

// --- Pane Divider ---

export interface PaneDividerProps extends React.HTMLAttributes<HTMLDivElement> {}

export const PaneDivider: React.FC<PaneDividerProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "w-px h-full bg-outline-variant/20 cursor-col-resize hover:bg-primary/50 transition-colors z-20 hidden medium:block",
        className
      )}
      {...props}
    />
  );
};

// --- Pane Layout ---

export interface PaneLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

export const PaneLayout = React.forwardRef<HTMLDivElement, PaneLayoutProps>(
  ({ className, orientation = "horizontal", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full h-full overflow-hidden relative isolate",
          orientation === "vertical" ? "flex-col" : "flex-row",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PaneLayout.displayName = "PaneLayout";
```

### Pane Roles

| Role | Description | Default Width |
|------|-------------|---------------|
| `list` | Left sidebar for navigation/lists | 360px (90u) |
| `main` | Primary content area | Flexible (flex-1) |
| `supporting` | Right sidebar for details/context | 400px (100u) |

### Usage Example

```tsx
// Basic two-pane layout
<PaneLayout>
  <Pane role="list">
    <Navigation items={navItems} />
  </Pane>
  <Pane role="main">
    <MainContent />
  </Pane>
</PaneLayout>

// Three-pane layout with supporting pane
<PaneLayout>
  <Pane role="list">
    <ConversationList />
  </Pane>
  <Pane role="main">
    <MessageThread />
  </Pane>
  <Pane role="supporting">
    <ContactDetails />
  </Pane>
</PaneLayout>

// Vertical pane layout
<PaneLayout orientation="vertical">
  <Pane role="main" className="h-2/3">
    <Editor />
  </Pane>
  <PaneDivider />
  <Pane role="supporting" className="h-1/3">
    <Console />
  </Pane>
</PaneLayout>

// Custom widths via CSS variables
<div style={{ "--width-pane-list": "320px" } as React.CSSProperties}>
  <PaneLayout>
    <Pane role="list">Narrow list</Pane>
    <Pane role="main">Content</Pane>
  </PaneLayout>
</div>
```

---

## Canonical Layouts

Material 3 canonical layouts implement common adaptive patterns for different screen sizes.

### File: `components/canonical-layouts.tsx`

```tsx
import React from "react";
import { cn } from "@/lib/utils";
import { IconButton } from "./icon-button";
import { Pane, PaneLayout } from "../layout/pane";
import { Portal } from "./portal";
import { animations } from "@/lib/utils";

// --- List Detail Layout ---

export interface ListDetailLayoutProps {
  list: React.ReactNode;
  detail: React.ReactNode;
  showDetailMobile?: boolean;
  onBackClick?: () => void;
  className?: string;
  isRoot?: boolean;
}

export const ListDetailLayout: React.FC<ListDetailLayoutProps> = ({
  list,
  detail,
  showDetailMobile = false,
  onBackClick,
  className,
  isRoot = false,
}) => {
  return (
    <PaneLayout
      className={cn(
        !isRoot && "rounded-sm border border-outline-variant/30",
        className
      )}
    >
      {/* List Pane - Hidden on mobile when detail is shown */}
      <Pane
        role="list"
        isActive={!showDetailMobile}
        className={cn("transition-transform", animations.transition.transform)}
      >
        {list}
      </Pane>

      {/* Detail Pane - Slides in on mobile */}
      <Pane
        role="main"
        isActive={showDetailMobile}
        className={cn(
          "bg-surface-container-low relative",
          animations.transition.opacity
        )}
      >
        {showDetailMobile && (
          <div className="medium:hidden absolute top-4u left-4u z-20">
            <IconButton
              onClick={onBackClick}
              variant="standard"
              className="bg-surface/50 backdrop-blur-md border border-outline-variant/30"
              ariaLabel="Back"
              icon={<span className="material-symbols-outlined">arrow_back</span>}
            />
          </div>
        )}
        {detail}
      </Pane>
    </PaneLayout>
  );
};

// --- Supporting Pane Layout ---

export interface SupportingPaneLayoutProps {
  main: React.ReactNode;
  supporting: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
  className?: string;
  isRoot?: boolean;
  mainRef?: React.RefObject<HTMLDivElement | null>;
  title?: string;
}

export const SupportingPaneLayout: React.FC<SupportingPaneLayoutProps> = ({
  main,
  supporting,
  open = false,
  onClose,
  className,
  isRoot = false,
  mainRef,
  title = "Details",
}) => {
  return (
    <div
      className={cn(
        "grid w-full h-full bg-surface relative overflow-hidden isolate",
        "transition-[grid-template-columns] duration-long ease-emphasized",
        !isRoot && "rounded-sm border border-outline-variant/30",
        open
          ? "expanded:grid-cols-[1fr_var(--width-pane-supporting)]"
          : "expanded:grid-cols-[1fr_var(--width-rail-collapsed)]",
        className
      )}
    >
      {/* Main Content Pane */}
      <div
        ref={mainRef as React.RefObject<HTMLDivElement>}
        className="flex-1 h-full overflow-hidden bg-surface relative min-w-0"
      >
        <div className="h-full overflow-y-auto scroll-smooth [scrollbar-gutter:stable]">
          {main}
        </div>
      </div>

      {/* Supporting Pane - Overlay on mobile, static on expanded */}
      <aside
        className={cn(
          "shrink-0 bg-surface-container-low overflow-hidden z-20",
          "transition-all duration-long ease-emphasized",
          // Mobile: Absolute overlay
          "absolute inset-y-0 right-0 h-full w-full medium:w-[min(100%,var(--width-pane-supporting))]",
          open ? "translate-x-0 shadow-3" : "translate-x-full shadow-none",
          // Expanded: Static
          "expanded:static expanded:shadow-none expanded:translate-x-0",
          "expanded:border-l expanded:border-outline-variant/30 expanded:w-full"
        )}
      >
        {open ? (
          <div className="flex flex-col h-full">
            <header className="px-6u py-4u border-b border-outline-variant/10 flex items-center justify-between shrink-0">
              <div className="font-medium text-primary text-label-medium">
                {title}
              </div>
              <IconButton
                onClick={onClose}
                variant="standard"
                icon={<span className="material-symbols-outlined text-[length:var(--size-icon-sm)]">close</span>}
                ariaLabel="Close pane"
                className="expanded:hidden"
              />
            </header>
            <div className="flex-1 overflow-y-auto [scrollbar-gutter:stable] pt-2u">
              {supporting}
            </div>
          </div>
        ) : (
          /* Collapsed Rail State (desktop only) */
          <div className="hidden expanded:flex flex-col items-center py-6u h-full gap-4u overflow-y-auto no-scrollbar">
            <IconButton
              onClick={onClose}
              variant="standard"
              className="rounded-sm border border-outline-variant/30 bg-surface hover:border-primary/50 transition-all group shrink-0"
              ariaLabel="Expand pane"
              icon={<span className="material-symbols-outlined group-hover:text-primary transition-colors">chevron_left</span>}
            />
            <div className="w-[calc(var(--uni-sys-u)/4)] flex-1 bg-outline-variant/30 min-h-10u" />
            <div className="rotate-90 whitespace-nowrap text-label-small font-medium text-on-surface-variant/50 tracking-wide origin-center mt-12u mb-6u shrink-0">
              {title}
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Backdrop */}
      <div
        className={cn(
          "expanded:hidden absolute inset-0 bg-scrim backdrop-blur-[calc(var(--uni-sys-u)/4)] z-10",
          "transition-opacity duration-emphasized",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
    </div>
  );
};

// --- Feed Layout ---

export interface FeedLayoutProps {
  children: React.ReactNode;
  className?: string;
  isRoot?: boolean;
}

export const FeedLayout: React.FC<FeedLayoutProps> = ({
  children,
  className,
  isRoot = false,
}) => {
  return (
    <div
      className={cn(
        "w-full h-full overflow-y-auto bg-surface-container-low p-4u expanded:p-6u scroll-smooth no-scrollbar",
        !isRoot && "rounded-sm border border-outline-variant/30",
        className
      )}
    >
      <div className="max-w-large mx-auto">
        <div className="grid grid-cols-1 expanded:grid-cols-2 large:grid-cols-3 gap-4u expanded:gap-6u items-start">
          {children}
        </div>
      </div>
    </div>
  );
};
```

### Layout Patterns

| Layout | Pattern | Use Case |
|--------|---------|----------|
| `ListDetailLayout` | List + Detail (master-detail) | Email, messages, file browsers |
| `SupportingPaneLayout` | Main + Supporting sidebar | Documents with properties, editors |
| `FeedLayout` | Responsive card grid | Dashboards, galleries, feeds |

### Usage Examples

#### List Detail Layout (Master-Detail)

```tsx
function EmailApp() {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const handleSelect = (email: Email) => {
    setSelectedEmail(email);
    setShowDetail(true); // Show detail on mobile
  };

  return (
    <ListDetailLayout
      isRoot
      showDetailMobile={showDetail}
      onBackClick={() => setShowDetail(false)}
      list={
        <EmailList
          emails={emails}
          selectedId={selectedEmail?.id}
          onSelect={handleSelect}
        />
      }
      detail={
        selectedEmail ? (
          <EmailDetail email={selectedEmail} />
        ) : (
          <EmptyState message="Select an email" />
        )
      }
    />
  );
}
```

#### Supporting Pane Layout

```tsx
function DocumentEditor() {
  const [showProperties, setShowProperties] = useState(true);

  return (
    <SupportingPaneLayout
      isRoot
      open={showProperties}
      onClose={() => setShowProperties(!showProperties)}
      title="Document Properties"
      main={
        <>
          <Toolbar onToggleProperties={() => setShowProperties(!showProperties)} />
          <Editor document={document} />
        </>
      }
      supporting={
        <PropertiesPanel document={document} />
      }
    />
  );
}
```

#### Feed Layout

```tsx
function Dashboard() {
  return (
    <FeedLayout isRoot>
      <StatsCard title="Revenue" value="$12,345" />
      <StatsCard title="Users" value="1,234" />
      <StatsCard title="Orders" value="567" />
      <ChartCard title="Sales Trend" />
      <ChartCard title="User Growth" />
      <ActivityCard />
    </FeedLayout>
  );
}
```

### Responsive Behavior

All canonical layouts adapt to screen size using the design system breakpoints:

| Breakpoint | Behavior |
|------------|----------|
| Compact (< 600px) | Single pane visible, slide transitions |
| Medium (600-840px) | Two panes may be visible |
| Expanded (> 840px) | All panes visible, grid layouts |

```tsx
// CSS variables for customization
<div style={{
  "--width-pane-list": "320px",
  "--width-pane-supporting": "360px",
  "--width-rail-collapsed": "72px",
} as React.CSSProperties}>
  <ListDetailLayout {...props} />
</div>
```

### Accessibility

```tsx
// Proper landmark usage
<ListDetailLayout
  list={
    <nav aria-label="Email list">
      <EmailList />
    </nav>
  }
  detail={
    <main aria-label="Email content">
      <EmailDetail />
    </main>
  }
/>

// Focus management for mobile transitions
<ListDetailLayout
  showDetailMobile={showDetail}
  onBackClick={() => {
    setShowDetail(false);
    listRef.current?.focus(); // Return focus to list
  }}
  {...props}
/>
```

### Combining with App Layout

```tsx
function App() {
  return (
    <AppLayout
      navigation={<NavigationRail items={navItems} />}
    >
      <ListDetailLayout
        list={<Sidebar />}
        detail={<MainContent />}
      />
    </AppLayout>
  );
}
```
