"use client";

import { Avatar, Icon } from "@unisane/ui";
import { createActionsColumn, type Column, type RowContextMenuItemOrSeparator } from "@unisane/data-table";
import type { User } from "./types";
import { departments } from "./types";

// ─── USER ACTION ITEMS ────────────────────────────────────────────────────────

export function createUserActionItems(
  onEdit: (user: User) => void,
  onDelete: (user: User) => void
): RowContextMenuItemOrSeparator<User>[] {
  return [
    {
      key: "view",
      label: "View details",
      icon: "visibility",
      onClick: (row) => alert(`${row.name}\n${row.email}\n${row.department}`)
    },
    {
      key: "edit",
      label: "Edit user",
      icon: "edit",
      onClick: onEdit
    },
    { type: "separator" },
    {
      key: "delete",
      label: "Delete",
      icon: "delete",
      variant: "danger",
      onClick: onDelete
    },
  ];
}

// ─── CREATE ACTIONS COLUMN ────────────────────────────────────────────────────

export function createUserActionsColumn(
  onEdit: (user: User) => void,
  onDelete: (user: User) => void
): Column<User> {
  return createActionsColumn<User>({
    items: createUserActionItems(onEdit, onDelete),
    pinned: "right",
  });
}

// ─── STATUS BADGE ────────────────────────────────────────────────────────────

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
          status === "active" ? "bg-primary" : status === "inactive" ? "bg-error" : "bg-tertiary"
        }`}
      />
      {status}
    </span>
  );
}

// ─── ROLE CHIP ───────────────────────────────────────────────────────────────

function RoleChip({ role }: { role: User["role"] }) {
  const variants: Record<User["role"], { color: string; icon: string }> = {
    admin: { color: "bg-error-container text-on-error-container", icon: "shield" },
    editor: { color: "bg-tertiary-container text-on-tertiary-container", icon: "edit" },
    viewer: { color: "bg-secondary-container text-on-secondary-container", icon: "visibility" },
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-label-small capitalize ${variants[role].color}`}>
      <Icon symbol={variants[role].icon} className="w-3.5 h-3.5" />
      {role}
    </span>
  );
}

// ─── COLUMN DEFINITIONS ──────────────────────────────────────────────────────

export const userColumns: Column<User>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    filterable: true,
    pinnable: true,
    editable: true,
    width: 280,
    minWidth: 200,
    render: (row) => (
      <div className="flex items-center gap-3">
        <Avatar
          size="sm"
          fallback={row.name.split(" ").map((n) => n[0]).join("")}
          className="bg-primary text-on-primary shrink-0"
        />
        <div className="flex flex-col">
          <span className="text-body-medium text-on-surface font-medium">{row.name}</span>
          <span className="text-label-small text-on-surface-variant">{row.email}</span>
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
      <a href={`mailto:${row.email}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
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
    aggregation: "sum",
    summary: "sum",
    render: (row) => <span className="font-mono text-on-surface">${row.salary.toLocaleString()}</span>,
  },
  {
    key: "projects",
    header: "Projects",
    sortable: true,
    width: 100,
    align: "center",
    hideable: true,
    aggregation: "average",
    summary: "average",
    render: (row) => (
      <div className="flex items-center justify-center gap-1">
        <Icon symbol="folder" className="w-4 h-4 text-on-surface-variant" />
        <span className={row.projects > 10 ? "text-primary font-medium" : "text-on-surface"}>
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
        {new Date(row.joinDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

      return (
        <span className={diffDays > 7 ? "text-error" : "text-on-surface-variant"}>
          {diffDays === 0 ? "Today" : diffDays === 1 ? "Yesterday" : `${diffDays} days ago`}
        </span>
      );
    },
  },
];
