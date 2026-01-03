# @unisane/data-table Roadmap

This document tracks bugs, improvements, and missing features for the DataTable package.

---

## Priority Legend

- 🔴 **Critical** - Must fix immediately, blocks production use
- 🟠 **High** - Important, should fix soon
- 🟡 **Medium** - Nice to have, plan for next release
- 🟢 **Low** - Future consideration
- ✅ **Fixed** - Completed

---

## Overall Score: 7.5/10 - Production-ready with optimization needed

| Category | Score | Notes |
|----------|-------|-------|
| Architecture | 8/10 | Well-structured, good separation of concerns |
| Type Safety | 7/10 | Good but has some type assertions |
| Performance | 6/10 | Virtualization good, but re-render optimization needed |
| Maintainability | 7/10 | Good documentation, some large components |
| Scalability | 7/10 | Handles medium datasets well, edge cases need work |
| Error Handling | 9/10 | Excellent error code system |
| i18n/a11y | 9/10 | Strong ARIA support, full i18n |

---

## 1. Critical Bugs ✅

### 1.1 Cell Key Separator Inconsistency ✅
- **Files:**
  - `src/hooks/ui/use-cell-selection.ts`
  - `src/hooks/features/use-inline-editing.ts`
  - `src/components/row.tsx`
- **Fix:** Created centralized `CELL_ID_SEPARATOR`, `createCellId()`, `getCellSelector()` utilities in `constants/dimensions.ts`. All files now use `||` separator consistently. Also fixed bug where `data-cell-id` was only set when `cellSelectionEnabled` was true, now also set when `isEditable` is true.

### 1.2 Missing Dependency Array in Callback Ref Update ✅
- **File:** `src/context/provider.tsx`
- **Fix:** Removed useEffect entirely and update ref synchronously during render (safe because refs don't trigger re-renders). Added clear documentation explaining the pattern.

---

## 2. High Priority Bugs 🟠

### 2.1 Potential Race Condition in Selection Sync
- **File:** `src/context/provider.tsx:277-283`
- **Problem:** `startTransition` may cause selection state to lag behind during rapid updates
- **Fix:** Consider using `flushSync` for critical selection updates or debounce external changes

### 2.2 Stale Closure Risk in getCellsInRange
- **File:** `src/hooks/ui/use-cell-selection.ts:110-159`
- **Problem:** Mixing refs and dependencies in useCallback can lead to confusing behavior
- **Fix:** Either use only refs OR only dependencies, not both

### 2.3 Type Assertion in Context Provider ✅
- **File:** `src/context/provider.tsx`
- **Fix:** Added explicit `<unknown>` type parameter to context creation. The cast is still required (React Context doesn't support generics well) but is now properly documented explaining why it's safe. Changed context type from `DataTableContextValue | null` to `DataTableContextValue<unknown> | null`.

---

## 3. Performance Issues ✅

### 3.1 Row Component Re-render Optimization ✅
- **File:** `src/components/row.tsx`
- **Fix:** Simplified memo comparison function:
  - Reduced from 30+ prop comparisons to ~15 essential comparisons
  - Grouped comparisons by category (state, position, visual, drag, structural)
  - Removed callback comparisons (parent should memoize callbacks)
  - Added documentation explaining the optimization strategy

### 3.2 Deep Equality Check in Inline Editing ✅
- **File:** `src/hooks/features/use-inline-editing.ts`
- **Fix:** Replaced custom 70-line `isEqual` function with `dequal` library (~1KB, highly optimized)

### 3.3 Column Reference Stability ✅
- **Files:** `src/hooks/data/use-processed-data.ts`, `src/types/props.ts`
- **Fix:** Added comprehensive JSDoc documentation with examples:
  - Explained why memoization is required
  - Provided good/bad code examples
  - Added to both the hook options and main DataTableProps

### 3.4 DOM Queries for Focus Management
- **File:** `src/hooks/features/use-inline-editing.ts`
- **Status:** Deferred - acceptable trade-off
- **Reason:** DOM queries only run once per edit commit (not in render loop), query is fast (single attribute selector), and alternative (cell registry with refs) adds significant complexity for minimal gain. Added documentation explaining this decision.

---

## 4. Code Quality Issues 🟡

### 4.1 Repeated Pagination Bounds Check ✅
- **Files:** `src/components/data-table-inner.tsx:199-203, 210-214`
- **Fix:** Created `src/utils/pagination.ts` with `getTotalPages()`, `clampPage()`, `getPageIndices()`, and `getPaginationState()` utilities. Updated `data-table-inner.tsx` to use these utilities.

### 4.2 Magic Numbers in Cell Selection ✅
- **File:** `src/hooks/ui/use-cell-selection.ts`
- **Fix:** Replaced hardcoded `PAGE_SIZE = 10` with `DEFAULT_KEYBOARD_PAGE_SIZE` from `constants/keyboard.ts`

### 4.3 Implicit Type Assertions in Filter Handling
- **File:** `src/hooks/data/use-processed-data.ts:417-423`
- **Problem:** `as { min?: number | string; max?: number | string }` instead of proper narrowing
- **Fix:** Use type guards for proper narrowing

### 4.4 Inconsistent Prop Naming ✅
- **Status:** Reviewed and deemed acceptable pattern
- **Rationale:** Public API uses descriptive `rowSelectionEnabled` for consumers, while internal components use shorter `selectable` for brevity. This is a common public/private naming convention that reduces verbosity in internal code without affecting the public API.

---

## 5. Scalability Improvements ✅

### 5.1 Virtual Column Integration ✅
- **Status:** Integrated
- **File:** `src/hooks/features/use-virtualized-columns.ts`
- **Integration:**
  - Added `virtualizeColumns` (default: `false`) and `virtualizeColumnsThreshold` (default: `20`) props to `DataTableProps`
  - Integrated `useVirtualizedColumns` hook into `DataTableInner`
  - Binary search for visible columns, overscan buffer, pinned column support
  - Padding applied for off-screen columns
- **When to use:** Tables with 20+ columns where horizontal scrolling is common
- **Usage:**
  ```tsx
  <DataTable
    virtualizeColumns={true}
    virtualizeColumnsThreshold={20}
    // ...
  />
  ```

### 5.2 Selection State Memory Optimization ✅
- **Status:** Integrated
- **File:** `src/hooks/features/use-sparse-selection.ts`
- **Integration:**
  - Added `sparseSelection` prop to `DataTableProps` accepting `SparseSelectionController`
  - `useSelection` hook automatically uses sparse selection when provided
  - O(1) select-all, O(1) isSelected checks, constant memory regardless of selection size
- **When to use:** Tables with 100K+ rows where select-all is common
- **Usage:**
  ```tsx
  import { DataTable, useSparseSelection } from "@unisane/data-table";

  const sparseSelection = useSparseSelection({
    totalCount: 100000,
    onSelectionChange: handleChange,
  });

  <DataTable
    data={data}
    columns={columns}
    sparseSelection={sparseSelection}
  />
  ```

### 5.3 Text Search Optimization ✅
- **Status:** Documented and optimized
- **File:** `src/hooks/data/use-processed-data.ts`
- **Current Optimizations:**
  1. **Debounce:** `searchDebounceMs` prop (defaults to 0, set to 300+ for large datasets)
  2. **Short-circuit:** Returns on first column match (O(1) best case per row)
  3. **Column map cache:** O(1) column lookups vs O(n) scan
- **Recommendation:** For 100K+ rows, use `mode="remote"` with server-side search
- **Usage:**
  ```tsx
  // For client-side large datasets
  <DataTable
    searchDebounceMs={300}
    // ...
  />

  // For very large datasets (100K+), use remote mode
  <DataTable
    mode="remote"
    onSearchChange={handleServerSearch}
    // ...
  />
  ```

---

## 6. Maintainability Improvements ✅

### 6.1 Further Split DataTableInner Component ✅
- **File:** `src/components/data-table-inner.tsx` (now ~665 lines)
- **Status:** Partially completed
- **Extracted:**
  - ✅ `StatusAnnouncer` - Screen reader status and announcement regions (`src/components/status-announcer.tsx`)
- **Already well-structured via hooks:**
  - `useKeyboardNavigation` - Keyboard handling is already extracted to a hook
  - `useVirtualizedRows` - Virtualization logic is already in a dedicated hook
  - `useColumnLayout` - Column layout calculations are in a dedicated hook
- **Remaining (low value):**
  - Virtualized wrapper could be extracted but provides minimal benefit since it's just conditional rendering

### 6.2 Circular Import Prevention
- **Problem:** index.ts exports everything, internal files import from types/index
- **Fix:** Use barrel files more carefully, consider import/export linting rules

### 6.3 Error Boundaries ✅
- **Status:** Already implemented as `DataTableErrorBoundary` component
- **Rationale:** Section-level error boundaries (Header, Body, Toolbar) were considered but deemed unnecessary because:
  1. If any section fails, the entire table is unusable - no graceful degradation is possible
  2. Adding internal boundaries would complicate code and add runtime overhead
  3. `DataTableErrorBoundary` is exported for consumers to wrap the entire table at the appropriate app boundary
- **Usage:** Consumers should wrap `<DataTable>` with `<DataTableErrorBoundary>` at their discretion

---

## 7. Security Considerations ✅

### 7.1 XSS in Custom Renderers Documentation ✅
- **Fix:** Added "Security Considerations" section to README.md covering:
  - XSS prevention in custom renderers
  - Server-side validation requirements
  - CSV formula injection awareness
  - Export data filtering recommendations

---

## 8. Documentation Gaps ✅

### 8.1 Documentation Updates (README.md)
- [x] Add performance tuning guide (column memoization, virtualization, remote data)
- [x] Add security documentation (XSS, validation, export security)
- [x] Add error handling guide (ErrorBoundary, inline editing errors)
- [x] Document column reference stability requirements
- [x] Document `virtualizeThreshold` and `estimateRowHeight`
- [x] Document `disableLocalProcessing` for remote mode
- [x] Update Known Issues section (resolved vs current limitations)

### 8.2 Remaining Documentation
- [ ] Document `headerOffsetClassName` usage (minor)
- [ ] Add WCAG compliance checklist (a11y audit needed first)

---

## 9. Testing 🧪

### 9.1 Unit Tests Needed
- [ ] Test cell key parsing with special characters (both separators)
- [ ] Test selection sync race conditions
- [ ] Test pagination bounds clamping
- [ ] Test inline editing focus restoration
- [ ] Test deep equality edge cases (circular refs, large objects)
- [ ] Test filter type narrowing

### 9.2 Integration Tests Needed
- [ ] Test controlled vs uncontrolled modes
- [ ] Test virtualization with dynamic data
- [ ] Test remote data integration
- [ ] Test keyboard navigation
- [ ] Test grouping with large datasets
- [ ] Test row drag-to-reorder
- [ ] Test cell selection edge cases
- [ ] Test responsive column visibility

### 9.3 Performance Tests Needed
- [ ] Benchmark with 10K rows
- [ ] Benchmark with 100K rows
- [ ] Profile memory usage with sparse vs Set selection
- [ ] Test rapid selection/deselection
- [ ] Benchmark grouped data with 3+ levels
- [ ] Profile context re-render frequency
- [ ] Measure row component re-render counts

### 9.4 Accessibility Tests Needed
- [ ] Run axe-core automated checks
- [ ] Test screen reader announcements
- [ ] Test keyboard-only navigation
- [ ] Verify ARIA attribute correctness

---

## Implementation Priority

### Phase 1: Critical Fixes ✅ COMPLETED
1. ✅ Fix cell key separator inconsistency (1.1)
2. ✅ Fix missing dependency array (1.2)
3. ✅ Fix type assertion in context (2.3)

### Phase 2: Performance ✅ COMPLETED
1. ✅ Row component re-render optimization (3.1) - simplified memo comparison
2. ✅ Replace custom isEqual with dequal (3.2) - added dequal dependency
3. ✅ Document column reference stability (3.3) - added JSDoc with examples
4. ⏸️ DOM queries for focus (3.4) - deferred, acceptable trade-off

### Phase 3: Code Quality ✅ COMPLETED
1. ✅ Extract pagination bounds utility (4.1) - created `src/utils/pagination.ts`
2. ✅ Fix magic numbers (4.2) - use `DEFAULT_KEYBOARD_PAGE_SIZE` constant
3. ✅ Standardize prop naming (4.4) - reviewed, current pattern is acceptable
4. ✅ Error boundaries (6.3) - already implemented, documented usage pattern

### Phase 4: Scalability ✅ COMPLETED
1. ✅ Virtual columns (5.1) - integrated `useVirtualizedColumns` into `DataTableInner`
2. ✅ Sparse selection (5.2) - integrated via `sparseSelection` prop with full `useSelection` support
3. ✅ Text search (5.3) - documented existing optimizations (debounce, short-circuit, column map)
4. ✅ Component splitting (6.1) - extracted `StatusAnnouncer`, other logic already in hooks

### Phase 5: Documentation ✅ COMPLETED
1. ✅ Performance tuning guide - added to README.md
2. ✅ Security documentation - added to README.md
3. ✅ Error handling guide - added to README.md
4. ⏸️ Comprehensive test suite - deferred (see Section 9)

### Phase 6: Additional Bug Fixes ✅ COMPLETED
1. ✅ Fix unsafe MouseEvent cast in keyboard activation
   - Created `RowActivationEvent` discriminated union type
   - Updated `onRowClick` signature to use proper typing: `(row, activation) => void`
   - Consumers can now distinguish mouse vs keyboard activation via `activation.source`
2. ✅ Fix non-null assertions in useSelection
   - Replaced `sparseSelection!` with proper null checks
   - Used optional chaining for return values
3. ✅ Fix RAF memory leak in useVirtualizedColumns
   - Added `isMountedRef` to prevent setState after unmount
   - Protected both scroll handler and ResizeObserver callback
4. ✅ Fix redundant null check in useProcessedData
   - Simplified guard to only check `data.length === 0`

---

## Contributing

When fixing a bug or adding a feature:

1. Check off the item in this document
2. Add tests for the fix
3. Update the CHANGELOG section in README
4. Update README.md if API changed
5. Ensure TypeScript types are updated

---

*Last updated: 2026-01-04*
