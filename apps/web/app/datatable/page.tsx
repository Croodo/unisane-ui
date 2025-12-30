"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  DataTableProvider,
  DataTableInner,
  DataTableToolbar,
  DataTablePagination,
  useInlineEditing,
  useSelection,
  exportData,
  type Column,
  type BulkAction,
  type Density,
  type ExportFormat,
} from "@unisane/data-table";
import { Typography, Chip, Avatar, Icon, Card, Switch } from "@unisane/ui";

// ─── SAMPLE DATA TYPES ────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  department: string;
  salary: number;
  joinDate: string;
  status: "active" | "inactive" | "pending";
  projects: number;
  lastActive: string;
}

// ─── SAMPLE DATA GENERATOR ────────────────────────────────────────────────────

const departments = [
  "Engineering",
  "Design",
  "Marketing",
  "Sales",
  "HR",
  "Finance",
  "Operations",
];
const roles: User["role"][] = ["admin", "editor", "viewer"];
const statuses: User["status"][] = ["active", "inactive", "pending"];

const firstNames = [
  "Emma",
  "Liam",
  "Olivia",
  "Noah",
  "Ava",
  "Ethan",
  "Sophia",
  "Mason",
  "Isabella",
  "William",
  "Mia",
  "James",
  "Charlotte",
  "Oliver",
  "Amelia",
  "Benjamin",
  "Harper",
  "Elijah",
  "Evelyn",
  "Lucas",
  "Abigail",
  "Henry",
  "Emily",
  "Alexander",
  "Elizabeth",
  "Michael",
  "Sofia",
  "Daniel",
  "Avery",
  "Matthew",
  "Ella",
  "Aiden",
  "Scarlett",
  "Jackson",
  "Grace",
  "Sebastian",
];

const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
];

// Simple seeded pseudo-random number generator for deterministic data
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function generateUsers(count: number): User[] {
  const random = seededRandom(42); // Fixed seed for consistent data
  const baseDate = new Date("2025-01-01").getTime(); // Fixed base date

  return Array.from({ length: count }, (_, i) => {
    const firstName = firstNames[i % firstNames.length]!;
    const lastName = lastNames[i % lastNames.length]!;
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    const department = departments[i % departments.length]!;
    const role = roles[i % roles.length]!;
    const status = statuses[i % statuses.length]!;
    const salary = Math.floor(50000 + random() * 150000);
    const projects = Math.floor(random() * 25);

    // Deterministic date in the past 5 years from base date
    const joinDate = new Date(
      baseDate - Math.floor(random() * 5 * 365 * 24 * 60 * 60 * 1000)
    )
      .toISOString()
      .split("T")[0]!;

    // Deterministic date in the past 30 days from base date
    const lastActive = new Date(
      baseDate - Math.floor(random() * 30 * 24 * 60 * 60 * 1000)
    )
      .toISOString()
      .split("T")[0]!;

    return {
      id: `user-${i + 1}`,
      name,
      email,
      role,
      department,
      salary,
      joinDate,
      status,
      projects,
      lastActive,
    };
  });
}

// ─── STATUS BADGE COMPONENT ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: User["status"] }) {
  const colors: Record<User["status"], { bg: string; text: string }> = {
    active: { bg: "bg-primary/10", text: "text-primary" },
    inactive: { bg: "bg-error/10", text: "text-error" },
    pending: { bg: "bg-tertiary/10", text: "text-tertiary" },
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-label-small capitalize ${colors[status].bg} ${colors[status].text}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          status === "active"
            ? "bg-primary"
            : status === "inactive"
              ? "bg-error"
              : "bg-tertiary"
        }`}
      />
      {status}
    </span>
  );
}

// ─── ROLE CHIP COMPONENT ──────────────────────────────────────────────────────

function RoleChip({ role }: { role: User["role"] }) {
  const variants: Record<User["role"], { color: string; icon: string }> = {
    admin: {
      color: "bg-error-container text-on-error-container",
      icon: "shield",
    },
    editor: {
      color: "bg-tertiary-container text-on-tertiary-container",
      icon: "edit",
    },
    viewer: {
      color: "bg-secondary-container text-on-secondary-container",
      icon: "visibility",
    },
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-label-small capitalize ${variants[role].color}`}
    >
      <Icon symbol={variants[role].icon} className="w-3.5 h-3.5" />
      {role}
    </span>
  );
}

// ─── COLUMN DEFINITIONS ───────────────────────────────────────────────────────

const columns: Column<User>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    filterable: true,
    pinnable: true,
    editable: true,
    width: 220,
    render: (row) => (
      <div className="flex items-center gap-3">
        <Avatar
          size="sm"
          fallback={row.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
          className="bg-primary text-on-primary"
        />
        <div className="flex flex-col">
          <span className="text-body-medium text-on-surface font-medium">
            {row.name}
          </span>
          <span className="text-label-small text-on-surface-variant">
            {row.email}
          </span>
        </div>
      </div>
    ),
  },
  {
    key: "email",
    header: "Email",
    sortable: true,
    filterable: true,
    editable: true,
    inputType: "email",
    width: 240,
    hideable: true,
    render: (row) => (
      <a
        href={`mailto:${row.email}`}
        className="text-primary hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {row.email}
      </a>
    ),
  },
  {
    key: "role",
    header: "Role",
    sortable: true,
    filterable: true,
    filterType: "select",
    filterOptions: [
      { label: "Admin", value: "admin" },
      { label: "Editor", value: "editor" },
      { label: "Viewer", value: "viewer" },
    ],
    width: 120,
    align: "center",
    pinnable: true,
    render: (row) => <RoleChip role={row.role} />,
  },
  {
    key: "department",
    header: "Department",
    sortable: true,
    filterable: true,
    filterType: "select",
    filterOptions: departments.map((d) => ({ label: d, value: d })),
    width: 140,
    hideable: true,
    pinnable: true,
  },
  {
    key: "salary",
    header: "Salary",
    sortable: true,
    editable: true,
    inputType: "number",
    width: 120,
    align: "end",
    hideable: true,
    pinnable: true,
    render: (row) => (
      <span className="font-mono text-on-surface">
        ${row.salary.toLocaleString()}
      </span>
    ),
  },
  {
    key: "projects",
    header: "Projects",
    sortable: true,
    width: 100,
    align: "center",
    hideable: true,
    render: (row) => (
      <div className="flex items-center justify-center gap-1">
        <Icon symbol="folder" className="w-4 h-4 text-on-surface-variant" />
        <span
          className={
            row.projects > 10 ? "text-primary font-medium" : "text-on-surface"
          }
        >
          {row.projects}
        </span>
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    filterable: true,
    filterType: "select",
    filterOptions: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
      { label: "Pending", value: "pending" },
    ],
    width: 120,
    align: "center",
    pinnable: true,
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: "joinDate",
    header: "Join Date",
    sortable: true,
    editable: true,
    inputType: "date",
    width: 130,
    hideable: true,
    render: (row) => (
      <span className="text-on-surface-variant">
        {new Date(row.joinDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </span>
    ),
  },
  {
    key: "lastActive",
    header: "Last Active",
    sortable: true,
    width: 130,
    hideable: true,
    render: (row) => {
      const date = new Date(row.lastActive);
      const now = new Date();
      const diffDays = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      );

      return (
        <span
          className={diffDays > 7 ? "text-error" : "text-on-surface-variant"}
        >
          {diffDays === 0
            ? "Today"
            : diffDays === 1
              ? "Yesterday"
              : `${diffDays} days ago`}
        </span>
      );
    },
  },
];

// ─── EXPANDED ROW CONTENT ─────────────────────────────────────────────────────

function ExpandedRowContent({ row }: { row: User }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <Typography
          variant="labelMedium"
          className="text-on-surface-variant mb-2"
        >
          Contact Information
        </Typography>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon symbol="email" className="w-4 h-4 text-on-surface-variant" />
            <span className="text-body-small">{row.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon symbol="badge" className="w-4 h-4 text-on-surface-variant" />
            <span className="text-body-small">ID: {row.id}</span>
          </div>
        </div>
      </div>
      <div>
        <Typography
          variant="labelMedium"
          className="text-on-surface-variant mb-2"
        >
          Work Information
        </Typography>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon
              symbol="apartment"
              className="w-4 h-4 text-on-surface-variant"
            />
            <span className="text-body-small">{row.department}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon
              symbol="payments"
              className="w-4 h-4 text-on-surface-variant"
            />
            <span className="text-body-small">
              ${row.salary.toLocaleString()}/year
            </span>
          </div>
        </div>
      </div>
      <div>
        <Typography
          variant="labelMedium"
          className="text-on-surface-variant mb-2"
        >
          Activity
        </Typography>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon symbol="folder" className="w-4 h-4 text-on-surface-variant" />
            <span className="text-body-small">
              {row.projects} active projects
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Icon
              symbol="calendar_today"
              className="w-4 h-4 text-on-surface-variant"
            />
            <span className="text-body-small">Joined {row.joinDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DATA TABLE WITH TOOLBAR (wrapper to access context) ─────────────────────

function DataTableWithToolbar({
  data,
  bulkActions,
  density,
  onDensityChange,
  enableSelection,
  enableExpansion,
  enableZebra,
  enableColumnBorders,
  enableVirtualization,
  onRowClick,
  onRowHover,
  inlineEditing,
}: {
  data: User[];
  bulkActions: BulkAction[];
  density: Density;
  onDensityChange: (d: Density) => void;
  enableSelection: boolean;
  enableExpansion: boolean;
  enableZebra: boolean;
  enableColumnBorders: boolean;
  enableVirtualization: boolean;
  onRowClick: (row: User) => void;
  onRowHover: (row: User | null) => void;
  inlineEditing: ReturnType<typeof useInlineEditing<User>>;
}) {
  const { selectedRows, deselectAll } = useSelection();
  const selectedIds = Array.from(selectedRows);

  return (
    <div className="flex flex-col bg-surface isolate border-t border-outline-variant divide-y divide-outline-variant">
      {/* Sticky toolbar - sticks to page top */}
      <div className="sticky top-0 z-10 bg-surface">
        <DataTableToolbar
          title="Users"
          searchable
          selectedCount={selectedRows.size}
          selectedIds={selectedIds}
          bulkActions={enableSelection ? bulkActions : []}
          onClearSelection={deselectAll}
          exportHandler={{
            onExport: (format: ExportFormat) => {
              exportData({
                format,
                data,
                columns,
                filename: "all-users",
              });
            },
            formats: ["csv", "excel", "pdf", "json"],
          }}
          density={density}
          onDensityChange={onDensityChange}
        />
      </div>

      {/* Table body */}
      <DataTableInner
        data={data}
        isLoading={false}
        bulkActions={enableSelection ? bulkActions : []}
        renderExpandedRow={
          enableExpansion
            ? (row) => <ExpandedRowContent row={row} />
            : undefined
        }
        getRowCanExpand={enableExpansion ? () => true : undefined}
        onRowClick={onRowClick}
        onRowHover={onRowHover}
        density={density}
        virtualize={enableVirtualization}
        virtualizeThreshold={50}
        emptyMessage="No users found"
        emptyIcon="person_off"
        inlineEditing={inlineEditing}
      />

      {/* Pagination */}
      <DataTablePagination totalItems={data.length} />
    </div>
  );
}

// ─── MAIN DEMO PAGE ───────────────────────────────────────────────────────────

export default function DataTableDemoPage() {
  // Generate sample data
  const [data, setData] = useState<User[]>(() => generateUsers(150));
  const [hoveredRow, setHoveredRow] = useState<User | null>(null);

  // Feature toggles for demonstration
  const [enableSelection, setEnableSelection] = useState(true);
  const [enableExpansion, setEnableExpansion] = useState(true);
  const [enableZebra, setEnableZebra] = useState(false);
  const [enableColumnBorders, setEnableColumnBorders] = useState(false);
  const [enableVirtualization, setEnableVirtualization] = useState(true);
  const [enableResizable, setEnableResizable] = useState(true);
  const [enablePinnable, setEnablePinnable] = useState(true);
  const [enableMultiSort, setEnableMultiSort] = useState(true);
  const [enableReorderable, setEnableReorderable] = useState(true);
  const [density, setDensity] = useState<Density>("standard");

  // Inline editing
  const inlineEditing = useInlineEditing<User>({
    data,
    onCellChange: async (rowId, columnKey, newValue) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setData((prevData) =>
        prevData.map((row) =>
          row.id === rowId ? { ...row, [columnKey]: newValue } : row
        )
      );

      console.log(`Saved: ${rowId}.${columnKey} = ${newValue}`);
    },
    validateCell: (_rowId, columnKey, value) => {
      if (
        columnKey === "salary" &&
        (typeof value !== "number" || Number(value) < 0)
      ) {
        return "Salary must be a positive number";
      }
      if (
        columnKey === "email" &&
        typeof value === "string" &&
        !value.includes("@")
      ) {
        return "Invalid email address";
      }
      return null;
    },
  });

  // Bulk actions - use string icons for proper rendering
  const bulkActions: BulkAction[] = useMemo(
    () => [
      {
        label: "Export",
        icon: "download",
        onClick: (selectedIds) => {
          const selectedData = data.filter((d) => selectedIds.includes(d.id));
          exportData({
            format: "csv",
            data: selectedData,
            columns,
            filename: "selected-users",
          });
        },
      },
      {
        label: "Activate",
        icon: "check_circle",
        onClick: (selectedIds) => {
          setData((prev) =>
            prev.map((row) =>
              selectedIds.includes(row.id) ? { ...row, status: "active" } : row
            )
          );
        },
      },
      {
        label: "Deactivate",
        icon: "cancel",
        variant: "danger",
        onClick: (selectedIds) => {
          setData((prev) =>
            prev.map((row) =>
              selectedIds.includes(row.id)
                ? { ...row, status: "inactive" }
                : row
            )
          );
        },
      },
      {
        label: "Delete",
        icon: "delete",
        variant: "danger",
        onClick: (selectedIds) => {
          if (confirm(`Delete ${selectedIds.length} users?`)) {
            setData((prev) =>
              prev.filter((row) => !selectedIds.includes(row.id))
            );
          }
        },
      },
    ],
    [data]
  );

  // Row click handler
  const handleRowClick = useCallback((row: User) => {
    console.log("Row clicked:", row.name);
  }, []);

  // Row hover handler
  const handleRowHover = useCallback((row: User | null) => {
    setHoveredRow(row);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-outline-variant/30 ">
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          <Typography variant="headlineLarge" className="text-on-surface mb-2">
            DataTable Demo
          </Typography>
          <Typography variant="bodyLarge" className="text-on-surface-variant">
            A comprehensive demonstration of all DataTable features including
            toolbar with search, column visibility, density toggle, export,
            filtering, pagination, selection, expansion, inline editing, column
            resizing, column pinning, and more.
          </Typography>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="border-b border-outline-variant/30 ">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <Typography variant="titleMedium" className="text-on-surface mb-4">
            Feature Toggles
          </Typography>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch
                checked={enableSelection}
                onChange={(e) => setEnableSelection(e.target.checked)}
              />
              <span className="text-body-medium">Selection</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch
                checked={enableExpansion}
                onChange={(e) => setEnableExpansion(e.target.checked)}
              />
              <span className="text-body-medium">Expansion</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch
                checked={enableZebra}
                onChange={(e) => setEnableZebra(e.target.checked)}
              />
              <span className="text-body-medium">Zebra Stripes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch
                checked={enableColumnBorders}
                onChange={(e) => setEnableColumnBorders(e.target.checked)}
              />
              <span className="text-body-medium">Column Borders</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch
                checked={enableVirtualization}
                onChange={(e) => setEnableVirtualization(e.target.checked)}
              />
              <span className="text-body-medium">Virtualization</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch
                checked={enableResizable}
                onChange={(e) => setEnableResizable(e.target.checked)}
              />
              <span className="text-body-medium">Resizable Columns</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch
                checked={enablePinnable}
                onChange={(e) => setEnablePinnable(e.target.checked)}
              />
              <span className="text-body-medium">Pinnable Columns</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch
                checked={enableMultiSort}
                onChange={(e) => setEnableMultiSort(e.target.checked)}
              />
              <span className="text-body-medium">Multi-Sort (Shift+Click)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch
                checked={enableReorderable}
                onChange={(e) => setEnableReorderable(e.target.checked)}
              />
              <span className="text-body-medium">Drag to Reorder</span>
            </label>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <Typography
              variant="labelMedium"
              className="text-on-surface-variant"
            >
              Density:
            </Typography>
            <div className="flex gap-2">
              {(["compact", "dense", "standard", "comfortable"] as const).map(
                (d) => (
                  <Chip
                    key={d}
                    variant="filter"
                    label={d.charAt(0).toUpperCase() + d.slice(1)}
                    selected={density === d}
                    onClick={() => setDensity(d)}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hovered Row Info */}
      {hoveredRow && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card variant="elevated" className="p-3 shadow-lg">
            <Typography
              variant="labelSmall"
              className="text-on-surface-variant mb-1"
            >
              Hovered Row
            </Typography>
            <Typography variant="bodyMedium" className="text-on-surface">
              {hoveredRow.name} - {hoveredRow.department}
            </Typography>
          </Card>
        </div>
      )}

      {/* DataTable */}
      <div className=" py-6">
        <div className="overflow-hidden">
          <DataTableProvider
            tableId="demo-table"
            columns={columns}
            mode="local"
            paginationMode="offset"
            variant={enableColumnBorders ? "grid" : "list"}
            selectable={enableSelection}
            columnBorders={enableColumnBorders}
            zebra={enableZebra}
            stickyHeader
            resizable={enableResizable}
            pinnable={enablePinnable}
            reorderable={enableReorderable}
            multiSort={enableMultiSort}
            maxSortColumns={3}
            initialPageSize={25}
          >
            <DataTableWithToolbar
              data={data}
              bulkActions={bulkActions}
              density={density}
              onDensityChange={setDensity}
              enableSelection={enableSelection}
              enableExpansion={enableExpansion}
              enableZebra={enableZebra}
              enableColumnBorders={enableColumnBorders}
              enableVirtualization={enableVirtualization}
              onRowClick={handleRowClick}
              onRowHover={handleRowHover}
              inlineEditing={inlineEditing}
            />
          </DataTableProvider>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card variant="filled" className="p-4">
            <Typography variant="titleMedium" className="text-on-surface mb-2">
              Total Records
            </Typography>
            <Typography variant="displaySmall" className="text-primary">
              {data.length}
            </Typography>
          </Card>
          <Card variant="filled" className="p-4">
            <Typography variant="titleMedium" className="text-on-surface mb-2">
              Active Users
            </Typography>
            <Typography variant="displaySmall" className="text-primary">
              {data.filter((d) => d.status === "active").length}
            </Typography>
          </Card>
          <Card variant="filled" className="p-4">
            <Typography variant="titleMedium" className="text-on-surface mb-2">
              Total Salary
            </Typography>
            <Typography variant="displaySmall" className="text-primary">
              $
              {(data.reduce((sum, d) => sum + d.salary, 0) / 1000000).toFixed(
                1
              )}
              M
            </Typography>
          </Card>
        </div>

        {/* Feature Documentation */}
        <div className="mt-8 space-y-6">
          <Typography variant="headlineSmall" className="text-on-surface">
            Features Demonstrated
          </Typography>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon="search"
              title="Search & Filter"
              description="Use the search bar in the toolbar. Click filter icons on column headers for column-specific filtering."
            />
            <FeatureCard
              icon="view_column"
              title="Column Visibility"
              description="Click 'Columns' button in toolbar to show/hide columns. Settings persist to localStorage."
            />
            <FeatureCard
              icon="table_rows"
              title="Density Toggle"
              description="Click 'Density' button in toolbar to switch between compact, dense, standard, and comfortable modes."
            />
            <FeatureCard
              icon="download"
              title="CSV Export"
              description="Click 'Export' button in toolbar to download all data as CSV. Or select rows and use bulk action."
            />
            <FeatureCard
              icon="sort"
              title="Multi-Sort"
              description="Click column headers to sort. Shift+Click to add secondary/tertiary sort columns with priority badges."
            />
            <FeatureCard
              icon="check_box"
              title="Selection & Bulk Actions"
              description="Select rows with checkboxes. Bulk actions appear in toolbar when items are selected."
            />
            <FeatureCard
              icon="expand_more"
              title="Row Expansion"
              description="Click the expand icon to reveal additional row details with contact, work, and activity info."
            />
            <FeatureCard
              icon="edit"
              title="Inline Editing"
              description="Double-click editable cells (Name, Email, Salary, Join Date). Enter to save, Escape to cancel."
            />
            <FeatureCard
              icon="width"
              title="Column Resizing"
              description="Drag column borders to resize. Widths persist to localStorage. Toggle with 'Resizable Columns'."
            />
            <FeatureCard
              icon="push_pin"
              title="Column Pinning"
              description="Right-click column header to pin left/right. Pinned columns stay visible during horizontal scroll."
            />
            <FeatureCard
              icon="drag_indicator"
              title="Column Reordering"
              description="Drag column headers to reorder. Non-pinned columns can be dragged to change their position."
            />
            <FeatureCard
              icon="keyboard"
              title="Keyboard Navigation"
              description="Arrow keys to navigate rows. Space to select, Enter to activate, Escape to clear focus."
            />
            <FeatureCard
              icon="speed"
              title="Virtualization"
              description="Only visible rows are rendered for performance. Toggle to see difference with 150 rows."
            />
            <FeatureCard
              icon="filter_list"
              title="Active Filters Bar"
              description="When filters are active, a bar shows below toolbar with chips for each filter. Click to remove."
            />
            <FeatureCard
              icon="save"
              title="Settings Persistence"
              description="Column widths, visibility, and pin states are saved to localStorage per tableId."
            />
            <FeatureCard
              icon="accessibility"
              title="Accessibility"
              description="Full ARIA support, keyboard navigation, screen reader announcements for status changes."
            />
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 p-6  rounded-lg border border-outline-variant/20">
          <Typography variant="titleLarge" className="text-on-surface mb-4">
            Try These Actions
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-body-medium text-on-surface-variant">
            <div className="space-y-2">
              <p>
                1. <strong>Search:</strong> Type in the search bar to filter all
                columns
              </p>
              <p>
                2. <strong>Sort:</strong> Click "Name" or "Salary" headers to
                sort
              </p>
              <p>
                3. <strong>Filter:</strong> Click filter icon on "Status" or
                "Role" columns
              </p>
              <p>
                4. <strong>Select:</strong> Check some rows, then use bulk
                actions
              </p>
              <p>
                5. <strong>Expand:</strong> Click the chevron icon to see row
                details
              </p>
            </div>
            <div className="space-y-2">
              <p>
                6. <strong>Edit:</strong> Double-click a name or salary cell to
                edit
              </p>
              <p>
                7. <strong>Columns:</strong> Click "Columns" to hide/show
                columns
              </p>
              <p>
                8. <strong>Density:</strong> Click "Density" to change row
                height
              </p>
              <p>
                9. <strong>Resize:</strong> Drag the border between column
                headers
              </p>
              <p>
                10. <strong>Export:</strong> Click "Export" to download CSV
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FEATURE CARD ─────────────────────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 p-4 rounded-lg  border border-outline-variant/20">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon symbol={icon} className="w-5 h-5 text-primary" />
      </div>
      <div>
        <Typography variant="titleSmall" className="text-on-surface mb-1">
          {title}
        </Typography>
        <Typography variant="bodySmall" className="text-on-surface-variant">
          {description}
        </Typography>
      </div>
    </div>
  );
}
