import React, { type ReactNode } from "react";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { DataTableProvider } from "../context/provider";
import type { DataTableProviderProps } from "../context/types";
import type { Column } from "../types";

// ─── DEFAULT TEST DATA ─────────────────────────────────────────────────────────

export interface TestRow {
  id: string;
  name: string;
  email: string;
  age: number;
  status: "active" | "inactive";
}

export const defaultTestData: TestRow[] = [
  { id: "1", name: "Alice", email: "alice@example.com", age: 28, status: "active" },
  { id: "2", name: "Bob", email: "bob@example.com", age: 32, status: "inactive" },
  { id: "3", name: "Charlie", email: "charlie@example.com", age: 25, status: "active" },
  { id: "4", name: "Diana", email: "diana@example.com", age: 35, status: "active" },
  { id: "5", name: "Eve", email: "eve@example.com", age: 29, status: "inactive" },
];

export const defaultTestColumns: Column<TestRow>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "email", header: "Email", sortable: true },
  { key: "age", header: "Age", sortable: true, align: "end" },
  { key: "status", header: "Status", filterable: true, filterType: "select" },
];

// ─── WRAPPER COMPONENT ─────────────────────────────────────────────────────────

interface WrapperProps<T> {
  children: ReactNode;
  providerProps?: Partial<DataTableProviderProps<T>>;
}

function createWrapper<T extends { id: string }>(
  columns: Column<T>[],
  providerProps?: Partial<DataTableProviderProps<T>>
) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <DataTableProvider columns={columns} {...providerProps}>
        {children}
      </DataTableProvider>
    );
  };
}

// ─── CUSTOM RENDER ─────────────────────────────────────────────────────────────

interface CustomRenderOptions<T extends { id: string }> extends Omit<RenderOptions, "wrapper"> {
  columns?: Column<T>[];
  providerProps?: Partial<DataTableProviderProps<T>>;
}

export function renderWithDataTable<T extends { id: string } = TestRow>(
  ui: React.ReactElement,
  options: CustomRenderOptions<T> = {}
): RenderResult {
  const {
    columns = defaultTestColumns as unknown as Column<T>[],
    providerProps,
    ...renderOptions
  } = options;

  return render(ui, {
    wrapper: createWrapper(columns, providerProps),
    ...renderOptions,
  });
}

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────────────────

export function createMockData(count: number): TestRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    age: 20 + (i % 50),
    status: i % 2 === 0 ? "active" : "inactive",
  }));
}

// ─── RE-EXPORTS ────────────────────────────────────────────────────────────────

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
