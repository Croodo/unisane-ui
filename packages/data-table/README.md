# @unisane/data-table

A high-performance, feature-rich DataTable component for React 19+ applications. Built with TypeScript, optimized for large datasets with virtualization, and designed for both local and remote data sources.

## Features

- **Virtualization** - Efficiently render thousands of rows using `@tanstack/react-virtual`
- **Sorting** - Single and multi-column sorting with custom sort functions
- **Filtering** - Text, select, multi-select, number range, and date range filters
- **Pagination** - Offset-based and cursor-based pagination support
- **Column Management** - Resize, reorder, pin (freeze), and hide columns
- **Row Selection** - Checkbox selection with bulk actions
- **Row Grouping** - Single and multi-level grouping with aggregations
- **Inline Editing** - Double-click to edit cells with validation
- **Cell Selection** - Excel-like cell range selection
- **Export** - CSV, Excel (.xlsx), PDF, and JSON export
- **Keyboard Navigation** - Full keyboard support for accessibility
- **Responsive** - Container query-based responsive column visibility
- **TypeScript** - Full type safety with comprehensive type definitions

## Installation

```bash
pnpm add @unisane/data-table
```

### Peer Dependencies

```bash
pnpm add @unisane/ui react react-dom
```

## Quick Start

```tsx
import { DataTable } from "@unisane/data-table";
import type { Column } from "@unisane/data-table";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

const columns: Column<User>[] = [
  { key: "name", header: "Name", sortable: true, filterable: true },
  { key: "email", header: "Email", sortable: true },
  { key: "role", header: "Role", filterable: true, filterType: "select" },
  {
    key: "createdAt",
    header: "Created",
    render: (row) => row.createdAt.toLocaleDateString()
  },
];

function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);

  return (
    <DataTable
      data={users}
      columns={columns}
      selectable
      searchable
      variant="grid"
    />
  );
}
```

## Table of Contents

- [Core Concepts](#core-concepts)
- [Column Configuration](#column-configuration)
- [Sorting](#sorting)
- [Filtering](#filtering)
- [Pagination](#pagination)
- [Row Selection](#row-selection)
- [Column Management](#column-management)
- [Virtualization](#virtualization)
- [Row Grouping](#row-grouping)
- [Inline Editing](#inline-editing)
- [Cell Selection](#cell-selection)
- [Export](#export)
- [Remote Data](#remote-data)
- [Keyboard Navigation](#keyboard-navigation)
- [Customization](#customization)
- [API Reference](#api-reference)
- [Known Issues](#known-issues)

---

## Core Concepts

### Data Requirements

All data rows must have a unique `id` field:

```typescript
interface Row {
  id: string;  // Required - unique identifier
  // ... other fields
}
```

### Controlled vs Uncontrolled

The DataTable supports both controlled and uncontrolled modes:

```tsx
// Uncontrolled - state managed internally
<DataTable data={data} columns={columns} />

// Controlled - parent manages state
<DataTable
  data={data}
  columns={columns}
  selectedIds={selectedIds}
  onSelectionChange={setSelectedIds}
  sortKey={sortKey}
  sortDirection={sortDirection}
  onSortChange={(key, dir) => { setSortKey(key); setSortDirection(dir); }}
/>
```

### Display Variants

```tsx
// Grid - Full borders, ideal for data editing
<DataTable variant="grid" />

// List - Row borders only, cleaner look
<DataTable variant="list" />

// Minimal - No borders, compact
<DataTable variant="minimal" />
```

### Density

```tsx
<DataTable density="compact" />     // Tight spacing
<DataTable density="dense" />       // Slightly compact
<DataTable density="standard" />    // Default
<DataTable density="comfortable" /> // Extra spacing (touch-friendly)
```

---

## Column Configuration

### Basic Column

```tsx
const columns: Column<User>[] = [
  {
    key: "name",           // Field key (supports dot notation: "address.city")
    header: "Name",        // Display header
    width: 200,            // Width in pixels (or CSS value)
    minWidth: 100,         // Minimum resize width
    maxWidth: 400,         // Maximum resize width
    align: "start",        // "start" | "center" | "end"
  },
];
```

### Custom Rendering

```tsx
{
  key: "status",
  header: "Status",
  render: (row, ctx) => (
    <Badge variant={row.status === "active" ? "success" : "error"}>
      {row.status}
    </Badge>
  ),
  headerRender: () => <Icon name="status" />,
}
```

### Feature Toggles Per Column

```tsx
{
  key: "email",
  header: "Email",
  sortable: true,       // Enable sorting
  filterable: true,     // Enable filtering
  editable: true,       // Enable inline editing
  pinnable: true,       // Allow pinning
  hideable: true,       // Allow hiding
  reorderable: true,    // Allow drag-to-reorder
  groupable: true,      // Allow grouping by this column
  pinned: "left",       // Static pin position
}
```

### Responsive Visibility

```tsx
{
  key: "createdAt",
  header: "Created",
  minVisibleWidth: 768,      // Hide when container < 768px
  responsivePriority: 3,     // Lower priority = hidden first (1-5)
}
```

### Column Groups

```tsx
import type { ColumnGroup } from "@unisane/data-table";

const columns: (Column<User> | ColumnGroup<User>)[] = [
  { key: "name", header: "Name" },
  {
    header: "Contact Info",
    children: [
      { key: "email", header: "Email" },
      { key: "phone", header: "Phone" },
    ],
  },
];
```

---

## Sorting

### Single Sort

```tsx
<DataTable
  columns={[
    { key: "name", header: "Name", sortable: true },
    { key: "createdAt", header: "Created", sortable: true },
  ]}
  onSortChange={(key, direction) => {
    console.log(`Sorted by ${key} ${direction}`);
  }}
/>
```

### Multi-Sort

Enable Shift+Click for multi-column sorting:

```tsx
<DataTable
  multiSort
  maxSortColumns={3}  // Default: 3
  onMultiSortChange={(sortState) => {
    // sortState: [{ key: "name", direction: "asc" }, { key: "date", direction: "desc" }]
  }}
/>
```

### Custom Sort Function

```tsx
{
  key: "priority",
  header: "Priority",
  sortable: true,
  sortFn: (a, b) => {
    const order = { high: 3, medium: 2, low: 1 };
    return order[a.priority] - order[b.priority];
  },
}
```

---

## Filtering

### Filter Types

```tsx
// Text filter (default)
{ key: "name", filterable: true, filterType: "text" }

// Select dropdown
{
  key: "status",
  filterable: true,
  filterType: "select",
  filterOptions: [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ],
}

// Multi-select
{ key: "tags", filterable: true, filterType: "multi-select", filterOptions: [...] }

// Number range
{ key: "price", filterable: true, filterType: "number-range" }

// Date range
{ key: "createdAt", filterable: true, filterType: "date-range" }
```

### Custom Filter Function

```tsx
{
  key: "tags",
  filterable: true,
  filterFn: (row, filterValue) => {
    if (!filterValue) return true;
    return row.tags.some(tag => tag.includes(filterValue as string));
  },
}
```

### Custom Filter Renderer

```tsx
{
  key: "rating",
  filterable: true,
  filterRenderer: ({ value, onChange }) => (
    <StarRating value={value as number} onChange={onChange} />
  ),
}
```

### Search

```tsx
<DataTable
  searchable
  searchValue={searchValue}           // Controlled
  onSearchChange={setSearchValue}     // Controlled
/>
```

---

## Pagination

### Offset Pagination (Default)

```tsx
<DataTable
  pagination="offset"
  pageSize={25}
  pageSizeOptions={[10, 25, 50, 100]}
/>
```

### Cursor Pagination (Remote Data)

```tsx
<DataTable
  pagination="cursor"
  cursorPagination={{
    nextCursor: data?.nextCursor,
    prevCursor: data?.prevCursor,
    limit: 25,
    onNext: () => fetchNextPage(),
    onPrev: () => fetchPrevPage(),
    onLimitChange: (limit) => setLimit(limit),
  }}
/>
```

### No Pagination

```tsx
<DataTable pagination="none" />
```

---

## Row Selection

### Basic Selection

```tsx
<DataTable
  selectable
  onSelectionChange={(selectedIds) => {
    console.log("Selected:", selectedIds);
  }}
/>
```

### Controlled Selection

```tsx
const [selectedIds, setSelectedIds] = useState<string[]>([]);

<DataTable
  selectable
  selectedIds={selectedIds}
  onSelectionChange={setSelectedIds}
/>
```

### Select All (Server-backed)

For large datasets where you want to select all filtered rows:

```tsx
<DataTable
  selectable
  onSelectAllFiltered={async () => {
    // Fetch all IDs from server
    const response = await api.getAllFilteredIds(currentFilters);
    return response.ids;
  }}
/>
```

### Bulk Actions

```tsx
<DataTable
  selectable
  bulkActions={[
    {
      label: "Delete",
      icon: <TrashIcon />,
      variant: "danger",
      onClick: async (ids) => {
        await api.deleteMany(ids);
      },
      disabled: (ids) => ids.length === 0,
    },
    {
      label: "Export",
      icon: <DownloadIcon />,
      onClick: (ids) => exportRows(ids),
    },
  ]}
/>
```

---

## Column Management

### Resizing

```tsx
<DataTable
  resizable
  columns={[
    { key: "name", minWidth: 100, maxWidth: 400 },
  ]}
/>
```

### Pinning (Freezing)

```tsx
<DataTable
  pinnable
  columns={[
    { key: "id", pinned: "left" },     // Always pinned left
    { key: "actions", pinnable: true }, // User can pin
  ]}
  onColumnPinChange={(key, position) => {
    console.log(`${key} pinned to ${position}`);
  }}
/>
```

### Reordering

```tsx
<DataTable
  reorderable
  columnOrder={columnOrder}
  onColumnOrderChange={setColumnOrder}
/>
```

### Visibility

Columns can be shown/hidden via the toolbar dropdown when `hideable: true`.

---

## Virtualization

Automatic virtualization for large datasets:

```tsx
<DataTable
  virtualize                    // Enable virtualization
  virtualizeThreshold={50}      // Auto-enable when rows > 50 (default)
  estimateRowHeight={48}        // Estimated row height for calculations
/>
```

### Manual Hook Usage

```tsx
import { useVirtualizedRows } from "@unisane/data-table/hooks";

const { virtualRows, totalSize, measureElement } = useVirtualizedRows({
  count: data.length,
  estimateSize: 48,
  parentRef: containerRef,
  enabled: data.length > 50,
});
```

---

## Row Grouping

### Single-Level Grouping

```tsx
// Via context hook
import { useGrouping } from "@unisane/data-table";

function MyTable() {
  const { setGroupBy } = useGrouping();

  return (
    <Button onClick={() => setGroupBy("department")}>
      Group by Department
    </Button>
  );
}
```

### Multi-Level Grouping

```tsx
setGroupBy(["department", "team"]); // Nest by department, then team
```

### Column Aggregation

```tsx
{
  key: "salary",
  header: "Salary",
  groupable: true,
  aggregation: "sum",  // "sum" | "average" | "count" | "min" | "max"
}
```

---

## Inline Editing

### Setup

```tsx
import { useInlineEditing } from "@unisane/data-table";

function EditableTable() {
  const inlineEditing = useInlineEditing({
    data: users,
    onCellChange: async (rowId, columnKey, value, row) => {
      await api.updateUser(rowId, { [columnKey]: value });
    },
    validateCell: (rowId, columnKey, value) => {
      if (columnKey === "email" && !value.includes("@")) {
        return "Invalid email";
      }
      return null;
    },
  });

  return (
    <DataTable
      data={users}
      columns={columns}
      inlineEditing={inlineEditing}
    />
  );
}
```

### Column Configuration

```tsx
{
  key: "name",
  header: "Name",
  editable: true,
  inputType: "text",  // "text" | "number" | "email" | "date" | etc.
}
```

---

## Cell Selection

Excel-like cell selection:

```tsx
import { useCellSelection } from "@unisane/data-table";

const cellSelection = useCellSelection({
  data: users,
  columnKeys: ["name", "email", "role"],
  multiSelect: true,
  rangeSelect: true,  // Shift+Click for range
  onSelectionChange: (cells) => {
    console.log("Selected cells:", cells);
  },
});

// Copy to clipboard
await cellSelection.copyToClipboard();
```

---

## Export

### Quick Export

```tsx
import { exportData } from "@unisane/data-table/utils";

// CSV
exportData({ format: "csv", data, columns, filename: "users" });

// Excel with styling
exportData({
  format: "excel",
  data,
  columns,
  filename: "users",
  freezeHeader: true,
  autoWidth: true,
});

// PDF
exportData({
  format: "pdf",
  data,
  columns,
  filename: "users",
  title: "User Report",
  orientation: "landscape",
});

// JSON
exportData({ format: "json", data, columns, filename: "users" });
```

### Export Dropdown (Built-in)

The DataTable toolbar includes an export dropdown automatically.

### Custom Print Value

For columns with React components:

```tsx
{
  key: "status",
  header: "Status",
  render: (row) => <Badge>{row.status}</Badge>,
  printValue: (row) => row.status,  // Plain text for export
}
```

---

## Remote Data

### Using useRemoteDataTable Hook

```tsx
import { useRemoteDataTable } from "@unisane/data-table/hooks/data";
import { useListParams } from "@your-sdk/hooks";
import { useQuery } from "@tanstack/react-query";

function RemoteTable() {
  const params = useListParams();
  const query = useQuery({
    queryKey: ["users", params],
    queryFn: () => api.getUsers(params),
  });

  const { tableProps } = useRemoteDataTable({
    params,
    query,
  });

  return <DataTable {...tableProps} columns={columns} />;
}
```

### Manual Remote Setup

```tsx
<DataTable
  mode="remote"
  data={data?.items ?? []}
  loading={isLoading}
  refreshing={isFetching}
  totalCount={data?.total}
  pagination="cursor"
  cursorPagination={cursorPagination}
  searchValue={searchValue}
  onSearchChange={setSearchValue}
  filters={filters}
  onFilterChange={setFilters}
  sortKey={sortKey}
  sortDirection={sortDirection}
  onSortChange={handleSort}
  onRefresh={() => refetch()}
/>
```

---

## Keyboard Navigation

Built-in keyboard support:

| Key | Action |
|-----|--------|
| `Arrow Up/Down` | Navigate rows |
| `Arrow Left/Right` | Navigate cells (when cell selection enabled) |
| `Home` | Jump to first row |
| `End` | Jump to last row |
| `Page Up/Down` | Navigate by page |
| `Space` | Toggle row selection |
| `Enter` | Activate row / Start editing |
| `Escape` | Cancel editing |
| `Shift+Click` | Multi-sort / Range select |
| `Ctrl/Cmd+C` | Copy selected cells |

---

## Customization

### Custom Header

```tsx
<DataTable
  renderHeader={(props) => (
    <MyCustomHeader
      columns={props.columns}
      sortState={props.sortState}
      onSort={props.onSort}
    />
  )}
/>
```

### Custom Toolbar

```tsx
<DataTable
  renderToolbar={(props) => (
    <MyToolbar
      searchValue={props.searchValue}
      onSearchChange={props.onSearchChange}
      selectedCount={props.selectedCount}
    />
  )}
/>
```

### Row Expansion

```tsx
<DataTable
  renderExpandedRow={(row) => (
    <div className="p-4">
      <h3>Details for {row.name}</h3>
      <pre>{JSON.stringify(row, null, 2)}</pre>
    </div>
  )}
  getRowCanExpand={(row) => row.hasDetails}
/>
```

### Row Styling

```tsx
<DataTable
  activeRowId={selectedUserId}
  rowClassName={(row) => row.isUrgent ? "bg-error/10" : ""}
  zebra
/>
```

### Row Context Menu

```tsx
import { RowContextMenu, createDefaultContextMenuItems } from "@unisane/data-table";

<DataTable
  onRowContextMenu={(row, event) => {
    showContextMenu(event, [
      { key: "edit", label: "Edit", onClick: () => editRow(row) },
      { type: "separator" },
      { key: "delete", label: "Delete", variant: "danger", onClick: () => deleteRow(row) },
    ]);
  }}
/>
```

---

## API Reference

### DataTableProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | Required | Data rows (must have `id` field) |
| `columns` | `Column<T>[]` | Required | Column definitions |
| `tableId` | `string` | - | Unique ID for localStorage persistence |
| `variant` | `"grid" \| "list" \| "minimal"` | `"list"` | Display variant |
| `density` | `"compact" \| "dense" \| "standard" \| "comfortable"` | `"standard"` | Row density |
| `selectable` | `boolean` | `false` | Enable row selection |
| `searchable` | `boolean` | `false` | Show search bar |
| `resizable` | `boolean` | `false` | Enable column resizing |
| `pinnable` | `boolean` | `false` | Enable column pinning |
| `reorderable` | `boolean` | `false` | Enable column reordering |
| `virtualize` | `boolean` | `false` | Enable virtualization |
| `virtualizeThreshold` | `number` | `50` | Auto-virtualize threshold |
| `pagination` | `"offset" \| "cursor" \| "none"` | `"offset"` | Pagination mode |
| `pageSize` | `number` | `25` | Default page size |
| `mode` | `"local" \| "remote"` | `"local"` | Data source mode |
| `loading` | `boolean` | `false` | Show loading state |
| `multiSort` | `boolean` | `false` | Enable multi-column sort |
| `showSummary` | `boolean` | `false` | Show summary footer row |
| `stickyHeader` | `boolean` | `false` | Make header sticky |
| `zebra` | `boolean` | `false` | Enable zebra striping |
| `columnBorders` | `boolean` | `false` | Show column dividers |

### Column

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `key` | `string` | Required | Field key (dot notation supported) |
| `header` | `string` | Required | Display header |
| `width` | `number \| string` | - | Column width |
| `minWidth` | `number` | - | Minimum resize width |
| `maxWidth` | `number` | - | Maximum resize width |
| `align` | `"start" \| "center" \| "end"` | `"start"` | Text alignment |
| `sortable` | `boolean` | `false` | Enable sorting |
| `filterable` | `boolean` | `false` | Enable filtering |
| `editable` | `boolean` | `false` | Enable inline editing |
| `pinnable` | `boolean` | `false` | Allow pinning |
| `hideable` | `boolean` | `true` | Allow hiding |
| `reorderable` | `boolean` | `true` | Allow reordering |
| `render` | `(row, ctx) => ReactNode` | - | Custom cell renderer |
| `sortFn` | `(a, b) => number` | - | Custom sort function |
| `filterFn` | `(row, value) => boolean` | - | Custom filter function |
| `summary` | `"sum" \| "average" \| "count" \| "min" \| "max" \| (data) => ReactNode` | - | Summary calculation |

### Hooks

| Hook | Description |
|------|-------------|
| `useSelection()` | Row selection state and actions |
| `useSorting()` | Sort state and actions |
| `useFiltering()` | Filter state and actions |
| `usePagination()` | Pagination state and actions |
| `useColumns()` | Column visibility, resize, pin, reorder |
| `useGrouping()` | Row grouping state and actions |
| `useInlineEditing()` | Inline editing controller |
| `useCellSelection()` | Cell selection state and actions |
| `useRemoteDataTable()` | Remote data integration |
| `useVirtualizedRows()` | Virtualization setup |
| `useKeyboardNavigation()` | Keyboard navigation |

---

## Known Issues

### Critical (To Be Fixed)

1. **Race condition in selection** - Rapid selections may cause stale state in controlled mode
2. **Cell key parsing** - Row IDs containing `:` character break cell selection
3. **Memory leak** - Window resize listener not properly cleaned up in `useColumns`
4. **Sort sync bug** - Controlled `sortKey` and `sortState` can become inconsistent

### Limitations

- No RTL (right-to-left) support
- No built-in i18n (hardcoded English strings)
- No tree data / hierarchical rows (use row expansion instead)
- No row drag-to-reorder
- No undo/redo for inline editing
- Paste not supported (copy only)

### Performance Considerations

- For datasets > 10,000 rows, always enable virtualization
- Avoid complex render functions in frequently-updated columns
- Use `mode="remote"` with server-side filtering/sorting for very large datasets

---

## License

MIT
