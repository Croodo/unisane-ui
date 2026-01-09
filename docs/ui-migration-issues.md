# Unisane UI & DataTable Migration Issues

This document tracks issues discovered during the migration from shadcn to Unisane UI in saaskit.

## Unisane UI Issues

### 1. Missing shadcn-compatible Component APIs

Many components use a props-based API that differs from shadcn's children-based composition pattern. This caused significant compatibility issues.

#### Dialog Component
- **Issue**: Unisane UI Dialog uses `open`, `onClose`, `title`, `children`, `actions` as props
- **shadcn Pattern**: Uses composition with `<Dialog><DialogTrigger /><DialogContent /></Dialog>`
- **Fix Applied**: Created both `ControlledDialog` (original API) and `ShadcnDialog` (composition API), exported `ShadcnDialog as Dialog`

#### Popover Component
- **Issue**: Uses `trigger` and `content` as required props
- **shadcn Pattern**: Uses `<Popover><PopoverTrigger /><PopoverContent /></Popover>`
- **Fix Applied**: Created ShadcnPopover with context-based children detection

#### Select Component
- **Issue**: Uses `options` array prop
- **shadcn Pattern**: Uses `<Select><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem /></SelectContent></Select>`
- **Fix Applied**: Created ShadcnSelect with SelectContext

#### Avatar Component
- **Issue**: Uses `src`, `name`, `size` props
- **shadcn Pattern**: Uses `<Avatar><AvatarImage /><AvatarFallback /></Avatar>`
- **Fix Applied**: Created smart Avatar that detects API pattern

### 2. Sidebar Component Issues

#### Missing Props
- **variant**: Should support `"sidebar" | "floating" | "inset"`
- **collapsible**: Should support `"offcanvas" | "icon" | "none"`

#### Missing State Property
- **Issue**: `useSidebar()` returns `expanded: boolean` but shadcn expects `state: "expanded" | "collapsed"`
- **Fix Applied**: Added derived `state` property

#### SidebarMenuItem Pattern
- **Issue**: Original required `label`, `icon`, `href` props
- **shadcn Pattern**: SidebarMenuItem is just an `<li>` wrapper, content goes in SidebarMenuButton
- **Fix Applied**:
  - Renamed original to `SidebarNavItem`
  - Created new `SidebarMenuItem` as simple wrapper
  - Created `SidebarMenuButton` with `asChild`, `isActive`, `tooltip`, `size`, `variant` props

#### Missing Export
- **SidebarGroupContent**: shadcn pattern exports this as alias for SidebarContent
- **Fix Applied**: Added re-export in index.ts

### 3. DropdownMenu Issues

#### Missing Controlled State
- **Issue**: No `open` and `onOpenChange` props for controlled state
- **Fix Applied**: Added controlled state support

#### Missing Positioning Props
- **Issue**: DropdownMenuContent missing `side`, `sideOffset`, `align` props
- **Fix Applied**: Added these props with positioning logic

### 4. IconButton Issues

#### Missing Variants
- **Issue**: No `"text"` or `"ghost"` variants
- **shadcn Pattern**: Often uses `variant="ghost"` for icon buttons
- **Fix Applied**: Added variant aliases

#### Required ariaLabel
- **Issue**: `ariaLabel` was required, but shadcn pattern often uses children for accessibility
- **Fix Applied**: Made `ariaLabel` optional

### 5. Typography Issues

#### Missing `as` Prop
- **Issue**: Uses `component` prop for element type
- **shadcn Pattern**: Uses `as` prop
- **Fix Applied**: Added `as` as alias for `component`

### 6. Slot Component Issues

#### Missing ref Support
- **Issue**: Slot component didn't forward refs
- **Fix Applied**: Converted to `forwardRef` pattern

### 7. exactOptionalPropertyTypes Compatibility

Many interfaces had optional properties defined as `prop?: Type` without `| undefined`, causing issues with TypeScript's `exactOptionalPropertyTypes: true` setting.

#### Files Affected:
- `theme-provider.tsx` - ThemeConfig interface
- `dialog.tsx` - DialogProps interface
- `ripple.tsx` - RippleProps interface
- `date-input.tsx` - DateInputProps, SegmentProps
- `calendar.tsx` - CalendarProps
- `select.tsx` - SelectContext type
- `skeleton.tsx` - SkeletonProps

#### Fix Pattern:
```typescript
// Before
interface Props {
  className?: string;
}

// After
interface Props {
  className?: string | undefined;
}
```

### 8. Button Variant Issues

#### Missing "secondary" and "outline" Variants
- **Issue**: Different variant naming than shadcn
- **Fix Applied**: Added variant aliases in CVA variants

### 9. Badge Variant Issues

#### Missing Variant Names
- **Issue**: Uses `"info"`, `"success"`, etc. instead of shadcn's `"default"`, `"secondary"`, `"destructive"`
- **Fix Applied**: Added shadcn variant aliases

---

## @unisane/data-table Issues

### 1. Column Alignment

#### Type Incompatibility
- **Issue**: DataTable expects `align?: "start" | "center" | "end"` but common usage is `"left" | "center" | "right"`
- **Consumer Impact**: Columns with `align: "left"` cause TypeScript errors

### 2. Missing Callback Props

#### onRowClick
- **Issue**: No `onRowClick` callback for row click handling
- **Current Workaround**: Use custom cell renderer with click handler

#### onSelectionChange
- **Issue**: Selection state changes don't have callback
- **Current Workaround**: Use controlled selection with external state

### 3. Missing Column Features

#### Cell Renderer Signature
- **Issue**: Cell renderer receives minimal context
- **Desired**: Access to row data, column def, table instance

### 4. Sorting API

#### sortDescFirst
- **Issue**: No way to set default sort direction per column
- **Workaround**: Use initialSortState

---

## Recommendations for Unisane UI Library

1. **Export Both APIs**: For all composite components, export both:
   - Props-based API (simpler for basic usage)
   - Composition API (shadcn-compatible)

2. **Smart Components**: Use pattern detection to auto-select API:
   ```typescript
   if ('children' in props && !('options' in props)) {
     return <CompositionVersion {...props} />;
   }
   return <PropsVersion {...props} />;
   ```

3. **Add exactOptionalPropertyTypes Support**: Add `| undefined` to all optional interface properties

4. **Add Variant Aliases**: Support common shadcn variant names as aliases

5. **Document Migration Path**: Provide guide for migrating from shadcn to Unisane UI

---

## Recommendations for @unisane/data-table

1. **Add Alignment Aliases**: Support both `"left"/"right"` and `"start"/"end"`

2. **Add Callback Props**:
   - `onRowClick`
   - `onSelectionChange`
   - `onSortChange`

3. **Enhanced Cell Context**: Pass full row data and table instance to cell renderers

4. **Column Configuration**: Add `sortDescFirst`, `enableHiding`, etc.
