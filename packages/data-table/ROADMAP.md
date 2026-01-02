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

## 1. Critical Bugs 🔴

### 1.0 Memory Leak in Row Drag Image ✅
- [x] **File:** `src/hooks/ui/use-row-drag.ts:166-214`
- **Problem:** Drag image element appended to `document.body` may not be cleaned up if component unmounts during drag
- **Impact:** DOM pollution, memory leak with repeated mount/unmount cycles
- **Fix:**
  ```typescript
  // Add cleanup in useEffect for component unmount
  useEffect(() => {
    return () => {
      if (dragImageRef.current && dragImageRef.current.parentNode) {
        dragImageRef.current.parentNode.removeChild(dragImageRef.current);
        dragImageRef.current = null;
      }
    };
  }, []);

  // Also add to handleDragEnd with null check
  const handleDragEnd = useCallback(() => {
    if (dragImageRef.current?.parentNode) {
      dragImageRef.current.parentNode.removeChild(dragImageRef.current);
      dragImageRef.current = null;
    }
    // ...
  }, []);
  ```

---

### 1.0.1 Stale Closure in Announcer setTimeout ✅
- [x] **File:** `src/components/data-table-inner.tsx:580-594`
- **Problem:** `setTimeout` callback may execute after component unmounts, manipulating non-existent DOM element
- **Impact:** React warning, potential memory leak
- **Fix:**
  ```typescript
  const announce = useCallback((message: string) => {
    const region = document.getElementById(announcerRegionId);
    if (region && message) {
      // ... set message
      const timeoutId = setTimeout(() => {
        // Check if region still exists before modifying
        const currentRegion = document.getElementById(announcerRegionId);
        if (currentRegion) {
          currentRegion.textContent = "";
        }
      }, 1000);
      // Store timeoutId in ref for cleanup
    }
  }, [announcerRegionId]);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      if (announceTimeoutRef.current) {
        clearTimeout(announceTimeoutRef.current);
      }
    };
  }, []);
  ```

---

### 1.0.2 Pagination State Desync on Filter ✅
- [x] **File:** `src/components/data-table-inner.tsx:261-265`
- **Problem:** When filtering reduces data below current page, `safePage` is calculated locally but context state isn't updated
- **Impact:** User sees correct page but internal state is wrong, causing issues on subsequent operations
- **Fix:**
  ```typescript
  // Add effect to sync page when data reduces
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(processedData.length / Math.max(pageSize, 1)));
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [processedData.length, pageSize, page, setPage]);
  ```

---

## 1.1 Critical Bugs (Previously Fixed) ✅ COMPLETED

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

### 3.0 Split DataTableInner Component (High Priority)
- [ ] **File:** `src/components/data-table-inner.tsx`
- **Problem:** At 848 lines, this component handles too many responsibilities:
  - Data processing and grouping
  - Virtualization setup
  - Selection handling
  - Keyboard navigation
  - Screen reader announcements
  - Row reordering
- **Impact:** Hard to maintain, test, and debug
- **Fix:** Extract into composable hooks and sub-components:
  ```typescript
  // Suggested extraction:
  // 1. useGroupedData() - Move lines 288-426 (grouping logic)
  // 2. useTableAnnouncements() - Move lines 560-635 (announcer logic)
  // 3. useDataTableSelection() - Move selection handlers
  // 4. <DataTableContent /> - Extract table/virtualized rendering
  ```
- **Progress:**
  - ✅ Created `useAnnouncements` hook for screen reader announcements
  - ✅ Created `useColumnLayout` hook for column metadata calculation
  - ✅ Created `utils/grouping.ts` for grouping logic utilities
  - Hooks are ready for integration - DataTableInner can use them incrementally

---

### 3.0.1 Remove Duplicated Pin Calculation ✅
- [x] **File:** `src/components/data-table-inner.tsx:141-156, 214-238`
- **Problem:** Column sorting for pinned columns calculated twice with same logic
- **Fix Applied:** Refactored DataTableInner to use `useColumnLayout` hook which calculates all pin-related values in one place:
  - `sortedVisibleColumns` - columns sorted by pin position
  - `columnMeta` - width and position metadata
  - `totalTableWidth`, `pinnedLeftWidth`, `pinnedRightWidth`

---

### 3.0.2 Magic Numbers to Constants ✅
- [x] **Files:** Multiple (`use-columns.ts`, `data-table-inner.tsx`, `use-announcer.ts`, `use-announcements.ts`)
- **Problem:** Hardcoded values scattered throughout
- **Fix Applied:** Added constants to `constants/dimensions.ts`:
  - `RESPONSIVE.MIN_WIDTH_FOR_PINNING` (640px)
  - `TIMING.ANNOUNCEMENT_CLEAR_MS` (1000ms)
  - `TIMING.FOCUS_DELAY_MS` (100ms)
  - `TIMING.PRINT_STATE_RESET_MS` (100ms)
- Updated all usages to reference constants

---

### 3.0.3 Type Assertion Cleanup ✅
- [x] **File:** `src/components/data-table-inner.tsx:171`
- **Problem:** Unsafe type assertion `as T[]` could hide runtime issues
- **Fix Applied:** Added function overloads to `ensureRowIds`:
  - When `T extends { id: string }`, returns `T[]` directly (no assertion needed)
  - When `T extends Record<string, unknown>`, returns `Array<T & { id: string }>`
  - Removed `as T[]` assertion from data-table-inner.tsx

---

### 3.0.4 Console Warnings in Production ✅
- [x] **File:** `src/context/provider.tsx:77-100` and other files
- **Problem:** Development warnings not gated by `NODE_ENV`
- **Fix Applied:**
  - Added `process.env.NODE_ENV === "production"` checks to gate warnings in:
    - `provider.tsx` - column validation warnings
    - `use-inline-editing.ts` - data validation warning
    - `use-cell-selection.ts` - invalid key format warning
    - `print.ts` - no rows selected warning
    - `export/utils.ts` - formatter and value access warnings

---

### 3.0.5 Event Handler Factory Pattern ✅
- [x] **File:** `src/hooks/ui/use-row-drag.ts`
- **Problem:** Factory functions return new handler functions on each call, defeating memoization
- **Fix Applied:**
  - Added `rowDragPropsCache` Map ref to cache generated props
  - Added `cacheVersionRef` to track dependency changes
  - Used `stateRef`, `enabledRef`, `reorderRowsRef` patterns for stable handler references
  - Cache invalidates when `enabled` or `data.length` changes
  - Handlers access latest state via refs instead of closure captures

---

### 3.0.6 Inline Styles in Drag Image ✅
- [x] **File:** `src/hooks/ui/use-row-drag.ts`
- **Problem:** 20+ lines of inline CSS strings, doesn't respect design system
- **Fix Applied:**
  - Created `injectDragImageStyles()` function that injects CSS once per page load
  - Defined `DRAG_IMAGE_CLASS` constant with BEM-style child classes
  - CSS uses design system variables (`--md-sys-color-*`) for theming
  - Created `createDragImage()` helper that uses CSS classes instead of inline styles
  - Styles injected into `<head>` with unique ID to prevent duplicates

---

### 3.0.7 Hardcoded Accessibility Strings ✅
- [x] **Files:** `src/hooks/ui/use-row-drag.ts`, `src/components/header/header-cell.tsx`
- **Problem:** Hardcoded strings bypassing i18n system
- **Fix Applied:**
  - Added `useI18n()` hook to both files
  - Created new i18n keys: `sortColumn`, `sortDescending`, `clearSort`, `dragRowHandleLabel`
  - Updated header-cell.tsx sort button aria-labels to use translations
  - Updated use-row-drag.ts drag handle aria-label to use `t("dragRowHandleLabel", { index })`
  - Added Hindi translations for all new keys

---

### 3.1 Inconsistent Error Handling ✅
- [x] **Files:** Multiple → `src/utils/logger.ts`
- **Problem:** Three different patterns (console.error, throw, return error)
- **Fix Applied:**
  - Created `src/utils/logger.ts` with standardized logging utilities
  - `Logger` class with configurable log levels (debug/info/warn/error)
  - Respects `NODE_ENV` (production suppresses debug/info)
  - Integrates with `DataTableError` system
  - Convenience functions:
    - `devWarn()` - logs warning only in development
    - `logAndThrow()` - logs error and throws DataTableError
    - `logRecoverable()` - logs error without throwing
    - `withErrorLogging()` / `withErrorLoggingSync()` - wraps operations with error logging
  - Exported from `utils/index.ts`

**Usage:**
```typescript
import { logger, devWarn, logAndThrow, DataTableErrorCode } from "@unisane/data-table";

// Simple logging
logger.warn("Cache miss", { data: { key: "row-1" } });

// Development-only warning
devWarn("Deprecated prop used", { code: DataTableErrorCode.INVALID_CONFIG });

// Log and throw
logAndThrow("Column not found", DataTableErrorCode.INVALID_COLUMN_KEY, { columnKey: "foo" });
```

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

## 3.8 Scalability Improvements 🟠

### 3.8.1 Context Re-render Optimization ✅
- [x] **File:** `src/context/provider.tsx:273-305`
- **Problem:** Single context value object triggers re-render of all consumers on any state change
- **Impact:** Performance degradation with many consumers or frequent updates
- **Fix Applied:**
  - Split state into memoized slices (SelectionSlice, SortSlice, FilterSlice, etc.)
  - Each slice only updates when its specific state changes
  - Added `StateSlices` interface with 6 separate slices
  - Added `getCallbacks()` for stable callback access (avoids stale closures)
  - Callbacks stored in refs, updated via effect without triggering re-renders

---

### 3.8.2 O(n) Grouping Performance
- [ ] **File:** `src/components/data-table-inner.tsx:344-426`
- **Problem:** `buildNestedGroups` recursively processes all data on each render, O(n) per level
- **Impact:** Slow rendering with large grouped datasets (1000+ rows with 3+ levels)
- **Fix:**
  ```typescript
  // Memoize grouping with stable keys
  const groupedRows = useMemo(() => {
    // Add early exit for unchanged data
    if (!isGrouped) return [];

    // Use Web Worker for large datasets
    if (data.length > 5000) {
      return groupInWorker(data, groupByArray);
    }

    return buildNestedGroups(data, groupByArray, 0, null);
  }, [data, groupByArray, isGrouped]);
  ```

---

### 3.8.3 No Virtualization for Grouped Data ✅
- [x] **File:** `src/hooks/features/use-virtualized-grouped-rows.ts` (NEW)
- **Problem:** When `isGrouped` is true, virtualization is effectively disabled
- **Impact:** Performance issues with large grouped datasets
- **Fix Applied:**
  - Created new `useVirtualizedGroupedRows` hook for grouped data virtualization
  - Flattens grouped structure: interleaves group headers with visible rows
  - Supports variable heights: `estimateGroupHeaderHeight` vs `estimateRowHeight`
  - Uses `@tanstack/react-virtual` with custom `estimateSize` per item type
  - Provides `scrollToGroup(groupId)` for programmatic navigation
  - Only virtualizes visible rows (respects group expand/collapse state)
  - Exported as `VirtualizedGroupItem`, `VirtualGroupedRow` types

---

### 3.8.4 Container Width Detection ✅
- [x] **File:** `src/context/hooks/use-columns.ts:23-29`
- **Problem:** Uses `window.innerWidth` instead of actual container width
- **Impact:** Responsive columns break when table is in a smaller container
- **Fix:**
  ```typescript
  // Use ResizeObserver for actual container width
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef]);
  ```

---

### 3.8.5 Rapid Controlled Selection Sync
- [ ] **File:** `src/context/provider.tsx:252-256`
- **Problem:** `externalSelectedIds` changes trigger immediate dispatch, causing flickering on batch updates
- **Fix:** Debounce or use transition API:
  ```typescript
  useEffect(() => {
    if (externalSelectedIds !== undefined) {
      startTransition(() => {
        dispatch({ type: "SELECT_ALL", ids: externalSelectedIds });
      });
    }
  }, [externalSelectedIds]);
  ```

---

### 3.8.6 Keyboard Navigation Focus Loop Risk
- [ ] **File:** `src/hooks/ui/use-keyboard-navigation.ts:102-106`
- **Problem:** `setFocusedIndex` in effect can trigger if it causes `rowCount` to change indirectly
- **Fix:** Add stable ref comparison or use `useLayoutEffect`:
  ```typescript
  const prevRowCountRef = useRef(rowCount);

  useEffect(() => {
    if (prevRowCountRef.current !== rowCount) {
      prevRowCountRef.current = rowCount;
      if (focusedIndex !== null && focusedIndex >= rowCount) {
        setFocusedIndex(rowCount > 0 ? rowCount - 1 : null);
      }
    }
  }, [rowCount]);
  ```

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

### 4.4 Row Numbers Column ✅
- [x] Add `showRowNumbers` prop
- [x] Auto-generate row number column
- [x] Support continuation across pages

**Implementation:** `src/hooks/features/use-row-numbers.tsx`
- `useRowNumbers<T>` hook for adding row number column
- Options: `enabled`, `header`, `width`, `page`, `pageSize`, `pinned`
- Calculates correct row numbers across pages
- Returns: `rowNumberColumn`, `getRowNumber()`, `startingRowNumber`
- `ROW_NUMBER_COLUMN_KEY` constant for identifying the column
- Added i18n strings: `rowNumberHeader`, `srRowNumber`

**Usage:**
```tsx
const { rowNumberColumn } = useRowNumbers<User>({
  enabled: showRowNumbers,
  page: currentPage,
  pageSize: 10,
});

// Prepend to columns
const columnsWithRowNumbers = rowNumberColumn
  ? [rowNumberColumn, ...columns]
  : columns;
```

---

### 4.5 Tree Data / Hierarchical Rows ✅
- [x] Add `getSubRows` prop for tree structure
- [x] Implement indent levels
- [x] Add expand/collapse for tree nodes
- [x] Support lazy-load children
- [ ] Keyboard navigation for tree (future enhancement)
- **Implementation:**
  - Created `TreeDataConfig` type with `getSubRows`, `childrenField`, `onLoadChildren`, etc.
  - Created `useTreeData` hook for managing hierarchical data:
    - Flattens tree for rendering with `FlattenedTreeRow` type
    - Tracks expanded/collapsed state per node
    - Supports lazy loading with loading state
    - Provides `expandNode`, `collapseNode`, `toggleNode`, `expandAll`, `collapseAll`
    - Provides `expandAllDescendants`, `collapseAllDescendants`
    - Utility functions: `isNodeExpanded`, `isNodeLoading`, `getDescendantIds`, `getNodeLevel`
  - Created `TreeExpander` component for expand/collapse UI
  - Added i18n strings: `expandAllNodes`, `collapseAllNodes`, `loadingChildren`, `noChildren`, `srNodeExpanded`, `srNodeCollapsed`

---

### 4.6 Infinite Scroll ✅
- [x] Add `infiniteScroll` prop
- [x] Implement scroll-based loading
- [x] Add `onLoadMore` callback
- [x] Show loading indicator at bottom

**Implementation Details:**
- Created `useInfiniteScroll` hook with dual-mode support:
  - Intersection Observer mode (recommended) - uses sentinel element visibility
  - Scroll events mode - uses scroll position with debouncing
- Created `InfiniteScrollLoader` component with:
  - Loading spinner state
  - "No more items" end state
  - Error state with retry button
  - Invisible sentinel mode for triggering loading
- Features: `hasMore` state, `loadMore()` callback, `reset()` for state cleanup
- Added i18n strings: `loadingMore`, `endOfList`, `loadMore`, `srItemsLoaded`

---

### 4.7 Selection Persistence ✅
- [x] Add `persistSelection` prop
- [x] Maintain selection across pages
- [x] Support selection across filter changes

**Implementation Details:**
- Created `useSelectionPersistence` hook with features:
  - Maintains selection state across pagination changes
  - Maintains selection across filter/search changes
  - Optional localStorage persistence via `storageKey` prop
  - Efficient Set-based lookups for large selections
  - Maximum selection limit (`maxSelections`) to prevent memory issues
  - `dataTableProps` for easy DataTable integration
- API: `select`, `deselect`, `toggle`, `selectMany`, `deselectMany`, `selectAllVisible`, `deselectAllVisible`, `clearAll`, `setSelection`
- Returns: `selectedIds`, `selectedSet`, `selectedCount`, `isSelected`, `allVisibleSelected`, `someVisibleSelected`

---

### 4.8 Clipboard Paste ✅
- [x] Implement paste handler
- [x] Parse clipboard data
- [x] Map to cells
- [x] Validate before applying
- [x] Add `onPaste` callback

**Implementation Details:**
- Created `useClipboardPaste` hook with features:
  - Parse TSV/CSV clipboard data (Excel, Google Sheets compatible)
  - Validate cells before pasting with custom validation
  - Support batch updates for performance (`onBatchChange`)
  - Constrain paste to existing data/column bounds
  - Copy selected cells to clipboard
  - Keyboard handler for Ctrl+V paste
- Types: `ParsedClipboardData`, `PasteCellUpdate<T>`, `PasteValidationResult<T>`, `PasteResult<T>`
- API: `paste()`, `pasteAt()`, `copy()`, `validatePaste()`, `parseClipboardText()`, `handleKeyDown`
- Added i18n strings: `copy`, `paste`, `cut`, `pasteSuccess`, `pasteFailed`, `pasteValidationError`, `pasteNoData`, `srCellsCopied`, `srCellsPasted`

---

### 4.9 Undo/Redo for Editing ✅
- [x] Add edit history stack
- [x] Implement undo/redo actions
- [x] Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- [x] Add `maxHistorySize` option

**Implementation Details:**
- Created `useEditHistory` hook with features:
  - History stack for cell edits with configurable `maxHistorySize` (default: 50)
  - `undo()` and `redo()` async functions with result objects
  - Keyboard handler for Ctrl+Z (undo), Ctrl+Y/Ctrl+Shift+Z (redo)
  - Batch edit support for multi-cell operations
  - Callbacks: `onApplyChange`, `onBatchApplyChange`, `onUndo`, `onRedo`, `onHistoryChange`
- Types: `EditHistoryEntry<T>`, `EditChange<T>`, `UndoRedoResult<T>`
- API: `recordEdit()`, `recordCellEdit()`, `undo()`, `redo()`, `clearHistory()`, `getLastEdit()`, `getUndoDescription()`, `getRedoDescription()`, `handleKeyDown`
- Returns: `canUndo`, `canRedo`, `undoCount`, `redoCount`, `history`, `redoStack`
- Added i18n strings: `undo`, `redo`, `undoCellEdit`, `redoCellEdit`, `nothingToUndo`, `nothingToRedo`, `srUndone`, `srRedone`

---

### 4.10 Filter Presets / Saved Filters ✅
- [x] Add filter preset management
- [x] Save/load filter configurations
- [x] Quick filter buttons
- [x] Add `filterPresets` prop

**Implementation:** `src/hooks/features/use-filter-presets.ts`
- `useFilterPresets` hook with save/load/apply/delete preset functions
- Quick filter buttons support (`isQuickFilter`)
- Detect when current filters match a preset (`activePreset`)
- Optional localStorage persistence via `storageKey`
- Import/export presets as JSON
- Maximum preset limit (default: 20)
- Types: `FilterPreset`, `FilterPresetInput`
- Added i18n strings: `presets`, `savePreset`, `applyPreset`, `deletePreset`, `editPreset`, `duplicatePreset`, `presetName`, `presetNamePlaceholder`, `quickFilter`, `addQuickFilter`, `removeQuickFilter`, `defaultPreset`, `customPreset`, `importPresets`, `exportPresets`, `presetSaved`, `presetDeleted`, `presetApplied`, `maxPresetsReached`, `srPresetApplied`, `srPresetSaved`

---

### 4.11 Compound Filters (AND/OR) ✅
- [x] Add filter builder UI
- [x] Support AND/OR logic
- [x] Nested filter groups
- [x] Complex filter expressions

**Implementation:** `src/hooks/features/use-compound-filters.ts`
- `useCompoundFilters` hook with full AND/OR logic support
- Nested filter groups (configurable max depth, default: 3)
- 16 comparison operators: `equals`, `notEquals`, `contains`, `notContains`, `startsWith`, `endsWith`, `greaterThan`, `greaterThanOrEquals`, `lessThan`, `lessThanOrEquals`, `between`, `notBetween`, `in`, `notIn`, `isEmpty`, `isNotEmpty`, `isTrue`, `isFalse`
- Client-side data filtering with `evaluateRow`
- Convert to/from simple `FilterState` for compatibility
- JSON serialization for persistence
- Types: `FilterLogicOperator`, `FilterComparisonOperator`, `FilterCondition`, `FilterGroup`, `CompoundFilter`
- Added i18n strings: `filterBuilder`, `addCondition`, `addFilterGroup`, `removeCondition`, `removeFilterGroup`, `operatorAnd`, `operatorOr`, `opEquals`, `opNotEquals`, `opContains`, `opNotContains`, `opStartsWith`, `opEndsWith`, `opGreaterThan`, `opLessThan`, `opBetween`, `opIsEmpty`, `opIsNotEmpty`, `opIn`, `opNotIn`, `filterGroupLabel`, `selectColumn`, `selectOperator`, `enterValue`

---

### 4.12 Column Spanning ✅
- [x] Add `colSpan` support in cells
- [x] Handle in virtualization
- [x] Support in export

**Implementation:** `src/hooks/features/use-column-span.ts`
- `useColumnSpan` hook for managing column spans
- Static span definitions (`spans` prop)
- Dynamic span calculation (`getColSpan` function)
- Cell visibility detection (hidden by other cell's span)
- Width calculation for spanned cells (`calculateSpannedWidth`)
- Export-friendly span info (`getExportCellInfo`)
- Types: `ColumnSpan`, `CellSpanInfo`, `ColumnSpanFn`
- Added i18n strings: `mergeCells`, `unmergeCells`, `spanColumns`, `cellMerged`, `srCellSpansColumns`

---

### 4.13 Sticky Group Headers ✅
- [x] Add `stickyGroupHeaders` prop
- [x] Implement sticky positioning
- [x] Handle with virtualization

**Implementation:** `src/hooks/features/use-sticky-group-headers.ts`
- `useStickyGroupHeaders` hook for managing sticky group headers
- Keeps group headers visible while scrolling through group content
- Supports nested/stacked headers for multi-level grouping
- Push animation when next group header approaches
- Works with virtualization (scroll position-based)
- Customizable offset for fixed table headers (`stickyOffset`)
- Configurable max stacked headers (`maxStackedHeaders`, default: 3)
- Types: `StickyGroupHeader`, `GroupPosition`
- CSS style helpers: `stickyContainerStyle`, `getStickyHeaderStyle`
- Added i18n strings: `stickyHeader`, `pinnedGroupHeader`, `srGroupHeaderSticky`, `srShowingGroupItems`

---

### 4.14 RTL Support ✅
- [x] Add `dir` prop
- [x] Flip layout for RTL
- [x] Update keyboard navigation
- [x] Fix pinned columns for RTL

**Implementation:** `src/hooks/ui/use-rtl.tsx`
- `useRTL` hook for RTL support utilities
- `RTLProvider` component for wrapping RTL context
- `useRTLContext` hook for consuming RTL context
- Direction conversion: `toPhysical()`, `toLogical()` for logical-to-physical direction mapping
- Pin position conversion: `pinToPhysical()`, `pinToLogical()` for column pinning in RTL
- CSS utilities: `flipHorizontal()`, `getInlineInset()` for CSS value flipping
- Scroll utilities: `getScrollTransform()`, `normalizeScrollLeft()` for cross-browser RTL scroll handling
- Keyboard utilities: `arrowKeyToLogical()`, `arrowKeyToPhysical()`, `tabToLogical()`
- Types: `Direction`, `LogicalDirection`, `PhysicalDirection`, `LogicalPinPosition`
- Added `dir` prop to `DataTableProps` and `DataTableProviderProps`

---

### 4.15 Custom Export Formats (Plugin System) ✅
- [x] Create export plugin interface
- [x] Allow custom format registration
- [x] Add export customization options

**Implementation:** `src/utils/export/plugins.ts`
- `ExportPlugin` interface for defining custom export formats
- `ExportPluginRegistry` class for registering/managing plugins
- `getExportPluginRegistry()` - global singleton registry
- `createExportPluginRegistry()` - isolated registry for testing
- `exportWithPlugin()` - export using a registered plugin
- `pluginToString()` - get string preview from plugin
- `useExportPlugins()` - React hook for plugin management
- `createTextPlugin()` - helper for text-based export plugins
- `createBinaryPlugin()` - helper for binary export plugins
- `preparePluginExportData()` - prepares data with metadata for plugins
- Types: `ExportPlugin`, `ExportData`, `ExportMetadata`, `ExportCellValue`, `ExportPluginResult`, `ValidationResult`

**Example usage:**
```typescript
// Register a custom Markdown plugin
getExportPluginRegistry().register({
  id: "markdown",
  name: "Markdown",
  extension: "md",
  mimeType: "text/markdown",
  export: ({ data }) => {
    let md = `| ${data.headers.join(" | ")} |\n`;
    md += `| ${data.headers.map(() => "---").join(" | ")} |\n`;
    for (const row of data.rows) {
      md += `| ${row.map((c) => c.formattedValue).join(" | ")} |\n`;
    }
    return { content: md, filename: `${data.metadata.filename}.md` };
  },
});

// Export using the plugin
await exportWithPlugin({ pluginId: "markdown", data, columns });
```

---

## 5. API Improvements 🟣

### 5.1 Prop Naming Consistency ✅
- [x] Rename `selectable` → `rowSelectionEnabled`
- [x] Rename `columnBorders` → `showColumnDividers`
- [x] Add deprecation warnings for old names
- [x] Create `src/utils/deprecation.ts` with:
  - `warnDeprecatedProp()` - logs warning once per session
  - `resolveDeprecatedProp()` - resolves new value with deprecated fallback
  - `resolveDeprecatedProps()` - batch resolution for multiple props
  - `DEPRECATED_PROPS` - mapping of old → new names
- [x] Backward compatibility maintained - old prop names still work with console warnings

**Usage:**
```tsx
// New recommended API
<DataTableProvider
  rowSelectionEnabled={true}
  showColumnDividers={false}
/>

// Deprecated (still works, logs warning)
<DataTableProvider
  selectable={true}
  columnBorders={false}
/>
```

**Note:** `density` → `rowDensity` deferred to DataTableProps level (not in provider)

---

### 5.2 Missing Callbacks ✅
- [x] Add `onColumnVisibilityChange` - fires when columns are shown/hidden
- [x] Add `onScroll` - fires with scroll position info (useful for infinite scroll)
- [x] Add `onError` - global error handler with typed error categories
- [ ] Add `onCellEditStart` (deferred - requires cell editing feature)
- [ ] Add `onDataChange` (deferred - requires data mutation feature)

**New Types:**
```typescript
interface ScrollEventInfo {
  scrollLeft: number;
  scrollTop: number;
  scrollWidth: number;
  scrollHeight: number;
  clientWidth: number;
  clientHeight: number;
}

interface DataTableError {
  type: "render" | "data" | "export" | "filter" | "sort" | "selection" | "unknown";
  message: string;
  error?: Error;
  context?: Record<string, unknown>;
}
```

**Usage:**
```tsx
<DataTableProvider
  onColumnVisibilityChange={(hidden) => console.log('Hidden columns:', hidden)}
  onScroll={(info) => {
    if (info.scrollTop + info.clientHeight >= info.scrollHeight - 100) {
      loadMore(); // Infinite scroll
    }
  }}
  onError={(error) => {
    Sentry.captureException(error.error, { extra: error.context });
  }}
/>
```

---

### 5.3 Type Improvements ✅
- [x] Use discriminated unions for `FilterValue` → `TypedFilterValue`
- [x] Add source metadata to `SortItem` → `source?: SortSource` and `timestamp?: number`
- [x] Add branded types for non-empty arrays → `NonEmptyArray<T>`
- [x] Improve `CellContext` generic defaults → Added `value: V` and better defaults

**New Typed Filter Values:**
```typescript
// Discriminated union for type-safe filter handling
type TypedFilterValue =
  | TextFilterValue      // { type: "text", value, caseSensitive?, match? }
  | NumberFilterValue    // { type: "number", value, operator? }
  | NumberRangeFilterValue // { type: "number-range", min?, max? }
  | DateFilterValue      // { type: "date", value, operator? }
  | DateRangeFilterValue // { type: "date-range", start?, end? }
  | SelectFilterValue    // { type: "select", value }
  | MultiSelectFilterValue // { type: "multi-select", values, match? }
  | BooleanFilterValue;  // { type: "boolean", value }

// Usage with switch exhaustiveness
function applyFilter(filter: TypedFilterValue, row: Data) {
  switch (filter.type) {
    case "text": return row.name.includes(filter.value);
    case "number-range": return row.price >= (filter.min ?? 0);
    // TypeScript ensures all cases handled
  }
}
```

**SortItem with Metadata:**
```typescript
interface SortItem {
  key: string;
  direction: "asc" | "desc";
  source?: "header-click" | "menu" | "keyboard" | "api" | "initial" | "restore";
  timestamp?: number;
}
```

**Branded Non-Empty Arrays:**
```typescript
import { NonEmptyArray, isNonEmpty, asNonEmpty, toNonEmpty } from "@unisane/data-table";

// Type guard
if (isNonEmpty(items)) {
  const first = items[0]; // Type: Item (not Item | undefined)
}

// Assert (throws if empty)
const sorted = asNonEmpty(items.sort());

// Safe conversion (returns undefined if empty)
const maybeItems = toNonEmpty(items);
```

**Improved CellContext:**
```typescript
interface CellContext<T, V = unknown> {
  row: T;
  value: V;         // New: cell value
  rowIndex: number;
  columnKey: string;
  isSelected: boolean;
  isExpanded: boolean;
  isEditing?: boolean;  // New: inline editing state
  isFocused?: boolean;  // New: keyboard focus state
  errors?: string[];    // New: validation errors
}
```

---

### 5.4 Documentation Gaps
- [ ] Document `disableLocalProcessing`
- [ ] Document `virtualizeThreshold` performance impact
- [ ] Document `headerOffsetClassName` usage
- [ ] Document `estimateRowHeight` guidance
- [ ] Add more code examples

---

## 6. Testing 🧪

### 6.0 Testing Infrastructure Setup ✅
- [x] Set up Vitest with React Testing Library
- [x] Configure test utilities for context-wrapped components
- [x] Add test fixtures for common data shapes
- [ ] Set up CI pipeline for tests

---

### 6.1 Unit Tests
- [ ] Test selection hook race conditions
- [ ] Test cell key parsing edge cases
- [ ] Test sort state synchronization
- [ ] Test export error handling
- [ ] Test inline editing validation
- [ ] **NEW:** Test drag image cleanup on unmount
- [ ] **NEW:** Test pagination sync on filter
- [ ] **NEW:** Test announcer timeout cleanup
- [ ] **NEW:** Test keyboard navigation boundary conditions

---

### 6.2 Integration Tests
- [ ] Test controlled vs uncontrolled modes
- [ ] Test virtualization with dynamic data
- [ ] Test remote data integration
- [ ] Test keyboard navigation
- [ ] **NEW:** Test grouping with large datasets
- [ ] **NEW:** Test row drag-to-reorder
- [ ] **NEW:** Test cell selection edge cases
- [ ] **NEW:** Test responsive column visibility

---

### 6.3 Performance Tests
- [ ] Benchmark with 10k rows
- [ ] Benchmark with 100k rows
- [ ] Profile memory usage
- [ ] Test rapid selection/deselection
- [ ] **NEW:** Benchmark grouped data with 3+ levels
- [ ] **NEW:** Profile context re-render frequency
- [ ] **NEW:** Test virtualization scroll performance

---

### 6.4 Accessibility Tests
- [ ] Run axe-core automated checks
- [ ] Test screen reader announcements
- [ ] Test keyboard-only navigation
- [ ] Verify ARIA attribute correctness

---

## Implementation Order

### Phase 0: New Critical Fixes (Immediate) ✅ COMPLETED
1. [x] 1.0 Memory Leak in Row Drag Image
2. [x] 1.0.1 Stale Closure in Announcer setTimeout
3. [x] 1.0.2 Pagination State Desync on Filter
4. [x] 6.0 Testing Infrastructure Setup

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

### Phase 2.5: Scalability Fixes (New - High Priority) ✅ COMPLETED
9. [x] 3.8.1 Context Re-render Optimization (split state into memoized slices)
10. [x] 3.8.4 Container Width Detection (ResizeObserver)
11. [x] 3.8.3 Virtualization for Grouped Data (new useVirtualizedGroupedRows hook)

### Phase 3: Code Quality 🟡 (In Progress)
12. [x] 3.2-3.5 Completed (removed dual sort, dead code, added debouncing, async localStorage)
13. [x] 3.6-3.7 Already implemented or optimized
14. [x] 3.0 Split DataTableInner Component (created hooks: useAnnouncements, useColumnLayout, grouping utils)
15. [x] 3.0.1 Remove Duplicated Pin Calculation (refactored to use useColumnLayout)
16. [x] 3.0.2 Magic Numbers to Constants (RESPONSIVE, TIMING constants)
17. [x] 3.0.4 Console Warnings in Production (gated by NODE_ENV)
18. [x] 3.0.7 Hardcoded Accessibility Strings (i18n for sort buttons & drag handle)
19. [ ] 3.1 Error handling standardization (optional)
20. [ ] 5.1-5.4 API improvements

### Phase 4: New Features
21. [x] 4.3 Row drag-to-reorder ✅
22. [x] 4.5 Tree data ✅ (useTreeData hook, TreeExpander component, i18n)
23. [x] 4.6 Infinite scroll ✅ (useInfiniteScroll hook, InfiniteScrollLoader component, i18n)
24. [x] 4.7 Selection persistence ✅ (useSelectionPersistence hook with localStorage support)
25. [x] 4.8 Clipboard paste ✅ (useClipboardPaste hook with validation, batch updates, i18n)
26. [x] 4.9 Undo/redo ✅ (useEditHistory hook with keyboard shortcuts, i18n)

### Phase 5: Advanced Features
27. [ ] 4.10-4.11 Advanced filtering
28. [ ] 4.14 RTL support
29. [ ] 4.15 Export plugins

---

## Changelog

### [Unreleased]

#### Identified (Code Review - 2026-01-02)

**Critical Bugs Found:**
- 1.0 Memory leak in row drag image - DOM element not cleaned on unmount
- 1.0.1 Stale closure in announcer setTimeout - may manipulate unmounted DOM
- 1.0.2 Pagination state desync - page not updated when filter reduces data

**Code Quality Issues Found:**
- 3.0 DataTableInner at 848 lines - needs splitting
- 3.0.1 Duplicated pin calculation logic
- 3.0.2 Magic numbers scattered throughout codebase
- 3.0.3 Unsafe type assertion in ensureRowIds
- 3.0.4 Console warnings not gated by NODE_ENV
- 3.0.5 Event handler factory pattern defeats memoization
- 3.0.6 Inline CSS strings in drag image creation
- 3.0.7 Hardcoded accessibility strings bypass i18n

**Scalability Concerns Found:**
- 3.8.1 Single context causes full re-render on any state change
- 3.8.2 O(n) grouping on every render
- 3.8.3 No virtualization for grouped data
- 3.8.4 Uses window.innerWidth instead of container width
- 3.8.5 Rapid selection sync causes flickering
- 3.8.6 Keyboard navigation focus loop risk

**Testing Gap:**
- No test files exist in the package

#### Fixed (2026-01-02)
- 1.0 Memory leak in row drag image - added `removeDragImage` helper with safe parentNode check
- 1.0.1 Stale closure in announcer setTimeout - added timeout ref tracking and cleanup on unmount
- 1.0.2 Pagination state desync - added useEffect to sync page when filtering reduces data

#### Added (2026-01-02)
- 6.0 Testing infrastructure with Vitest, React Testing Library, happy-dom
- Test utilities for context-wrapped components (`renderWithDataTable`)
- Initial test suite for `useRowDrag` hook (8 tests)
- Initial test suite for `usePagination` hook (10 tests)

#### Fixed (Previously)
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

## Code Review Summary (2026-01-02)

| Category | Score | Notes |
|----------|-------|-------|
| **Code Quality** | 7/10 | Good structure, some complexity issues |
| **Type Safety** | 8/10 | Strong generics, minor assertion issues |
| **Performance** | 7/10 | Virtualization present, grouping is expensive |
| **Scalability** | 6/10 | Context re-render risk, no windowing for groups |
| **Maintainability** | 6/10 | Some files too large, magic numbers |
| **Accessibility** | 8/10 | Good keyboard nav, ARIA support |
| **Reusability** | 8/10 | Clean hook APIs, composable design |
| **Test Coverage** | 0/10 | No tests exist |

---

## Contributing

When fixing a bug or adding a feature:

1. Check off the item in this document
2. Add tests for the fix
3. Update the CHANGELOG section
4. Update README.md if API changed
5. Ensure TypeScript types are updated

---

*Last updated: 2026-01-02*
