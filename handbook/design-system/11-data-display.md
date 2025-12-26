# Data Display

Components for displaying structured data and collections.

## Table of Contents

1. [Chip](#chip)
2. [Avatar](#avatar)
3. [Table](#table)
4. [Empty State](#empty-state)

---

## Chip

Compact elements for filters, tags, actions, and selections.

### M3 Specification

| Property | Value |
|----------|-------|
| Container Height | 32dp |
| Min Touch Target | 48dp |
| Corner Radius | Small (8dp) |
| Horizontal Padding | 16dp (label only) / 8dp (with icon) |
| Icon Size | 18dp |
| Icon Start Padding | 8dp |
| Icon End Padding | 8dp |
| Typography | Label Large |

| Chip Type | Description |
|-----------|-------------|
| Assist | Actions that shortcut or extend a task |
| Filter | Filter content or trigger actions |
| Input | User-entered information (tags, recipients) |
| Suggestion | Dynamically generated suggestions |

| State | Opacity |
|-------|---------|
| Hover | 8% |
| Focus | 12% |
| Pressed | 12% |
| Disabled | 38% opacity on content |

| Color (Unselected) | Token |
|-------------------|-------|
| Container | `surface-container-low` or transparent with `outline` border |
| Text | `on-surface` |
| Icon | `primary` (assist) / `on-surface-variant` (others) |

| Color (Selected) | Token |
|-----------------|-------|
| Container | `secondary-container` |
| Text | `on-secondary-container` |
| Checkmark Icon | `on-secondary-container` |

> **Source**: [M3 Chips](https://m3.material.io/components/chips/specs)

### Unisane Token Mapping

```
Dimensions:
32dp height = h-8u
48dp touch target = min-h-12u (external)
8dp corners = rounded-sm
16dp padding = px-4u
8dp icon padding = gap-2u

Icon:
18dp = w-4.5u h-4.5u

Typography:
Label Large = text-label-large font-medium

Colors:
Unselected: bg-surface-container-low or border border-outline
Selected: bg-secondary-container text-on-secondary-container
```

### File: `components/ui/chip.tsx`

```tsx
"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Ripple } from "@/components/ui/ripple";
import { cn } from "@/lib/utils";

const chipVariants = cva(
  [
    "relative inline-flex items-center gap-2u h-8u rounded-sm",
    "text-label-large font-medium cursor-pointer overflow-hidden",
    "transition-all duration-short",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  ].join(" "),
  {
    variants: {
      variant: {
        assist: "",
        filter: "",
        input: "",
        suggestion: "",
      },
      selected: {
        true: "bg-secondary-container text-on-secondary-container",
        false: "bg-surface-container-low text-on-surface border border-outline",
      },
      elevated: {
        true: "shadow-1 border-0",
        false: "",
      },
      disabled: {
        true: "opacity-38 pointer-events-none cursor-not-allowed",
        false: "",
      },
    },
    compoundVariants: [
      // Selected removes border
      { selected: true, className: "border-0" },
      // Elevated selected
      { selected: true, elevated: true, className: "shadow-1" },
    ],
    defaultVariants: {
      variant: "assist",
      selected: false,
      elevated: false,
      disabled: false,
    },
  }
);

interface ChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled">,
    VariantProps<typeof chipVariants> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onDelete?: () => void;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      variant = "assist",
      selected = false,
      elevated = false,
      disabled = false,
      leadingIcon,
      trailingIcon,
      onDelete,
      children,
      className,
      ...props
    },
    ref
  ) => {
    // Calculate padding based on icons
    const hasLeadingIcon = !!leadingIcon || (variant === "filter" && selected);
    const hasTrailingIcon = !!trailingIcon || !!onDelete;
    const paddingClass = cn(
      hasLeadingIcon ? "pl-2u" : "pl-4u",
      hasTrailingIcon ? "pr-2u" : "pr-4u"
    );

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={cn(chipVariants({ variant, selected, elevated, disabled }), paddingClass, className)}
        {...props}
      >
        {/* State layer */}
        {!selected && (
          <span className="absolute inset-0 pointer-events-none bg-on-surface opacity-0 group-hover:opacity-8 group-active:opacity-12 transition-opacity duration-short z-0" />
        )}

        {/* Ripple */}
        <Ripple disabled={disabled} />

        {/* Checkmark for selected filter chips */}
        {variant === "filter" && selected && !leadingIcon && (
          <span className="material-symbols-outlined w-4.5u h-4.5u flex items-center justify-center relative z-10">
            check
          </span>
        )}

        {/* Leading icon */}
        {leadingIcon && (
          <span className="w-4.5u h-4.5u flex items-center justify-center relative z-10">
            {leadingIcon}
          </span>
        )}

        {/* Label */}
        <span className="truncate relative z-10">{children}</span>

        {/* Trailing icon or delete button */}
        {onDelete ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-4.5u h-4.5u flex items-center justify-center rounded-full hover:bg-on-surface/12 transition-colors relative z-10"
            aria-label="Remove"
          >
            <span className="material-symbols-outlined w-4.5u h-4.5u">close</span>
          </button>
        ) : trailingIcon ? (
          <span className="w-4.5u h-4.5u flex items-center justify-center relative z-10">
            {trailingIcon}
          </span>
        ) : null}
      </button>
    );
  }
);

Chip.displayName = "Chip";

// Chip Group for managing multiple chips
interface ChipGroupProps {
  children: React.ReactNode;
  className?: string;
  wrap?: boolean;
}

export const ChipGroup = ({ children, className, wrap = true }: ChipGroupProps) => (
  <div className={cn("flex gap-2u", wrap && "flex-wrap", className)} role="group">
    {children}
  </div>
);
```

### Usage Example

```tsx
// Assist chips (actions)
<ChipGroup>
  <Chip variant="assist" leadingIcon={<span className="material-symbols-outlined">event</span>}>
    Set reminder
  </Chip>
  <Chip variant="assist" leadingIcon={<span className="material-symbols-outlined">share</span>}>
    Share
  </Chip>
</ChipGroup>

// Filter chips (selection)
const [filters, setFilters] = useState<string[]>(["active"]);

const toggleFilter = (value: string) => {
  setFilters((prev) =>
    prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
  );
};

<ChipGroup>
  <Chip variant="filter" selected={filters.includes("active")} onClick={() => toggleFilter("active")}>
    Active
  </Chip>
  <Chip variant="filter" selected={filters.includes("completed")} onClick={() => toggleFilter("completed")}>
    Completed
  </Chip>
</ChipGroup>

// Input chips (tags)
const [tags, setTags] = useState(["React", "TypeScript", "Tailwind"]);

<ChipGroup>
  {tags.map((tag) => (
    <Chip key={tag} variant="input" onDelete={() => setTags(tags.filter((t) => t !== tag))}>
      {tag}
    </Chip>
  ))}
</ChipGroup>

// Suggestion chips
<ChipGroup>
  <Chip variant="suggestion" onClick={() => handleSuggestion("flights")}>Flights</Chip>
  <Chip variant="suggestion" onClick={() => handleSuggestion("hotels")}>Hotels</Chip>
</ChipGroup>
```

---

## Avatar

User profile images and initials.

### M3 Specification

While M3 doesn't specify a dedicated Avatar component, common sizes follow the 8dp grid and touch target guidelines:

| Size | Dimension | Use Case |
|------|-----------|----------|
| Extra Small | 24dp | Inline text, compact lists |
| Small | 32dp | Dense lists, chips |
| Medium | 40dp | Standard lists, cards |
| Large | 48dp | Profile sections |
| Extra Large | 64dp | Profile headers |

| Property | Value |
|----------|-------|
| Shape | Full (circle) - default |
| Corner Radius | 50% (circle) or Medium (12dp) for rounded |
| Fallback Background | `primary` |
| Fallback Text | `on-primary` |
| Typography | Scales with size |

### Unisane Token Mapping

```
Sizes:
24dp = w-6u h-6u (xs)
32dp = w-8u h-8u (sm)
40dp = w-10u h-10u (md)
48dp = w-12u h-12u (lg)
64dp = w-16u h-16u (xl)

Shape:
Circle = rounded-full
Rounded = rounded-md

Typography (fallback):
xs: text-label-small
sm: text-label-medium
md: text-label-large
lg: text-title-medium
xl: text-title-large

Colors:
Fallback: bg-primary text-on-primary
```

### File: `components/ui/avatar.tsx`

```tsx
import { forwardRef, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "relative inline-flex items-center justify-center overflow-hidden flex-shrink-0",
  {
    variants: {
      size: {
        xs: "w-6u h-6u text-label-small",
        sm: "w-8u h-8u text-label-medium",
        md: "w-10u h-10u text-label-large",
        lg: "w-12u h-12u text-title-medium",
        xl: "w-16u h-16u text-title-large",
      },
      shape: {
        circle: "rounded-full",
        rounded: "rounded-md",
        square: "rounded-none",
      },
    },
    defaultVariants: {
      size: "md",
      shape: "circle",
    },
  }
);

interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
}

const getInitials = (name?: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt = "", fallback, size = "md", shape = "circle", className, ...props }, ref) => {
    const [imageError, setImageError] = useState(false);
    const showFallback = !src || imageError;

    return (
      <div
        ref={ref}
        className={cn(
          avatarVariants({ size, shape }),
          showFallback && "bg-primary text-on-primary font-medium",
          className
        )}
        {...props}
      >
        {showFallback ? (
          <span aria-hidden="true">{getInitials(fallback || alt)}</span>
        ) : (
          <img
            src={src}
            alt={alt}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

// Avatar Group for showing multiple avatars
interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const AvatarGroup = ({ children, max = 5, size = "md", className }: AvatarGroupProps) => {
  const childArray = React.Children.toArray(children);
  const visible = childArray.slice(0, max);
  const excess = childArray.length - max;

  return (
    <div className={cn("flex items-center -space-x-2u", className)} role="group">
      {visible.map((child, index) => (
        <div key={index} className="ring-2 ring-surface rounded-full">
          {child}
        </div>
      ))}
      {excess > 0 && (
        <div
          className={cn(
            avatarVariants({ size, shape: "circle" }),
            "bg-surface-container-high text-on-surface font-medium ring-2 ring-surface"
          )}
        >
          +{excess}
        </div>
      )}
    </div>
  );
};
```

### Usage Example

```tsx
// Basic avatar with image
<Avatar src="/user.jpg" alt="John Doe" />

// Fallback to initials
<Avatar fallback="John Doe" />

// Different sizes
<div className="flex items-center gap-3u">
  <Avatar size="xs" fallback="JD" />
  <Avatar size="sm" fallback="JD" />
  <Avatar size="md" fallback="JD" />
  <Avatar size="lg" fallback="JD" />
  <Avatar size="xl" fallback="JD" />
</div>

// Different shapes
<div className="flex items-center gap-3u">
  <Avatar shape="circle" fallback="JD" />
  <Avatar shape="rounded" fallback="JD" />
  <Avatar shape="square" fallback="JD" />
</div>

// Avatar group with overflow
<AvatarGroup max={3}>
  <Avatar src="/user1.jpg" alt="User 1" />
  <Avatar src="/user2.jpg" alt="User 2" />
  <Avatar src="/user3.jpg" alt="User 3" />
  <Avatar src="/user4.jpg" alt="User 4" />
  <Avatar src="/user5.jpg" alt="User 5" />
</AvatarGroup>
```

---

## Table

Display tabular data with sorting and selection.

### M3 Specification

While M3 doesn't have an official data table spec (it was in M1), these values follow M3 patterns:

| Property | Value |
|----------|-------|
| Header Row Height | 56dp |
| Data Row Height | 52dp |
| Cell Horizontal Padding | 16dp |
| Header Typography | Title Small (medium weight) |
| Cell Typography | Body Medium |
| Border | 1dp `outline-variant` |

| State | Description |
|-------|-------------|
| Hover | 8% state layer on row |
| Selected | `secondary-container/50` background |
| Sorted | Show sort icon in header |

| Color | Token |
|-------|-------|
| Header Background | transparent or `surface` |
| Row Border | `outline-variant` |
| Header Text | `on-surface` |
| Cell Text | `on-surface` |
| Selected Row | `secondary-container` at 50% |

### Unisane Token Mapping

```
Row Heights:
56dp header = h-14u
52dp data row = h-13u

Padding:
16dp = px-4u

Typography:
Header: text-title-small font-medium
Cell: text-body-medium

Border:
1dp = border / h-px
outline-variant = border-outline-variant
```

### File: `components/ui/table.tsx`

```tsx
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Ripple } from "@/components/ui/ripple";

// Table Root
interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  dense?: boolean;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ dense = false, className, children, ...props }, ref) => {
    return (
      <div className="w-full overflow-x-auto">
        <table
          ref={ref}
          className={cn("w-full border-collapse", className)}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }
);

Table.displayName = "Table";

// Table Header
export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, children, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("border-b border-outline-variant", className)}
    {...props}
  >
    {children}
  </thead>
));

TableHeader.displayName = "TableHeader";

// Table Body
export const TableBody = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, children, ...props }, ref) => (
  <tbody ref={ref} className={className} {...props}>
    {children}
  </tbody>
));

TableBody.displayName = "TableBody";

// Table Footer
export const TableFooter = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, children, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("border-t border-outline-variant bg-surface-container", className)}
    {...props}
  >
    {children}
  </tfoot>
));

TableFooter.displayName = "TableFooter";

// Table Row - 52dp height for data rows
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
  interactive?: boolean;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ selected = false, interactive = false, className, children, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-outline-variant/30 transition-colors duration-short",
        selected && "bg-secondary-container/50",
        interactive && "cursor-pointer hover:bg-on-surface/8 active:bg-on-surface/12 relative",
        className
      )}
      {...props}
    >
      {interactive && <Ripple />}
      {children}
    </tr>
  )
);

TableRow.displayName = "TableRow";

// Table Head Cell - 56dp height
interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sorted?: "asc" | "desc" | false;
  onSort?: () => void;
}

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ sortable = false, sorted = false, onSort, className, children, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-14u px-4u text-title-small font-medium text-on-surface text-left",
        sortable && "cursor-pointer select-none hover:bg-on-surface/5 transition-colors",
        className
      )}
      onClick={sortable ? onSort : undefined}
      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
      {...props}
    >
      <div className="flex items-center gap-2u">
        <span>{children}</span>
        {sortable && (
          <span className="material-symbols-outlined w-4.5u h-4.5u text-on-surface-variant">
            {sorted === "asc" ? "arrow_upward" : sorted === "desc" ? "arrow_downward" : "unfold_more"}
          </span>
        )}
      </div>
    </th>
  )
);

TableHead.displayName = "TableHead";

// Table Cell - 52dp height
export const TableCell = forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, children, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("h-13u px-4u text-body-medium text-on-surface", className)}
    {...props}
  >
    {children}
  </td>
));

TableCell.displayName = "TableCell";

// Table Caption
export const TableCaption = forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, children, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4u text-body-small text-on-surface-variant", className)}
    {...props}
  >
    {children}
  </caption>
));

TableCaption.displayName = "TableCaption";
```

### Usage Example

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead sortable sorted="asc" onSort={() => handleSort("name")}>
        Name
      </TableHead>
      <TableHead sortable onSort={() => handleSort("email")}>
        Email
      </TableHead>
      <TableHead>Role</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>

  <TableBody>
    <TableRow interactive onClick={() => handleRowClick(user.id)}>
      <TableCell className="font-medium">John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
      <TableCell>Admin</TableCell>
      <TableCell>
        <Badge variant="success">Active</Badge>
      </TableCell>
    </TableRow>

    <TableRow interactive selected>
      <TableCell className="font-medium">Jane Smith</TableCell>
      <TableCell>jane@example.com</TableCell>
      <TableCell>Editor</TableCell>
      <TableCell>
        <Badge variant="success">Active</Badge>
      </TableCell>
    </TableRow>
  </TableBody>

  <TableFooter>
    <TableRow>
      <TableCell colSpan={4}>Showing 2 of 50 results</TableCell>
    </TableRow>
  </TableFooter>
</Table>
```

---

## Empty State

Display when no data is available.

### M3 Specification

Empty states follow general M3 layout and typography guidelines:

| Property | Value |
|----------|-------|
| Icon Size | 48-64dp |
| Title Typography | Headline Small |
| Description Typography | Body Medium |
| Max Width | 400dp (text content) |
| Vertical Padding | 64dp |
| Horizontal Padding | 24dp |

| Color | Token |
|-------|-------|
| Icon | `on-surface-variant` at 60% |
| Title | `on-surface` |
| Description | `on-surface-variant` |

### Unisane Token Mapping

```
Icon:
48dp = w-12u h-12u
64dp = w-16u h-16u
Opacity: opacity-60

Typography:
Title: text-headline-small
Description: text-body-medium text-on-surface-variant

Layout:
64dp vertical padding = py-16u
24dp horizontal padding = px-6u
400dp max-width = max-w-100u
```

### File: `components/ui/empty-state.tsx`

```tsx
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center py-16u px-6u text-center",
          className
        )}
        {...props}
      >
        {/* Icon - 64dp */}
        {icon && (
          <div className="w-16u h-16u flex items-center justify-center mb-4u text-on-surface-variant opacity-60">
            {icon}
          </div>
        )}

        {/* Title */}
        <h3 className="text-headline-small text-on-surface mb-2u">{title}</h3>

        {/* Description */}
        {description && (
          <p className="text-body-medium text-on-surface-variant max-w-100u mb-6u">
            {description}
          </p>
        )}

        {/* Action */}
        {action && <div>{action}</div>}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";
```

### Usage Example

```tsx
// No search results
<EmptyState
  icon={<span className="material-symbols-outlined text-[64px]">search_off</span>}
  title="No results found"
  description="Try adjusting your search or filter to find what you're looking for."
  action={
    <Button variant="outlined" onClick={() => setSearchQuery("")}>
      Clear filters
    </Button>
  }
/>

// No data yet
<EmptyState
  icon={<span className="material-symbols-outlined text-[64px]">inbox</span>}
  title="No messages yet"
  description="When you receive messages, they'll appear here."
/>

// Create first item
<EmptyState
  icon={<span className="material-symbols-outlined text-[64px]">add_circle</span>}
  title="Create your first project"
  description="Projects help you organize your work and collaborate with your team."
  action={
    <Button variant="filled" onClick={() => setShowCreateDialog(true)}>
      <span className="material-symbols-outlined mr-2u">add</span>
      New Project
    </Button>
  }
/>
```

---

## Accessibility

### Chip

- Use `role="group"` on ChipGroup
- Filter chips should use `aria-pressed` for toggle state
- Input chips with delete should have descriptive labels
- Ensure 48dp minimum touch target

```tsx
<Chip
  variant="filter"
  selected={isSelected}
  aria-pressed={isSelected}
  onClick={toggleFilter}
>
  Filter Name
</Chip>

<Chip
  variant="input"
  onDelete={() => removeTag(tag)}
  aria-label={`${tag}, press delete to remove`}
>
  {tag}
</Chip>
```

### Avatar

- Always provide `alt` text for images
- Use `aria-hidden="true"` for decorative avatars
- AvatarGroup should have descriptive `aria-label`

```tsx
<Avatar src="/user.jpg" alt="John Doe" />

<AvatarGroup aria-label="Project members">
  <Avatar src="/user1.jpg" alt="Alice" />
  <Avatar src="/user2.jpg" alt="Bob" />
</AvatarGroup>
```

### Table

- Use proper semantic table elements
- Add `aria-sort` for sortable columns
- Use `role="rowheader"` for first column if applicable
- Ensure keyboard navigation for interactive rows

```tsx
<TableHead
  sortable
  sorted={sortDirection}
  aria-sort={sortDirection === "asc" ? "ascending" : "descending"}
>
  Column Name
</TableHead>

<TableRow
  interactive
  tabIndex={0}
  onKeyDown={(e) => e.key === "Enter" && handleRowClick()}
>
  ...
</TableRow>
```

---

## Best Practices

### Chip Usage

```tsx
// ✅ Use filter chips for multi-select filters
<ChipGroup>
  {categories.map((cat) => (
    <Chip key={cat} variant="filter" selected={selected.includes(cat)}>
      {cat}
    </Chip>
  ))}
</ChipGroup>

// ✅ Use input chips for user-generated content
<ChipGroup>
  {tags.map((tag) => (
    <Chip key={tag} variant="input" onDelete={() => removeTag(tag)}>
      {tag}
    </Chip>
  ))}
</ChipGroup>

// ❌ Don't use chips for primary actions (use buttons instead)
```

### Avatar Considerations

```tsx
// ✅ Always provide fallback
<Avatar src={user.avatar} alt={user.name} fallback={user.name} />

// ✅ Use consistent sizes in lists
<List>
  {users.map((user) => (
    <ListItem
      leadingContent={<Avatar size="md" src={user.avatar} alt={user.name} />}
    />
  ))}
</List>
```

### Table Performance

```tsx
// ✅ Virtualize large tables
import { useVirtual } from "@tanstack/react-virtual";

// ✅ Debounce search
const debouncedSearch = useDebouncedCallback((query) => {
  performSearch(query);
}, 300);

// ✅ Use server-side pagination for large datasets
const handlePageChange = async (page: number) => {
  const data = await fetchData({ page, pageSize: 10 });
  setData(data);
};
```
