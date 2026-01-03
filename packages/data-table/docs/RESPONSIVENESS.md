# DataTable Responsiveness Guide

This document outlines the responsive design strategy for the DataTable component across all screen sizes.

---

## Overview

The DataTable uses a **container query-first responsive approach**:

| Context | Query Type | Reason |
|---------|------------|--------|
| Table internals (columns, cells, scrolling) | **Container queries** (`@sm:`, `@md:`) | Table may be in sidebar, modal, or split view |
| Toolbar | **Container queries** (`@md:`, `@xl:`, `@3xl:`) | Toolbar adapts to container width, not viewport |
| Pagination | **Viewport queries** (`sm:`, `md:`) | Pagination typically spans full page width |

This follows the **dataflow-extract ReviewHeader pattern** where components adapt to their container size rather than viewport size, enabling proper behavior in modals, split views, and sidebars.

---

## Breakpoints

### Container Query Breakpoints (Primary)

Used for table internals AND toolbar. These respond to the parent container's width.

| Token | Width | Use Case |
|-------|-------|----------|
| `@xs` | < 480px | Mobile phone in portrait |
| `@sm` | ≥ 480px | Large phone / small container |
| `@md` | ≥ 768px | Tablet / enable sticky columns, icon-only buttons |
| `@lg` | ≥ 1024px | Desktop / show frozen indicator |
| `@xl` | ≥ 1280px | Wide desktop / show action buttons, dropdowns |
| `@3xl` | ≥ 1536px | Extra wide / full search input, text labels on buttons |

### Viewport Query Breakpoints (Secondary)

Used primarily for pagination which typically spans full viewport width.

| Token | Width | Use Case |
|-------|-------|----------|
| `sm` | ≥ 640px | Large phone |
| `md` | ≥ 768px | Tablet |
| `lg` | ≥ 1024px | Desktop |
| `xl` | ≥ 1280px | Wide desktop |

---

## Component Responsiveness

### 1. Sticky Columns

**Behavior:**
- **Mobile (< 768px)**: No sticky columns - entire table scrolls horizontally as one unit
- **Tablet+ (≥ 768px)**: Pinned columns stick to left/right edges

**Rationale:** On small screens, sticky columns consume too much horizontal space and reduce usability.

**Implementation:**
```tsx
// Body cells
<td className="@md:sticky @md:left-0 @md:z-20">

// Header cells
<th className="@md:sticky @md:left-0 @md:z-20">
```

**CSS Variable Transforms:**
- Header uses `translateX()` transforms for scroll sync
- These transforms should only apply when sticky is active (≥ 768px)

---

### 2. Horizontal Scrollbar

**Behavior:**
- **Mobile (< 768px)**: Show native scrollbar for touch scrolling
- **Desktop (≥ 768px)**: Hide native scrollbar, show custom styled scrollbar

**Rationale:** Mobile users need visible scrollbar for discoverability; desktop can use custom scrollbar for aesthetics.

**Implementation:**
```tsx
// SyncedScrollContainer
<div className={cn(
  "overflow-x-auto",
  // Hide native scrollbar only on larger screens
  "@md:[&::-webkit-scrollbar]:hidden"
)}>
```

---

### 3. Toolbar (Container Queries)

The toolbar uses container queries to adapt to its container width, following the dataflow-extract ReviewHeader pattern.

**Container Breakpoints:**
- **< @md (< 768px)**: Compact mode
  - Title only (no counts)
  - Search icon → expands to full-width overlay
  - Filter icon (if enabled)
  - All other actions in overflow menu (⋮)
- **@md to @xl (768-1280px)**: Icon-only mode
  - Title with row counts
  - Search icon → overlay
  - Filter, Columns, Density as icon buttons
  - Export/Print/Refresh in overflow menu
- **@xl to @3xl (1280-1536px)**: Expanded icons
  - Full title section
  - Action buttons visible
  - Labeled dropdowns visible
  - Export dropdown inline
- **@3xl+ (≥ 1536px)**: Full mode
  - Inline search input (240px)
  - All buttons with text labels
  - Full segmented controls (if enabled)

**Layout by Container Size:**
```
< @md:    | Title -------- [🔍] [🔧] [⋮] |
@md-@xl:  | Title (counts) | [🔍] | [🔧] [📊] [⚙] [⋮] |
@xl-@3xl: | Title | Actions | Dropdowns | [🔍] | [🔧] [📊] [⚙] [📥] [⋮] |
@3xl+:    | Title | Actions | Dropdowns | [Search input] | [Filter] [Cols] [Density] [Export] [Print] |
```

**Implementation:**
```tsx
// Toolbar has its own @container wrapper
<div className="@container w-full shrink-0 relative">
  <div className="flex items-center gap-2 @md:gap-3 ...">

    {/* Search - icon on small, input on @3xl+ */}
    <button className="@3xl:hidden ...">Search Icon</button>
    <div className="hidden @3xl:flex ...">Search Input</div>

    {/* Controls - progressive disclosure */}
    <div className="hidden @3xl:flex ...">Full controls with labels</div>
    <div className="hidden @xl:flex @3xl:hidden ...">Icon-only controls</div>
    <div className="hidden @md:flex @xl:hidden ...">Core controls only</div>
    <div className="@md:hidden ...">Overflow menu</div>
  </div>
</div>
```

---

### 4. Pagination

**Behavior:**
- **Mobile (< 640px)**: Stacked layout
- **Tablet+ (≥ 640px)**: Horizontal layout

**Layout:**
```
Desktop:  | Showing 1-25 of 100 | [Size ▼] | [◀◀][◀] Page 1/10 [▶][▶▶] |

Mobile (stacked):
┌─────────────────────────────┐
│ Showing 1-25 of 100         │
├─────────────────────────────┤
│ [◀] Page 1 of 10 [▶] [25▼]  │
└─────────────────────────────┘
```

**Implementation:**
```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
  <PaginationInfo />
  <div className="flex items-center justify-between sm:justify-end gap-2">
    <PageSizeSelector />
    <PageButtons />
  </div>
</div>
```

---

### 5. Search Input

**Behavior:**
- **Mobile (< 768px)**:
  - Compact mode: Icon button that opens full-screen overlay
  - Or expandable input that grows on focus
- **Tablet+ (≥ 768px)**: Fixed width input (224px / w-56)

**Implementation:**
```tsx
// Mobile: Use MobileSearchOverlay component
// Desktop: Use SearchInput with fixed width

<SearchInput compact className="md:hidden" />
<SearchInput className="hidden md:flex w-56" />
```

---

### 6. Touch Targets

All interactive elements must meet **48px minimum** touch target size on mobile.

| Element | Current | Required | Status |
|---------|---------|----------|--------|
| Checkbox | 48px | 48px | ✓ |
| Expander | 40px | 48px | ⚠️ Needs fix |
| Drag Handle | 40px | 48px | ⚠️ Needs fix |
| Pagination Buttons | 40px | 48px | ⚠️ Needs fix |
| Page Size Select | 32px | 48px | ⚠️ Needs fix |

**Solution:** Use padding/margin to increase tap area without changing visual size:
```tsx
// Increase tap area with padding
<button className="p-2 -m-2">
  <Icon className="w-5 h-5" />
</button>
```

---

### 7. Column Visibility

**Responsive Column Hiding:**

Columns can define `minVisibleWidth` to auto-hide when container is too narrow:

```tsx
const columns = [
  { key: "name", header: "Name" }, // Always visible
  { key: "email", header: "Email", minVisibleWidth: 600 }, // Hidden < 600px
  { key: "role", header: "Role", minVisibleWidth: 800 }, // Hidden < 800px
  { key: "status", header: "Status", minVisibleWidth: 1000 }, // Hidden < 1000px
];
```

**Priority System (Future):**
```tsx
interface Column {
  responsivePriority?: 1 | 2 | 3 | 4 | 5; // 1 = hide first
  mobileHidden?: boolean;
  tabletHidden?: boolean;
}
```

---

### 8. Row Density

**Auto Density (Future):**
- Mobile: Auto-switch to "compact" density for more rows visible
- Desktop: Use user-selected density

**Current Densities:**
| Density | Row Height | Use Case |
|---------|------------|----------|
| compact | 36px | Mobile, data-dense views |
| standard | 48px | Default |
| comfortable | 56px | Touch-friendly, spacious |

---

## Container Setup

### Adding Container Query Support

The root `DataTableLayout` component must have the `@container` class:

```tsx
// DataTableLayout
<div className="@container relative bg-surface">
  {children}
</div>
```

This enables all child components to use container query classes (`@sm:`, `@md:`, etc.).

---

## Implementation Checklist

### Phase 1: Foundation ✅
- [x] Add `@container` to `DataTableLayout` (already present in TableContainer)
- [x] Define breakpoint constants in `constants/dimensions.ts`
- [x] Update `RESPONSIVE` constants with all breakpoints (CONTAINER and VIEWPORT)
- [x] Add `TOUCH_TARGETS` constants for accessibility

### Phase 2: Table Internals ✅
- [x] Make sticky columns responsive (`@md:sticky`) in header-cell.tsx, row.tsx, table.tsx
- [x] Make scrollbar responsive (native on mobile, custom on tablet+)
- [x] Pinned column transforms only apply on tablet+ (when sticky is active)

### Phase 3: Toolbar ✅
- [x] Add responsive toolbar layout (hidden controls on mobile)
- [x] Implement overflow menu for mobile (MoreActionsDropdown with secondary actions)
- [x] Search input is full-width on mobile, fixed on tablet+

### Phase 4: Pagination ✅
- [x] Implement stacked layout for mobile (flex-col on mobile, flex-row on tablet+)
- [x] First/Last page buttons hidden on mobile
- [x] Compact page indicator on mobile (1/10 format)

### Phase 5: Polish ✅
- [x] Fix all touch target sizes (44px minimum on mobile, standard on desktop)
  - ToolbarDropdownButton, ToolbarTextButton, SegmentedButtons
  - ActionButton, CompactIconButton
  - PageSizeSelector (h-11)
  - Pagination buttons (min-h-[44px])
  - DragHandle (w-10 h-10 on mobile)
  - Expander button (p-2 -m-1 padding trick)
- [ ] Test on actual devices
- [ ] Add responsive column priority system (future)

---

## Testing

### Device Testing Matrix

| Device | Width | Test Focus |
|--------|-------|------------|
| iPhone SE | 375px | Minimum mobile |
| iPhone 14 | 390px | Standard mobile |
| iPad Mini | 768px | Tablet breakpoint |
| iPad Pro | 1024px | Large tablet |
| Desktop | 1280px+ | Full experience |

### Test Scenarios

1. **Horizontal Scroll**: Verify smooth scrolling on touch devices
2. **Sticky Columns**: Verify disabled on mobile, working on tablet+
3. **Toolbar Overflow**: Verify all actions accessible via menu on mobile
4. **Pagination**: Verify stacked layout readable on mobile
5. **Touch Targets**: Verify all buttons easily tappable (48px)
6. **Column Hiding**: Verify columns hide/show at correct widths

---

## CSS Classes Reference

### Container Query Classes (Table)
```css
@xs:*    /* Container < 480px */
@sm:*    /* Container ≥ 480px */
@md:*    /* Container ≥ 768px */
@lg:*    /* Container ≥ 1024px */
@xl:*    /* Container ≥ 1280px */
```

### Viewport Query Classes (Toolbar/Pagination)
```css
sm:*     /* Viewport ≥ 640px */
md:*     /* Viewport ≥ 768px */
lg:*     /* Viewport ≥ 1024px */
xl:*     /* Viewport ≥ 1280px */
```

### Common Patterns
```tsx
// Hide on mobile, show on tablet+
className="hidden md:flex"

// Show on mobile, hide on tablet+
className="flex md:hidden"

// Sticky only on tablet+ (container query)
className="@md:sticky @md:left-0"

// Stack on mobile, row on tablet+
className="flex flex-col sm:flex-row"
```

---

## Related Files

- `constants/dimensions.ts` - Breakpoint definitions
- `components/layout.tsx` - Container setup, scroll sync
- `components/toolbar/index.tsx` - Toolbar responsiveness
- `components/pagination.tsx` - Pagination responsiveness
- `components/row.tsx` - Sticky cell behavior
- `components/header/index.tsx` - Header sticky behavior
- `hooks/ui/use-columns.ts` - Responsive column hiding logic
