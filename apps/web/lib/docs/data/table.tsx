"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Card, Checkbox, Badge } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const TableHeroVisual = () => (
  <HeroBackground tone="surface">
    {/* Mock Table */}
    <div className="relative bg-surface w-[320px] rounded-xl shadow-xl overflow-hidden border border-outline-variant/30">
      <table className="w-full text-body-small">
        <thead className="bg-surface-container-low border-b border-outline-variant/30">
          <tr>
            <th className="px-4 py-3 text-left text-label-medium text-on-surface-variant font-medium">Name</th>
            <th className="px-4 py-3 text-left text-label-medium text-on-surface-variant font-medium">Status</th>
            <th className="px-4 py-3 text-right text-label-medium text-on-surface-variant font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-outline-variant/15 hover:bg-surface-container-low">
            <td className="px-4 py-3 text-on-surface">Project Alpha</td>
            <td className="px-4 py-3"><span className="text-primary text-label-small font-medium">Active</span></td>
            <td className="px-4 py-3 text-right text-on-surface tabular-nums">$12,500</td>
          </tr>
          <tr className="border-b border-outline-variant/15 bg-primary/5">
            <td className="px-4 py-3 text-on-surface">Project Beta</td>
            <td className="px-4 py-3"><span className="text-tertiary text-label-small font-medium">Pending</span></td>
            <td className="px-4 py-3 text-right text-on-surface tabular-nums">$8,200</td>
          </tr>
          <tr className="hover:bg-surface-container-low">
            <td className="px-4 py-3 text-on-surface">Project Gamma</td>
            <td className="px-4 py-3"><span className="text-on-surface-variant text-label-small font-medium">Draft</span></td>
            <td className="px-4 py-3 text-right text-on-surface tabular-nums">$4,800</td>
          </tr>
        </tbody>
      </table>
    </div>
  </HeroBackground>
);

export const tableDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "table",
  name: "Table",
  description:
    "Tables display sets of data organized in rows and columns.",
  category: "data-display",
  status: "stable",
  icon: "table",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Table", "TableHeader", "TableBody", "TableRow", "TableHead", "TableCell"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <TableHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Tables can be styled in different ways based on data density and purpose.",
    columns: {
      emphasis: "Style",
      component: "Example",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Default",
        component: (
          <div className="w-44 bg-surface rounded-sm border border-outline-variant/30 overflow-hidden">
            <table className="w-full text-[10px]">
              <thead className="bg-surface-container-low border-b border-outline-variant/30">
                <tr><th className="px-2 py-1 text-left">Col 1</th><th className="px-2 py-1 text-left">Col 2</th></tr>
              </thead>
              <tbody>
                <tr className="border-b border-outline-variant/15"><td className="px-2 py-1">A</td><td className="px-2 py-1">B</td></tr>
              </tbody>
            </table>
          </div>
        ),
        rationale:
          "Standard data display with clear column headers.",
        examples: "Data grids, Reports, Admin panels",
      },
      {
        emphasis: "Compact",
        component: (
          <div className="w-44 bg-surface rounded-sm border border-outline-variant/30 overflow-hidden">
            <table className="w-full text-[9px]">
              <thead className="bg-surface-container-low border-b border-outline-variant/30">
                <tr><th className="px-1 py-0_5 text-left">Col 1</th><th className="px-1 py-0_5 text-left">Col 2</th></tr>
              </thead>
              <tbody>
                <tr className="border-b border-outline-variant/15"><td className="px-1 py-0_5">A</td><td className="px-1 py-0_5">B</td></tr>
                <tr><td className="px-1 py-0_5">C</td><td className="px-1 py-0_5">D</td></tr>
              </tbody>
            </table>
          </div>
        ),
        rationale:
          "Dense data with many rows visible.",
        examples: "Logs, Transaction history, Stock data",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "Tables are composed of header, body, rows, and cells.",
    items: [
      {
        component: (
          <div className="w-32 bg-surface-container-low rounded-sm p-2 text-[10px] text-on-surface-variant font-medium">TableHeader</div>
        ),
        title: "Header",
        subtitle: "Column labels",
      },
      {
        component: (
          <div className="w-32 bg-surface rounded-sm p-2 text-[10px] text-on-surface border border-outline-variant/30">TableBody</div>
        ),
        title: "Body",
        subtitle: "Data rows",
      },
      {
        component: (
          <div className="w-32 bg-surface rounded-sm p-2 text-[10px] text-on-surface border border-outline-variant/30 hover:bg-surface-container-low">TableRow</div>
        ),
        title: "Row",
        subtitle: "Interactive row",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Tables are used within cards or page sections to display structured data.",
    examples: [
      {
        title: "Simple data table",
        visual: (
          <Card variant="outlined" padding="none" className="max-w-[320px] mx-auto overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Alice</TableCell>
                  <TableCell>Admin</TableCell>
                  <TableCell><Badge variant="tonal" color="success">Active</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Bob</TableCell>
                  <TableCell>Editor</TableCell>
                  <TableCell><Badge variant="tonal" color="success">Active</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        ),
        caption: "Basic table with status badges",
      },
      {
        title: "Selectable rows",
        visual: (
          <Card variant="outlined" padding="none" className="max-w-[320px] mx-auto overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"><Checkbox aria-label="Select all" /></TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell><Checkbox defaultChecked aria-label="Select item" /></TableCell>
                  <TableCell>Product A</TableCell>
                  <TableCell className="text-right">$29.99</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><Checkbox aria-label="Select item" /></TableCell>
                  <TableCell>Product B</TableCell>
                  <TableCell className="text-right">$49.99</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        ),
        caption: "Table with selectable rows",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "children",
      type: "ReactNode",
      required: true,
      description: "Table content (TableHeader and TableBody).",
    },
    {
      name: "className",
      type: "string",
      description: "Additional CSS classes for the table.",
    },
  ],

  // ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────
  subComponents: [
    {
      name: "TableHeader",
      description: "Container for column headers. Styled with sticky positioning.",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "TableRow with TableHead cells." },
      ],
    },
    {
      name: "TableBody",
      description: "Container for data rows.",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "TableRow elements." },
      ],
    },
    {
      name: "TableRow",
      description: "A single table row with hover state.",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "TableHead or TableCell elements." },
      ],
    },
    {
      name: "TableHead",
      description: "Header cell with label styling.",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "Column label." },
        { name: "scope", type: '"col" | "row"', default: '"col"', description: "Scope of the header." },
      ],
    },
    {
      name: "TableCell",
      description: "Data cell with body text styling.",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "Cell content." },
      ],
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Uses semantic <table> structure for screen reader navigation.",
      "TableHead uses scope='col' for proper column association.",
      "Complex tables should include caption or aria-describedby.",
    ],
    keyboard: [
      { key: "Tab", description: "Moves focus to interactive elements within cells" },
      { key: "Arrow Keys", description: "Can be used with additional table navigation patterns" },
    ],
    focus: [
      "Interactive elements within cells receive focus.",
      "Row hover states provide visual feedback.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Compose tables with header, body, rows, and cells.",
    code: `import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
} from "@unisane/ui";

function UserTable({ users }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>
              <Badge variant={user.active ? "standard" : "outlined"}>
                {user.active ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "list",
      reason: "Use for non-tabular data display.",
    },
    {
      slug: "pagination",
      reason: "Use to paginate large data sets.",
    },
    {
      slug: "card",
      reason: "Wrap tables in cards for visual containment.",
    },
  ],
};
