# @unisane/data-table Roadmap

This document tracks bugs, improvements, and missing features for the DataTable package.

---

## Priority Legend

- 🔴 **Critical** - Must fix immediately, blocks production use
- 🟠 **High** - Important, should fix soon
- 🟡 **Medium** - Nice to have, plan for next release
- 🟢 **Low** - Future consideration
- ✅ **Done** - Completed
- 🚧 **In Progress** - Currently working on

---

## 1. Critical Bugs 🔴 ✅ COMPLETED

### 1.1 Race Condition in Selection Hook
- [x] **File:** `src/context/hooks/use-selection.ts:17-47`
- **Problem:** Callback fires with calculated state before reducer updates. Rapid selections cause parent to receive stale state.
- **Impact:** Selection inconsistencies in controlled components
- **Fix:**
  - Use `useEffect` to fire callbacks after state update
  - Or use `flushSync` for synchronous dispatch
  ```typescript
  // Current (broken)
  const newSelection = new Set(state.selectedRows);
  newSelection.add(id);
  dispatch({ type: "SELECT_ROW", id });
  onSelectionChange?.(Array.from(newSelection)); // ← Races with dispatch

  // Fixed
  dispatch({ type: "SELECT_ROW", id });
  // Move callback to useEffect that watches state.selectedRows
  ```

---

### 1.2 Cell Key Parsing Bug
- [x] **File:** `src/hooks/ui/use-cell-selection.ts:24-26`
- **Problem:** Uses `:` as separator. Breaks if row ID contains `:` (e.g., `user:1`)
- **Impact:** Data corruption in cell selection
- **Fix:**
  ```typescript
  // Current (broken)
  const [rowId, columnKey] = key.split(":");

  // Fixed - use null byte or double delimiter
  const SEPARATOR = "\x00"; // or "||"
  function cellKey(rowId: string, columnKey: string) {
    return `${rowId}${SEPARATOR}${columnKey}`;
  }
  function parseKey(key: string) {
    const idx = key.indexOf(SEPARATOR);
    return { rowId: key.slice(0, idx), columnKey: key.slice(idx + 1) };
  }
  ```

---

### 1.3 Memory Leak in useColumns
- [x] **File:** `src/context/hooks/use-columns.ts:23-29` - **Verified: Already correctly implemented**
- **Problem:** Window resize listener not properly cleaned up
- **Impact:** Memory leak with multiple table instances
- **Fix:**
  ```typescript
  // Ensure cleanup runs on unmount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setContainerWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  ```
  - Verify the cleanup function is being called

---

### 1.4 Sort State Synchronization Bug
- [x] **File:** `src/context/reducer.ts:85-91` - **Fixed: Refactored cycleSort to use switch statement**
- **Problem:** `sortKey`/`sortDirection` and `sortState` can become inconsistent
- **Impact:** Display shows different sort than actual state
- **Fix:**
  - Use only `sortState` as source of truth
  - Derive `sortKey`/`sortDirection` on-demand for backwards compatibility
  ```typescript
  // Add selector
  function getLegacySort(sortState: MultiSortState) {
    if (sortState.length === 0) return { key: null, direction: null };
    return { key: sortState[0].key, direction: sortState[0].direction };
  }
  ```

---

### 1.5 Missing Null Check in Inline Editing
- [x] **File:** `src/hooks/features/use-inline-editing.ts:136-141`
- **Problem:** No check if `data` is undefined before `.find()`
- **Impact:** Runtime error when data is not yet loaded
- **Fix:**
  ```typescript
  const row = data?.find((r) => r.id === editingCell.rowId);
  ```

---

## 2. High Priority Bugs 🟠 ✅ COMPLETED

### 2.1 Export Silent Failures
- [x] **File:** `src/utils/export/utils.ts` - Added try-catch with cell-level error handling
- **Problem:** If `getCellValue` throws, entire export fails silently
- **Fix:** Add try-catch with cell-level error handling

---

### 2.2 Edit Error Stuck State
- [x] **File:** `src/hooks/features/use-inline-editing.ts` - Added `clearError()` and `retryEdit()` methods
- **Problem:** Validation error persists with no way to clear or retry
- **Fix:** Add `clearError()` method and retry mechanism

---

### 2.3 No Column Validation in Provider
- [x] **File:** `src/context/provider.tsx` - Added validation useEffect with warnings for duplicates/missing headers
- **Problem:** Malformed columns cause runtime errors instead of helpful messages
- **Fix:**
  ```typescript
  // Add validation
  useEffect(() => {
    const errors = validateColumns(columns);
    if (errors.length > 0) {
      console.error("DataTable column errors:", errors);
      throw new InvalidConfigError(errors.join("; "));
    }
  }, [columns]);
  ```

---

### 2.4 Unsafe Array Indexing in getCellsInRange
- [x] **File:** `src/hooks/ui/use-cell-selection.ts` - Added bounds clamping and ref-based data access
- **Problem:** Stale indices when data changes during selection
- **Fix:** Add data version check or use row IDs instead of indices

---

### 2.5 URL.revokeObjectURL Timing
- [x] **File:** `src/utils/export/utils.ts` - Added setTimeout delay before cleanup
- **Problem:** Cleanup happens synchronously, may revoke URL before download completes
- **Fix:**
  ```typescript
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
  ```

---

## 3. Code Quality Improvements 🟡

### 3.1 Inconsistent Error Handling
- [ ] **Files:** Multiple
- **Problem:** Three different patterns (console.error, throw, return error)
- **Fix:** Standardize to one pattern across all hooks/utils

---

### 3.2 Remove Dual Sort State Management ✅
- [x] **File:** `src/context/reducer.ts`
- **Problem:** Maintains both `sortKey/sortDirection` AND `sortState`
- **Fix:** Removed legacy `sortKey`/`sortDirection`, now uses only `sortState: MultiSortState`

---

### 3.3 Remove Dead Code ✅
- [x] `isMobile` state in reducer - removed
- [x] Dual sort state (`sortKey`, `sortDirection`) - removed
- [x] Legacy sort callbacks - removed

---

### 3.4 Performance: Search Debouncing ✅
- [x] **File:** `src/hooks/data/use-processed-data.ts`
- **Problem:** No debouncing on search, recalculates on every keystroke
- **Fix:** Added `searchDebounceMs` option with `useDebounce` hook (default: 0ms for backward compat)

---

### 3.5 Performance: localStorage Async ✅
- [x] **File:** `src/context/provider.tsx`
- **Problem:** Synchronous localStorage writes block UI
- **Fix:** Used `requestIdleCallback` for non-blocking writes

---

### 3.6 Performance: Reduce useMemo Dependencies ✅
- [x] **File:** `src/hooks/data/use-processed-data.ts`
- **Problem:** 8 dependencies trigger full recalculation
- **Fix:** Now has 6 dependencies (removed legacy sort), search is debounced. Sequential processing (search→filter→sort) doesn't benefit from splitting into separate memos.

---

### 3.7 Add Duplicate Sort Prevention ✅
- [x] **File:** `src/context/reducer.ts:60-88`
- **Problem:** `addOrCycleMultiSort` doesn't prevent duplicate columns
- **Fix:** Already implemented - `addOrCycleSortColumn` uses `findIndex` to check for existing columns before adding

---

## 4. Missing Features 🔵

### 4.1 Internationalization (i18n) ✅ COMPLETED
- [x] Create i18n system with string extraction
- [x] Add locale prop to DataTable
- [x] Replace hardcoded strings:
  - [x] "Summary" - footer label
  - [x] "No results found" - empty state
  - [x] "(Empty)" - null values
  - [x] "Yes" / "No" - boolean display
  - [x] Pagination labels
  - [x] Column menu labels
  - [x] Export labels
- [x] Added I18nProvider, useI18n hook, DataTableStrings type
- [x] English (en) and Hindi (hi) locales implemented
- [x] 70+ i18n keys covering all UI strings

---

### 4.2 Accessibility (a11y) Improvements ✅ COMPLETED
- [x] Add `scope="col"` on header cells (already in table.tsx and header-cell.tsx)
- [x] Add `aria-rowcount` and `aria-colcount` (in Table component and DataTableInner)
- [x] Add `aria-sort` on sortable columns (in TableHeaderCell and HeaderCell)
- [x] Add `aria-describedby` for filters (search input already has aria-describedby)
- [x] Improve screen reader announcements (added 9 new i18n keys for SR)
- [x] Add live regions for state changes (assertive live region for sort/filter changes)

---

### 4.3 Row Drag-to-Reorder ✅ COMPLETED
- [x] Add `reorderableRows` prop
- [x] Implement drag handle component (DragHandle)
- [x] Add `onRowReorder` callback
- [x] Support keyboard reordering (Alt+Arrow keys)
- [x] Add useRowDrag hook for drag state management
- [x] Add i18n strings for drag accessibility (dragRowHandle, srRowMoved)

---

### 4.4 Row Numbers Column
- [ ] Add `showRowNumbers` prop
- [ ] Auto-generate row number column
- [ ] Support continuation across pages

---

### 4.5 Tree Data / Hierarchical Rows
- [ ] Add `getSubRows` prop for tree structure
- [ ] Implement indent levels
- [ ] Add expand/collapse for tree nodes
- [ ] Support lazy-load children
- [ ] Keyboard navigation for tree

---

### 4.6 Infinite Scroll
- [ ] Add `infiniteScroll` prop
- [ ] Implement scroll-based loading
- [ ] Add `onLoadMore` callback
- [ ] Show loading indicator at bottom

---

### 4.7 Selection Persistence
- [ ] Add `persistSelection` prop
- [ ] Maintain selection across pages
- [ ] Support selection across filter changes

---

### 4.8 Clipboard Paste
- [ ] Implement paste handler
- [ ] Parse clipboard data
- [ ] Map to cells
- [ ] Validate before applying
- [ ] Add `onPaste` callback

---

### 4.9 Undo/Redo for Editing
- [ ] Add edit history stack
- [ ] Implement undo/redo actions
- [ ] Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- [ ] Add `maxHistorySize` option

---

### 4.10 Filter Presets / Saved Filters
- [ ] Add filter preset management
- [ ] Save/load filter configurations
- [ ] Quick filter buttons
- [ ] Add `filterPresets` prop

---

### 4.11 Compound Filters (AND/OR)
- [ ] Add filter builder UI
- [ ] Support AND/OR logic
- [ ] Nested filter groups
- [ ] Complex filter expressions

---

### 4.12 Column Spanning
- [ ] Add `colSpan` support in cells
- [ ] Handle in virtualization
- [ ] Support in export

---

### 4.13 Sticky Group Headers
- [ ] Add `stickyGroupHeaders` prop
- [ ] Implement sticky positioning
- [ ] Handle with virtualization

---

### 4.14 RTL Support
- [ ] Add `dir` prop
- [ ] Flip layout for RTL
- [ ] Update keyboard navigation
- [ ] Fix pinned columns for RTL

---

### 4.15 Custom Export Formats (Plugin System)
- [ ] Create export plugin interface
- [ ] Allow custom format registration
- [ ] Add export customization options

---

## 5. API Improvements 🟣

### 5.1 Prop Naming Consistency
- [ ] Rename `selectable` → `rowSelectionEnabled`
- [ ] Rename `density` → `rowDensity`
- [ ] Rename `columnBorders` → `showColumnDividers`
- [ ] Add deprecation warnings for old names

---

### 5.2 Missing Callbacks
- [ ] Add `onColumnVisibilityChange`
- [ ] Add `onScroll`
- [ ] Add `onError` (global error handler)
- [ ] Add `onCellEditStart`
- [ ] Add `onDataChange`

---

### 5.3 Type Improvements
- [ ] Use discriminated unions for `FilterValue`
- [ ] Add source metadata to `SortItem`
- [ ] Add branded types for non-empty arrays
- [ ] Improve `CellContext` generic defaults

---

### 5.4 Documentation Gaps
- [ ] Document `disableLocalProcessing`
- [ ] Document `virtualizeThreshold` performance impact
- [ ] Document `headerOffsetClassName` usage
- [ ] Document `estimateRowHeight` guidance
- [ ] Add more code examples

---

## 6. Testing 🧪

### 6.1 Unit Tests
- [ ] Test selection hook race conditions
- [ ] Test cell key parsing edge cases
- [ ] Test sort state synchronization
- [ ] Test export error handling
- [ ] Test inline editing validation

---

### 6.2 Integration Tests
- [ ] Test controlled vs uncontrolled modes
- [ ] Test virtualization with dynamic data
- [ ] Test remote data integration
- [ ] Test keyboard navigation

---

### 6.3 Performance Tests
- [ ] Benchmark with 10k rows
- [ ] Benchmark with 100k rows
- [ ] Profile memory usage
- [ ] Test rapid selection/deselection

---

## Implementation Order

### Phase 1: Critical Bug Fixes (Immediate) ✅ COMPLETED
1. [x] 1.1 Race Condition in Selection Hook
2. [x] 1.2 Cell Key Parsing Bug
3. [x] 1.3 Memory Leak in useColumns
4. [x] 1.4 Sort State Synchronization Bug
5. [x] 1.5 Missing Null Check in Inline Editing

### Phase 2: High Priority Fixes ✅ COMPLETED
6. [x] 2.1-2.5 High priority bugs
7. [x] 4.2 Accessibility improvements (scope, aria-*, live regions, SR announcements)
8. [x] 4.1 i18n support (fully implemented with en/hi locales)

### Phase 3: Code Quality ✅ COMPLETED
9. [x] 3.2-3.5 Completed (removed dual sort, dead code, added debouncing, async localStorage)
10. [x] 3.6-3.7 Already implemented or optimized
11. [ ] 3.1 Error handling standardization (optional - patterns are reasonable)
12. [ ] 5.1-5.4 API improvements

### Phase 4: New Features
13. [x] 4.3 Row drag-to-reorder ✅
14. [ ] 4.5 Tree data
15. [ ] 4.6 Infinite scroll
16. [ ] 4.8 Clipboard paste

### Phase 5: Advanced Features
17. [ ] 4.9 Undo/redo
18. [ ] 4.10-4.11 Advanced filtering
19. [ ] 4.14 RTL support
20. [ ] 4.15 Export plugins

---

## Changelog

### [Unreleased]

#### Fixed
- 1.1 Race condition in selection hook - now uses useEffect for callbacks
- 1.2 Cell key parsing bug - uses null byte separator for safe parsing
- 1.3 Verified memory leak cleanup in useColumns is correct
- 1.4 Sort state synchronization - refactored cycleSort with switch statement
- 1.5 Missing null check in inline editing - added data validation
- 2.1 Export silent failures - added try-catch with cell-level error handling
- 2.2 Edit error stuck state - added clearError() and retryEdit() methods
- 2.3 Column validation - added validation useEffect in provider
- 2.4 Unsafe array indexing in getCellsInRange - added bounds clamping
- 2.5 URL.revokeObjectURL timing - added setTimeout delay

#### Added
- Search debouncing with `searchDebounceMs` option in useProcessedData
- Async localStorage writes using requestIdleCallback
- Complete i18n system with I18nProvider, useI18n hook, DataTableStrings type
- English (en) and Hindi (hi) locale support with 70+ translated strings
- String interpolation support (e.g., `{count}`, `{label}`)
- useDefaultContextMenuItems hook for i18n-aware context menus
- Comprehensive accessibility: scope="col", aria-rowcount/colcount, aria-sort
- Screen reader live regions for sort/filter state change announcements
- 9 new i18n keys for screen reader announcements (srFilterApplied, srRowSelected, etc.)
- useAnnouncer hook for managing screen reader announcements
- Row drag-to-reorder feature with `reorderableRows` prop and `onRowReorder` callback
- DragHandle component for row drag handles
- useRowDrag hook for drag state management
- Keyboard reordering support (Alt+Arrow keys)
- i18n strings for drag accessibility (dragRowHandle, srRowMoved)

#### Changed
- Removed dual sort state (`sortKey`/`sortDirection`), now uses only `sortState: MultiSortState`
- Removed `isMobile` state (dead code)
- Simplified sort API across all components

---

## Contributing

When fixing a bug or adding a feature:

1. Check off the item in this document
2. Add tests for the fix
3. Update the CHANGELOG section
4. Update README.md if API changed
5. Ensure TypeScript types are updated

---

*Last updated: 2026-01-01*
