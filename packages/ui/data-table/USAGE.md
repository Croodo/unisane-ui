# DataTable Usage Guide

## Quick Start

### Basic Table

```tsx
import { DataTable, defineColumns } from "@unisane/data-table";

interface User {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive";
}

const columns = defineColumns<User>([
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "status", header: "Status" },
]);

function UsersTable({ users }: { users: User[] }) {
  return <DataTable data={users} columns={columns} />;
}
```

### With Features

```tsx
<DataTable
  data={users}
  columns={columns}
  features={{ selection: true, search: true }}
  callbacks={{
    onRowClick: (row) => navigate(`/users/${row.id}`),
    onSelectionChange: (ids) => console.log("Selected:", ids),
  }}
/>
```

### With Inline Editing

```tsx
<DataTable
  data={users}
  columns={columns}
  preset="editable"
  editing={{
    enabled: true,
    onSave: async (rowId, columnKey, value) => {
      await api.updateUser(rowId, { [columnKey]: value });
      setUsers((prev) =>
        prev.map((u) => (u.id === rowId ? { ...u, [columnKey]: value } : u))
      );
    },
    onValidate: (rowId, columnKey, value) => {
      if (columnKey === "email" && !String(value).includes("@")) {
        return "Invalid email address";
      }
      return null;
    },
  }}
/>
```

---

## Presets

Presets provide sensible defaults for common use cases:

| Preset | Description |
|--------|-------------|
| `simple` | Read-only table, no interactive features |
| `interactive` | Selection, search, sorting, export (default) |
| `editable` | Inline editing with validation support |
| `spreadsheet` | Cell selection, copy/paste, grid layout |
| `server` | Remote data with cursor pagination |
| `dashboard` | Compact, minimal UI for dashboards |

```tsx
<DataTable data={data} columns={columns} preset="spreadsheet" />
```

---

## Configuration Objects

### Features

```tsx
<DataTable
  features={{
    selection: true,      // Row selection checkboxes
    search: true,         // Search bar
    columnResize: true,   // Drag to resize columns
    columnPinning: true,  // Pin columns left/right
    columnReorder: true,  // Drag to reorder columns
    rowExpansion: true,   // Expandable rows
    rowReorder: true,     // Drag to reorder rows
    cellSelection: true,  // Spreadsheet-like cell selection
    keyboard: true,       // Keyboard navigation
    export: ["csv"],      // Export buttons
    print: true,          // Print button
  }}
/>
```

### Styling

```tsx
<DataTable
  styling={{
    variant: "grid",        // "list" | "grid" | "minimal"
    density: "compact",     // "compact" | "standard" | "comfortable"
    columnDividers: true,   // Show column borders
    zebra: true,            // Alternating row colors
    stickyHeader: true,     // Sticky header on scroll
    stickyOffset: 64,       // Offset for fixed navbar
  }}
/>
```

### Pagination

```tsx
<DataTable
  pagination={{
    mode: "offset",              // "offset" | "cursor" | "none"
    pageSize: 25,                // Default page size
    pageSizeOptions: [10, 25, 50, 100],
  }}
/>
```

### Virtualization

```tsx
<DataTable
  virtualization={{
    rows: true,              // Enable row virtualization
    rowThreshold: 100,       // Min rows before virtualization
    columns: true,           // Enable column virtualization
    columnThreshold: 20,     // Min columns before virtualization
    estimatedRowHeight: 48,  // Estimated row height
  }}
/>
```

### Callbacks

```tsx
<DataTable
  callbacks={{
    onRowClick: (row, event) => {},
    onRowContextMenu: (row, event) => {},
    onSelectionChange: (ids) => {},
    onSortChange: (sortState) => {},
    onFilterChange: (filters) => {},
    onSearchChange: (value) => {},
  }}
/>
```

### Controlled State

```tsx
const [selectedIds, setSelectedIds] = useState<string[]>([]);
const [sortState, setSortState] = useState<MultiSortState>([]);

<DataTable
  controlled={{
    selectedIds,
    sortState,
  }}
  callbacks={{
    onSelectionChange: setSelectedIds,
    onSortChange: setSortState,
  }}
/>
```

---

## Column Definition

### Using defineColumns (Recommended)

```tsx
const columns = defineColumns<User>([
  // Basic column - sortable, filterable by default
  { key: "name", header: "Name" },

  // With custom renderer
  { key: "status", header: "Status", render: (row) => <Badge>{row.status}</Badge> },

  // Editable column
  { key: "email", header: "Email", editable: true, inputType: "email" },

  // Numeric column with summary
  { key: "salary", header: "Salary", align: "end", summary: "sum" },

  // Static column (no sorting/filtering)
  { key: "actions", header: "", static: true, render: (row) => <ActionsMenu row={row} /> },
]);
```

### Column Options

| Option | Default | Description |
|--------|---------|-------------|
| `key` | required | Column key (supports dot notation) |
| `header` | required | Display header text |
| `width` | auto | Column width |
| `align` | "start" | Text alignment |
| `render` | - | Custom cell renderer |
| `sortable` | true | Enable sorting |
| `filterable` | true | Enable filtering |
| `editable` | false | Enable inline editing |
| `static` | false | Disable all features |

---

## Bulk Actions

```tsx
import { defineBulkActions } from "@unisane/data-table";

const bulkActions = defineBulkActions([
  {
    label: "Delete",
    icon: "delete",
    variant: "danger",
    onClick: async (ids) => api.deleteMany(ids),
  },
  {
    label: "Export",
    icon: "download",
    onClick: (ids) => exportSelected(ids),
  },
]);

<DataTable data={data} columns={columns} bulkActions={bulkActions} />
```

---

## Advanced Usage

For full control, use `DataTableProvider` with individual components:

```tsx
import {
  DataTableProvider,
  DataTableInner,
  DataTableToolbar,
  DataTablePagination,
  useSelection,
} from "@unisane/data-table";

function AdvancedTable({ data, columns }: Props) {
  return (
    <DataTableProvider columns={columns}>
      <DataTableToolbar />
      <DataTableInner data={data} />
      <DataTablePagination />
    </DataTableProvider>
  );
}
```
