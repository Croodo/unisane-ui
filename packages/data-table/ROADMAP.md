# @unisane/data-table Roadmap

This document tracks bugs, improvements, and missing features for the DataTable package.

---

## Priority Legend

- 🔴 **Critical** - Must fix immediately, blocks production use
- 🟠 **High** - Important, should fix soon
- 🟡 **Medium** - Nice to have, plan for next release
- 🟢 **Low** - Future consideration
- 🚧 **In Progress** - Currently working on

---

## Overall Score: 7.1/10 - Production-ready with caveats

| Category | Score | Notes |
|----------|-------|-------|
| Code Quality | 8/10 | Good TypeScript, some duplication, error handling gaps |
| Architecture | 7/10 | Clean structure, race conditions in controlled mode |
| Performance | 7/10 | Good virtualization, filter performance needs work |
| Scalability | 7/10 | Handles large datasets, not optimized for 100K+ rows |
| Features | 9/10 | Comprehensive feature set, well-implemented |
| Accessibility | 6/10 | Basic A11y, missing ARIA landmarks & scopes |
| Bugs | 6/10 | Critical bugs documented, need verification |
| Documentation | 8/10 | Excellent README, missing perf & error guides |

---

## 1. Critical Issues 🔴

### 1.1 Race Condition in Controlled Selection
- [ ] **File:** `src/context/hooks/use-selection.ts:29-56`
- **Problem:** Rapid selections can cause stale state in controlled mode
- **Impact:** Selection inconsistencies when parent state updates before effect runs
- **Fix:** Add sequence tokens or transaction IDs to ensure atomicity

---

### 1.2 Cell Key Parsing with Special Characters
- [ ] **File:** `src/hooks/ui/use-cell-selection.ts`
- **Problem:** Row IDs containing `:` break cell selection parsing
- **Impact:** Data corruption in cell selection
- **Fix:** Use safer delimiter (base64 encode or UUID separator)
```typescript
const cellKey = `${btoa(rowId)}__${btoa(columnKey)}`;
```

---

### 1.3 Sort State Sync in Controlled Mode
- [ ] **File:** `src/context/hooks/use-sorting.ts`
- **Problem:** Controlled `sortKey` and `sortState` can become inconsistent
- **Impact:** UI shows different sort than actual state

---

## 2. High Priority Issues 🟠

### 2.1 Error Handling Not Propagated
- [ ] **File:** `src/context/hooks/use-selection.ts:139`
- **Problem:** Errors are console.error'd but not propagated to `onError` callback
- **Impact:** Silent failures, no error handling in parent components
- **Fix:** Connect catch blocks to `onError` callback
```typescript
catch (error) {
  const dtError = new DataTableError(
    "Failed to select all filtered rows",
    DataTableErrorCode.SELECTION_ERROR,
    { cause: error }
  );
  onError?.(dtError);
  return null;
}
```

---

### 2.2 Controlled/Uncontrolled Pattern Duplication
- [ ] **Files:** `use-selection.ts`, `use-sorting.ts`, `use-filtering.ts`
- **Problem:** Same controlled/uncontrolled logic repeated in multiple hooks
- **Impact:** Code duplication, maintenance burden
- **Fix:** Extract to a factory hook for reuse

---

### 2.3 Rapid Controlled Selection Sync
- [ ] **File:** `src/context/provider.tsx:252-256`
- **Problem:** `externalSelectedIds` changes trigger immediate dispatch, causing flickering
- **Fix:** Use React transition API
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

### 2.4 Keyboard Navigation Focus Loop Risk
- [ ] **File:** `src/hooks/ui/use-keyboard-navigation.ts:102-106`
- **Problem:** `setFocusedIndex` in effect can trigger if it causes `rowCount` to change
- **Fix:** Add stable ref comparison
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

## 3. Accessibility Issues 🟠

### 3.1 Missing ARIA Landmarks
- [ ] **File:** `src/components/data-table-inner.tsx`
- **Problem:** Main table container lacks `role="region"` and `aria-label`
- **Fix:**
```typescript
<div
  role="region"
  aria-label={title || "Data table"}
  className="flex flex-col..."
>
```

---

### 3.2 Column Headers Missing Scope
- [ ] **File:** `src/components/header/header-cell.tsx`
- **Problem:** Header cells don't indicate scope for screen readers
- **Fix:**
```typescript
<th scope="col" id={`col-${columnKey}`}>
  {column.header}
</th>
// Cells: <td headers={`col-${columnKey}`}>
```

---

### 3.3 Missing aria-busy for Loading State
- [ ] **File:** `src/components/data-table-inner.tsx`
- **Problem:** Loading state doesn't announce to screen readers
- **Fix:**
```typescript
<div aria-busy={isLoading} aria-label={isLoading ? "Loading data..." : undefined}>
```

---

### 3.4 Filter Menu Keyboard Accessibility
- [ ] **File:** `src/components/header/column-menu.tsx`
- **Problem:** Filter menu may not trap focus, no escape key handler
- **Impact:** Keyboard-only users can't properly navigate filters

---

## 4. Performance Issues 🟡

### 4.1 Filter Inefficiency at Scale
- [ ] **File:** `src/hooks/data/use-processed-data.ts:66-98`
- **Problem:** With 100 columns × 10,000 rows × 5 filters = 5M comparisons per render
- **Fix:**
  - Implement short-circuit evaluation
  - Cache column lookups
  - Consider query compilation for complex filters

---

### 4.2 O(n) Grouping Performance
- [ ] **File:** `src/components/data-table-inner.tsx:344-426`
- **Problem:** `buildNestedGroups` recursively processes all data on each render
- **Impact:** Slow rendering with 1000+ rows and 3+ group levels
- **Fix:** Memoize grouping, use Web Worker for large datasets

---

### 4.3 Excessive Event Listeners
- [ ] **File:** `src/components/custom-scrollbar.tsx:161-174`
- **Problem:** Multiple listeners firing `updateStickyState` on same events
- **Fix:** Consolidate listeners with requestAnimationFrame throttling

---

### 4.4 Inline Equality Check Performance
- [ ] **File:** `src/hooks/features/use-inline-editing.ts`
- **Problem:** Deep equality check is O(n) and runs on every keystroke
- **Fix:** Memoize using WeakMap or limit to specific types

---

## 5. Scalability Improvements 🟡

### 5.1 Sparse Selection for Large Datasets
- [ ] **Problem:** Selection state is `Set<string>` - linear memory for 100K+ rows
- **Fix:** Implement sparse selection pattern
```typescript
interface SparseSelection {
  type: 'all_except';
  deselectedIds: Set<string>;
}
```

---

### 5.2 Virtual Column Rendering
- [ ] **Problem:** 100+ columns creates heavy DOM
- **Fix:** Implement virtual column rendering (like virtual rows)

---

### 5.3 Text Search Optimization
- [ ] **Problem:** Full scan across all columns on every keystroke
- **Fix:**
  - Add worker support for large dataset filtering
  - Implement indexing for searchable columns

---

## 6. Code Quality Improvements 🟡

### 6.1 Split DataTableInner Component
- [ ] **File:** `src/components/data-table-inner.tsx`
- **Problem:** At 848 lines, handles too many responsibilities
- **Progress:**
  - Created `useAnnouncements` hook
  - Created `useColumnLayout` hook
  - Created `utils/grouping.ts`
- **Remaining:** Integrate hooks, extract more sub-components

---

### 6.2 Empty Data Edge Cases
- [ ] **File:** `src/hooks/data/use-processed-data.ts`
- **Problem:** No check that data items have required `id` field
- **Risk:** Duplicate row IDs silently fail in selection

---

### 6.3 All Columns Hidden Layout
- [ ] **File:** `src/hooks/ui/use-column-layout.ts`
- **Problem:** Layout breaks if all non-pinned columns are hidden

---

### 6.4 Filter Value Type Ambiguity
- [ ] **Problem:** Can't distinguish `{min, max}` for numbers vs dates in FilterValue union
- **Fix:** Use TypedFilterValue consistently throughout

---

## 7. Missing Features 🔵

### 7.1 Tree Data + Inline Editing
- [ ] **Problem:** Tree rows with inline editing not tested together
- **Impact:** Unknown edge cases

---

### 7.2 Paste Support Enhancement
- [ ] **Status:** Only copy implemented, paste needs more testing
- **File:** `src/hooks/features/use-clipboard-paste.ts`

---

### 7.3 Undo/Redo Integration
- [ ] **Status:** Infrastructure exists but not fully integrated with all edit operations
- **File:** `src/hooks/features/use-edit-history.ts`

---

## 8. Documentation Gaps 🟢

### 8.1 Missing Documentation
- [ ] Document `disableLocalProcessing` prop
- [ ] Document `virtualizeThreshold` performance impact
- [ ] Document `headerOffsetClassName` usage
- [ ] Document `estimateRowHeight` guidance
- [ ] Add performance tuning guide
- [ ] Add error handling guide
- [ ] Add WCAG compliance checklist

---

## 9. Testing 🧪

### 9.1 Unit Tests Needed
- [ ] Test selection hook race conditions
- [ ] Test cell key parsing edge cases
- [ ] Test sort state synchronization
- [ ] Test export error handling
- [ ] Test inline editing validation
- [ ] Test drag image cleanup on unmount
- [ ] Test pagination sync on filter
- [ ] Test announcer timeout cleanup
- [ ] Test keyboard navigation boundary conditions

---

### 9.2 Integration Tests Needed
- [ ] Test controlled vs uncontrolled modes
- [ ] Test virtualization with dynamic data
- [ ] Test remote data integration
- [ ] Test keyboard navigation
- [ ] Test grouping with large datasets
- [ ] Test row drag-to-reorder
- [ ] Test cell selection edge cases
- [ ] Test responsive column visibility

---

### 9.3 Performance Tests Needed
- [ ] Benchmark with 10K rows
- [ ] Benchmark with 100K rows
- [ ] Profile memory usage
- [ ] Test rapid selection/deselection
- [ ] Benchmark grouped data with 3+ levels
- [ ] Profile context re-render frequency

---

### 9.4 Accessibility Tests Needed
- [ ] Run axe-core automated checks
- [ ] Test screen reader announcements
- [ ] Test keyboard-only navigation
- [ ] Verify ARIA attribute correctness

---

## Implementation Priority

### Immediate (Before Production)
1. Fix race condition in controlled selection
2. Fix cell key parsing for special characters
3. Add ARIA landmarks and busy states
4. Add error propagation to onError callback
5. Performance testing with 10K+ rows

### Next Release
1. Filter performance optimization
2. Consolidate controlled/uncontrolled pattern
3. Keyboard navigation focus loop fix
4. Column header scope attributes
5. Split DataTableInner component

### Future
1. Sparse selection for 100K+ rows
2. Virtual column rendering
3. Text search indexing
4. Web Worker for grouping

---

## Contributing

When fixing a bug or adding a feature:

1. Check off the item in this document
2. Add tests for the fix
3. Update the CHANGELOG section in README
4. Update README.md if API changed
5. Ensure TypeScript types are updated

---

*Last updated: 2026-01-03*
