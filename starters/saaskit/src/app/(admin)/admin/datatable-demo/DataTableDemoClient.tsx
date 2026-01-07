"use client";

import { useState, useMemo } from "react";
import { DataTable } from "@/src/components/datatable";
import type { Column } from "@/src/components/datatable";
import { useInlineEditing } from "@/src/components/datatable/hooks";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

// Demo data type
interface DemoItem {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive" | "pending";
  role: string;
  department: string;
  salary: number;
  joinDate: string;
}

// Generate mock data
function generateMockData(count: number): DemoItem[] {
  const statuses: DemoItem["status"][] = ["active", "inactive", "pending"];
  const roles = [
    "Engineer",
    "Designer",
    "Manager",
    "Analyst",
    "Lead",
  ] as const;
  const departments = [
    "Engineering",
    "Design",
    "Marketing",
    "Sales",
    "HR",
  ] as const;
  const names = [
    "Alice",
    "Bob",
    "Charlie",
    "Diana",
    "Eve",
    "Frank",
    "Grace",
    "Henry",
    "Ivy",
    "Jack",
  ] as const;
  const domains = ["company.com", "example.org", "test.io"] as const;

  function pick<T>(array: readonly T[], index: number): T {
    const value = array[index % array.length];
    return value !== undefined ? value : array[0]!;
  }

  return Array.from({ length: count }, (_, i) => {
    const isoString = new Date(
      2020 + (i % 5),
      i % 12,
      1 + (i % 28)
    ).toISOString();
    const [datePart] = isoString.split("T");
    const joinDate = datePart ?? isoString;

    return {
      id: `user-${i + 1}`,
      name: `${pick(names, i)} ${String.fromCharCode(65 + (i % 26))}`,
      email: `user${i + 1}@${pick(domains, i)}`,
      status: pick(statuses, i),
      role: pick(roles, i),
      department: pick(departments, i),
      salary: 50000 + Math.floor(Math.random() * 100000),
      joinDate,
    };
  });
}

export function DataTableDemo() {
  const [rowCount, setRowCount] = useState(100);
  const [data, setData] = useState(() => generateMockData(100));
  const [editLog, setEditLog] = useState<string[]>([]);

  // Regenerate data when count changes
  const regenerateData = (count: number) => {
    setRowCount(count);
    setData(generateMockData(count));
    setEditLog([]);
  };

  // Inline editing hook
  const editing = useInlineEditing({
    data,
    onCellChange: async (rowId, columnKey, value, row) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Update data
      setData((prev) =>
        prev.map((item) =>
          item.id === rowId
            ? {
                ...item,
                ...(columnKey === "salary"
                  ? {
                      salary:
                        typeof value === "number"
                          ? value
                          : Number(value) || item.salary,
                    }
                  : { [columnKey]: value }),
              }
            : item
        )
      );

      // Log the edit
      setEditLog((prev) => [
        `Edited ${row.name}: ${columnKey} = ${String(value)}`,
        ...prev.slice(0, 9),
      ]);
    },
    validateCell: (rowId, columnKey, value) => {
      if (columnKey === "email" && typeof value === "string") {
        if (!value.includes("@")) return "Invalid email format";
      }
      if (columnKey === "salary" && typeof value === "string") {
        const num = Number(value);
        if (isNaN(num) || num < 0) return "Must be a positive number";
      }
      return null;
    },
    enabled: true,
  });

  // Column definitions
  const columns: Column<DemoItem>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        width: 180,
        sortable: true,
        filterable: true,
        editable: true,
        render: (row) => row.name,
      },
      {
        key: "email",
        header: "Email",
        width: 220,
        sortable: true,
        filterable: true,
        editable: true,
        render: (row) => (
          <span className="text-muted-foreground">{row.email}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        width: 100,
        sortable: true,
        filterable: true,
        filterOptions: [
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
          { value: "pending", label: "Pending" },
        ],
        render: (row) => (
          <Badge
            variant={
              row.status === "active"
                ? "default"
                : row.status === "pending"
                  ? "secondary"
                  : "outline"
            }
          >
            {row.status}
          </Badge>
        ),
      },
      {
        key: "role",
        header: "Role",
        width: 120,
        sortable: true,
        filterable: true,
      },
      {
        key: "department",
        header: "Department",
        width: 140,
        sortable: true,
        filterable: true,
      },
      {
        key: "salary",
        header: "Salary",
        width: 120,
        sortable: true,
        align: "right",
        editable: true,
        render: (row) => (
          <span className="font-mono">${row.salary.toLocaleString()}</span>
        ),
        summary: "sum",
      },
      {
        key: "joinDate",
        header: "Join Date",
        width: 120,
        sortable: true,
      },
    ],
    [editing]
  );

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>DataTable Feature Demo</CardTitle>
          <CardDescription>
            Test keyboard navigation, virtualization, and inline editing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Row count:</span>
              {[50, 100, 500, 1000].map((count) => (
                <Button
                  key={count}
                  variant={rowCount === count ? "default" : "outline"}
                  size="sm"
                  onClick={() => regenerateData(count)}
                >
                  {count}
                </Button>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              Virtualization: {data.length > 50 ? "✅ Enabled" : "❌ Disabled"}{" "}
              (auto &gt;50 rows)
            </div>
          </div>

          {/* Feature hints */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium mb-1">⌨️ Keyboard Navigation</h4>
              <ul className="text-muted-foreground text-xs space-y-1">
                <li>• Click table then use ↑↓←→</li>
                <li>• Space to select rows</li>
                <li>• Enter to activate row</li>
                <li>• Ctrl+A to select all</li>
              </ul>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium mb-1">📝 Inline Editing</h4>
              <ul className="text-muted-foreground text-xs space-y-1">
                <li>• Double-click Name, Email, or Salary</li>
                <li>• Enter to save, Escape to cancel</li>
                <li>• Validation on Email and Salary</li>
              </ul>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium mb-1">🚀 Virtualization</h4>
              <ul className="text-muted-foreground text-xs space-y-1">
                <li>• Try 500 or 1000 rows</li>
                <li>• Scroll performance stays smooth</li>
                <li>• Only visible rows rendered</li>
              </ul>
            </div>
          </div>

          {/* Edit log */}
          {editLog.length > 0 && (
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Recent Edits:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {editLog.map((log, i) => (
                  <li key={i}>✓ {log}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DataTable */}
      <DataTable
        data={data}
        columns={columns}
        title={`Demo Table (${data.length} rows)`}
        tableId="demo-table"
        selectable
        zebra
        inlineEditing={editing}
      />
    </div>
  );
}
