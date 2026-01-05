import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useProcessedData } from "../../../hooks/data/use-processed-data";
import type { Column, FilterState, MultiSortState, TypedFilterValue } from "../../types";

// ─── TEST DATA ─────────────────────────────────────────────────────────────────

interface TestRow {
  id: string;
  name: string;
  email: string;
  age: number;
  status: "active" | "inactive";
  createdAt: Date;
  nested?: {
    value: string;
  };
}

const testData: TestRow[] = [
  { id: "1", name: "Alice", email: "alice@example.com", age: 28, status: "active", createdAt: new Date("2023-01-15") },
  { id: "2", name: "Bob", email: "bob@example.com", age: 32, status: "inactive", createdAt: new Date("2023-02-20") },
  { id: "3", name: "Charlie", email: "charlie@example.com", age: 25, status: "active", createdAt: new Date("2023-03-10") },
  { id: "4", name: "Diana", email: "diana@example.com", age: 35, status: "active", createdAt: new Date("2023-04-05") },
  { id: "5", name: "Eve", email: "eve@example.com", age: 29, status: "inactive", createdAt: new Date("2023-05-25") },
];

const testColumns: Column<TestRow>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "email", header: "Email", sortable: true },
  { key: "age", header: "Age", sortable: true },
  { key: "status", header: "Status", filterable: true },
  { key: "createdAt", header: "Created", sortable: true },
];

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────────────────

function createDefaultOptions(overrides: Partial<Parameters<typeof useProcessedData<TestRow>>[0]> = {}) {
  return {
    data: testData,
    searchText: "",
    columnFilters: {} as FilterState,
    sortState: [] as MultiSortState,
    columns: testColumns,
    ...overrides,
  };
}

// ─── TESTS ─────────────────────────────────────────────────────────────────────

describe("useProcessedData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic functionality", () => {
    it("should return all data when no processing is applied", () => {
      const { result } = renderHook(() => useProcessedData(createDefaultOptions()));

      expect(result.current).toHaveLength(5);
      expect(result.current).toEqual(testData);
    });

    it("should return empty array for empty data", () => {
      const { result } = renderHook(() =>
        useProcessedData(createDefaultOptions({ data: [] }))
      );

      expect(result.current).toHaveLength(0);
    });

    it("should skip processing when disableLocalProcessing is true", () => {
      const { result } = renderHook(() =>
        useProcessedData(
          createDefaultOptions({
            searchText: "alice",
            disableLocalProcessing: true,
          })
        )
      );

      // Should return original data unchanged
      expect(result.current).toHaveLength(5);
    });
  });

  describe("search functionality", () => {
    it("should filter by search text (case-insensitive)", () => {
      const { result } = renderHook(() =>
        useProcessedData(createDefaultOptions({ searchText: "alice" }))
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0]?.name).toBe("Alice");
    });

    it("should search across all columns", () => {
      const { result } = renderHook(() =>
        useProcessedData(createDefaultOptions({ searchText: "example.com" }))
      );

      // All rows have example.com in email
      expect(result.current).toHaveLength(5);
    });

    it("should return empty array when search has no matches", () => {
      const { result } = renderHook(() =>
        useProcessedData(createDefaultOptions({ searchText: "xyz123" }))
      );

      expect(result.current).toHaveLength(0);
    });

    it("should handle partial matches", () => {
      const { result } = renderHook(() =>
        useProcessedData(createDefaultOptions({ searchText: "ali" }))
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0]?.name).toBe("Alice");
    });

    it("should trim search text", () => {
      const { result } = renderHook(() =>
        useProcessedData(createDefaultOptions({ searchText: "  alice  " }))
      );

      expect(result.current).toHaveLength(1);
    });

    it("should ignore empty search text", () => {
      const { result } = renderHook(() =>
        useProcessedData(createDefaultOptions({ searchText: "   " }))
      );

      expect(result.current).toHaveLength(5);
    });
  });

  describe("sorting functionality", () => {
    it("should sort by single column ascending", () => {
      const { result } = renderHook(() =>
        useProcessedData(
          createDefaultOptions({
            sortState: [{ key: "age", direction: "asc" }],
          })
        )
      );

      expect(result.current.map((r) => r.age)).toEqual([25, 28, 29, 32, 35]);
    });

    it("should sort by single column descending", () => {
      const { result } = renderHook(() =>
        useProcessedData(
          createDefaultOptions({
            sortState: [{ key: "age", direction: "desc" }],
          })
        )
      );

      expect(result.current.map((r) => r.age)).toEqual([35, 32, 29, 28, 25]);
    });

    it("should sort strings alphabetically (case-insensitive)", () => {
      const { result } = renderHook(() =>
        useProcessedData(
          createDefaultOptions({
            sortState: [{ key: "name", direction: "asc" }],
          })
        )
      );

      expect(result.current.map((r) => r.name)).toEqual([
        "Alice",
        "Bob",
        "Charlie",
        "Diana",
        "Eve",
      ]);
    });

    it("should sort dates correctly", () => {
      const { result } = renderHook(() =>
        useProcessedData(
          createDefaultOptions({
            sortState: [{ key: "createdAt", direction: "asc" }],
          })
        )
      );

      expect(result.current.map((r) => r.name)).toEqual([
        "Alice",
        "Bob",
        "Charlie",
        "Diana",
        "Eve",
      ]);
    });

    it("should handle multi-column sort", () => {
      const dataWithDuplicates: TestRow[] = [
        { id: "1", name: "Alice", email: "a@test.com", age: 30, status: "active", createdAt: new Date() },
        { id: "2", name: "Bob", email: "b@test.com", age: 30, status: "inactive", createdAt: new Date() },
        { id: "3", name: "Charlie", email: "c@test.com", age: 25, status: "active", createdAt: new Date() },
      ];

      const { result } = renderHook(() =>
        useProcessedData(
          createDefaultOptions({
            data: dataWithDuplicates,
            sortState: [
              { key: "age", direction: "asc" },
              { key: "name", direction: "desc" },
            ],
          })
        )
      );

      // First sort by age (25, 30, 30), then by name desc within same age
      expect(result.current.map((r) => r.name)).toEqual(["Charlie", "Bob", "Alice"]);
    });

    it("should handle null/undefined values in sort", () => {
      const dataWithNulls = [
        { id: "1", name: "Alice", email: "a@test.com", age: 30, status: "active" as const, createdAt: new Date(), nested: { value: "a" } },
        { id: "2", name: "Bob", email: "b@test.com", age: 25, status: "active" as const, createdAt: new Date(), nested: undefined },
        { id: "3", name: "Charlie", email: "c@test.com", age: 28, status: "active" as const, createdAt: new Date() },
      ];

      const columnsWithNested: Column<TestRow>[] = [
        ...testColumns,
        { key: "nested.value", header: "Nested", sortable: true },
      ];

      const { result } = renderHook(() =>
        useProcessedData({
          data: dataWithNulls,
          searchText: "",
          columnFilters: {},
          sortState: [{ key: "nested.value", direction: "asc" }],
          columns: columnsWithNested,
        })
      );

      // Non-null values should come first in ascending order
      expect(result.current[0]?.name).toBe("Alice");
    });

    it("should use custom sortFn when provided", () => {
      const columnsWithCustomSort: Column<TestRow>[] = [
        {
          key: "name",
          header: "Name",
          sortable: true,
          sortFn: (a, b) => b.name.length - a.name.length, // Sort by name length descending
        },
        ...testColumns.slice(1),
      ];

      const { result } = renderHook(() =>
        useProcessedData({
          ...createDefaultOptions(),
          columns: columnsWithCustomSort,
          sortState: [{ key: "name", direction: "asc" }],
        })
      );

      // Charlie (7) > Diana (5) > Alice (5) > Eve (3) > Bob (3)
      expect(result.current[0]?.name).toBe("Charlie");
    });
  });

  describe("filter functionality", () => {
    it("should filter by simple string value (contains match)", () => {
      // Legacy string filter uses 'includes' for partial matching
      const { result } = renderHook(() =>
        useProcessedData(
          createDefaultOptions({
            columnFilters: { name: "ali" }, // matches "Alice"
          })
        )
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0]?.name).toBe("Alice");
    });

    it("should filter by select typed filter for exact match", () => {
      // Use TypedFilterValue for exact match
      const selectFilter: TypedFilterValue = {
        type: "select",
        value: "active",
      };

      const { result } = renderHook(() =>
        useProcessedData(
          createDefaultOptions({
            columnFilters: { status: selectFilter },
          })
        )
      );

      expect(result.current).toHaveLength(3);
      expect(result.current.every((r) => r.status === "active")).toBe(true);
    });

    it("should filter by multiple columns", () => {
      const { result } = renderHook(() =>
        useProcessedData(
          createDefaultOptions({
            columnFilters: { status: "active", name: "ali" },
          })
        )
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0]?.name).toBe("Alice");
    });

    it("should filter by array (multi-select)", () => {
      const { result } = renderHook(() =>
        useProcessedData(
          createDefaultOptions({
            columnFilters: { name: ["Alice", "Bob"] },
          })
        )
      );

      expect(result.current).toHaveLength(2);
      expect(result.current.map((r) => r.name).sort()).toEqual(["Alice", "Bob"]);
    });

    it("should filter by number range (legacy)", () => {
      const { result } = renderHook(() =>
        useProcessedData(
          createDefaultOptions({
            columnFilters: { age: { min: 25, max: 30 } },
          })
        )
      );

      expect(result.current).toHaveLength(3);
      expect(result.current.every((r) => r.age >= 25 && r.age <= 30)).toBe(true);
    });

    it("should filter by boolean value", () => {
      const dataWithBoolean = testData.map((row) => ({
        ...row,
        isVerified: row.status === "active",
      }));

      const columnsWithBoolean: Column<(typeof dataWithBoolean)[0]>[] = [
        ...testColumns,
        { key: "isVerified", header: "Verified", filterable: true },
      ] as Column<(typeof dataWithBoolean)[0]>[];

      const { result } = renderHook(() =>
        useProcessedData({
          data: dataWithBoolean,
          searchText: "",
          columnFilters: { isVerified: true },
          sortState: [],
          columns: columnsWithBoolean,
        })
      );

      expect(result.current).toHaveLength(3);
    });

    it("should use custom filterFn when provided", () => {
      const columnsWithCustomFilter: Column<TestRow>[] = [
        {
          key: "age",
          header: "Age",
          filterable: true,
          filterFn: (row, value) => {
            // Custom: filter for ages divisible by value
            const num = Number(value);
            return row.age % num === 0;
          },
        },
        ...testColumns.slice(1),
      ];

      const { result } = renderHook(() =>
        useProcessedData({
          ...createDefaultOptions(),
          columns: columnsWithCustomFilter,
          columnFilters: { age: 5 },
        })
      );

      // Ages: 28, 32, 25, 35, 29 - only 25 and 35 are divisible by 5
      expect(result.current).toHaveLength(2);
      expect(result.current.map((r) => r.age).sort((a, b) => a - b)).toEqual([25, 35]);
    });
  });

  describe("TypedFilterValue support", () => {
    it("should filter with text filter (contains)", () => {
      const textFilter: TypedFilterValue = {
        type: "text",
        value: "ali",
        match: "contains",
      };

      const { result } = renderHook(() =>
        useProcessedData(
          createDefaultOptions({
            columnFilters: { name: textFilter },
          })
        )
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0]?.name).toBe("Alice");
    });

    it("should filter with text filter (exact)", () => {
      const textFilter: TypedFilterValue = {
        type: "text",
        value: "Alice",
        match: "exact",
      };

      const { result } = renderHook(() =>
        useProcessedData(
          createDefaultOptions({
            columnFilters: { name: textFilter },
          })
        )
      );

      expect(result.current).toHaveLength(1);
    });

    it("should filter with text filter (starts-with)", () => {
      const textFilter: TypedFilterValue = {
        type: "text",
        value: "A",
        match: "starts-with",
      };

      const { result } = renderHook(() =>
        useProcessedData(
          createDefaultOptions({
            columnFilters: { name: textFilter },
          })
        )
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0]?.name).toBe("Alice");
    });

    it("should filter with number filter (operators)", () => {
      const gtFilter: TypedFilterValue = {
        type: "number",
        value: 30,
        operator: "gt",
      };

      const { result } = renderHook(() =>
        useProcessedData(
          createDefaultOptions({
            columnFilters: { age: gtFilter },
          })
        )
      );

      expect(result.current).toHaveLength(2); // 32 and 35
      expect(result.current.every((r) => r.age > 30)).toBe(true);
    });

    it("should filter with number-range filter", () => {
      const rangeFilter: TypedFilterValue = {
        type: "number-range",
        min: 28,
        max: 32,
      };

      const { result } = renderHook(() =>
        useProcessedData(
          createDefaultOptions({
            columnFilters: { age: rangeFilter },
          })
        )
      );

      expect(result.current).toHaveLength(3); // 28, 29, 32
    });

    it("should filter with select filter", () => {
      const selectFilter: TypedFilterValue = {
        type: "select",
        value: "active",
      };

      const { result } = renderHook(() =>
        useProcessedData(
          createDefaultOptions({
            columnFilters: { status: selectFilter },
          })
        )
      );

      expect(result.current).toHaveLength(3);
    });

    it("should filter with multi-select filter (any match)", () => {
      const multiFilter: TypedFilterValue = {
        type: "multi-select",
        values: ["Alice", "Bob", "NonExistent"],
        match: "any",
      };

      const { result } = renderHook(() =>
        useProcessedData(
          createDefaultOptions({
            columnFilters: { name: multiFilter },
          })
        )
      );

      expect(result.current).toHaveLength(2);
    });

    it("should filter with boolean filter", () => {
      const dataWithBoolean = testData.map((row) => ({
        ...row,
        isActive: row.status === "active",
      }));

      const boolFilter: TypedFilterValue = {
        type: "boolean",
        value: true,
      };

      const { result } = renderHook(() =>
        useProcessedData({
          data: dataWithBoolean,
          searchText: "",
          columnFilters: { isActive: boolFilter },
          sortState: [],
          columns: testColumns as Column<(typeof dataWithBoolean)[0]>[],
        })
      );

      expect(result.current).toHaveLength(3);
    });

    it("should filter with date filter", () => {
      const dateFilter: TypedFilterValue = {
        type: "date",
        value: new Date("2023-02-20"),
        operator: "eq",
      };

      const { result } = renderHook(() =>
        useProcessedData(
          createDefaultOptions({
            columnFilters: { createdAt: dateFilter },
          })
        )
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0]?.name).toBe("Bob");
    });

    it("should filter with date-range filter", () => {
      const dateRangeFilter: TypedFilterValue = {
        type: "date-range",
        start: new Date("2023-02-01"),
        end: new Date("2023-04-01"),
      };

      const { result } = renderHook(() =>
        useProcessedData(
          createDefaultOptions({
            columnFilters: { createdAt: dateRangeFilter },
          })
        )
      );

      expect(result.current).toHaveLength(2); // Bob (Feb 20) and Charlie (Mar 10)
    });
  });

  describe("combined operations", () => {
    it("should apply search, filter, and sort together", () => {
      // Use TypedFilterValue for exact status match
      const statusFilter: TypedFilterValue = {
        type: "select",
        value: "active",
      };

      const { result } = renderHook(() =>
        useProcessedData(
          createDefaultOptions({
            searchText: "example",
            columnFilters: { status: statusFilter },
            sortState: [{ key: "age", direction: "desc" }],
          })
        )
      );

      // All have example.com, filter to active (3), sort by age desc
      expect(result.current).toHaveLength(3);
      expect(result.current.map((r) => r.age)).toEqual([35, 28, 25]); // Diana, Alice, Charlie
    });

    it("should process in correct order: search -> filter -> sort", () => {
      // Use TypedFilterValue for exact status match
      const statusFilter: TypedFilterValue = {
        type: "select",
        value: "active",
      };

      // This verifies the processing pipeline order
      const { result } = renderHook(() =>
        useProcessedData(
          createDefaultOptions({
            searchText: "a", // Alice, Diana, Charlie (has 'a' in name or email)
            columnFilters: { status: statusFilter },
            sortState: [{ key: "name", direction: "asc" }],
          })
        )
      );

      // Search for 'a' matches all (in email), filter to active, sort alphabetically
      expect(result.current).toHaveLength(3);
      expect(result.current[0]?.name).toBe("Alice");
    });
  });

  describe("debouncing", () => {
    it("should debounce search text", () => {
      vi.useFakeTimers();

      const { result, rerender } = renderHook(
        ({ searchText }) =>
          useProcessedData(
            createDefaultOptions({
              searchText,
              searchDebounceMs: 300,
            })
          ),
        { initialProps: { searchText: "" } }
      );

      expect(result.current).toHaveLength(5);

      // Update search text
      rerender({ searchText: "alice" });

      // Should still be 5 immediately (debounced)
      expect(result.current).toHaveLength(5);

      // Advance time past debounce threshold
      act(() => {
        vi.advanceTimersByTime(350);
      });

      // Now should be filtered
      expect(result.current).toHaveLength(1);

      vi.useRealTimers();
    });

    it("should debounce column filters", () => {
      vi.useFakeTimers();

      const nameFilter: TypedFilterValue = {
        type: "text",
        value: "ali",
        match: "contains",
      };

      const { result, rerender } = renderHook(
        ({ columnFilters }) =>
          useProcessedData(
            createDefaultOptions({
              columnFilters,
              filterDebounceMs: 200,
            })
          ),
        { initialProps: { columnFilters: {} as FilterState } }
      );

      expect(result.current).toHaveLength(5);

      rerender({ columnFilters: { name: nameFilter } });

      // Should still be 5 immediately
      expect(result.current).toHaveLength(5);

      act(() => {
        vi.advanceTimersByTime(250);
      });

      // Now should be filtered
      expect(result.current).toHaveLength(1);

      vi.useRealTimers();
    });
  });

  describe("error handling", () => {
    it("should handle filterFn that throws error", () => {
      const mockErrorHub = {
        report: vi.fn(),
      };

      // Create columns with a throwing filter for 'name' column
      const columnsWithThrowingFilter: Column<TestRow>[] = [
        {
          key: "name",
          header: "Name",
          filterable: true,
          filterFn: () => {
            throw new Error("Filter error");
          },
        },
        { key: "email", header: "Email" },
        { key: "age", header: "Age" },
        { key: "status", header: "Status" },
      ];

      const { result } = renderHook(() =>
        useProcessedData({
          data: testData,
          searchText: "",
          columnFilters: { name: "Alice" }, // This will trigger the throwing filterFn
          sortState: [],
          columns: columnsWithThrowingFilter,
          errorHub: mockErrorHub as unknown as Parameters<typeof useProcessedData>[0]["errorHub"],
        })
      );

      // Should fail open (include all rows) when filter throws
      expect(result.current).toHaveLength(5);
      expect(mockErrorHub.report).toHaveBeenCalled();
    });

    it("should handle sortFn that throws error", () => {
      const mockErrorHub = {
        report: vi.fn(),
      };

      const columnsWithThrowingSort: Column<TestRow>[] = [
        {
          key: "name",
          header: "Name",
          sortable: true,
          sortFn: () => {
            throw new Error("Sort error");
          },
        },
        ...testColumns.slice(1),
      ];

      const { result } = renderHook(() =>
        useProcessedData({
          ...createDefaultOptions(),
          columns: columnsWithThrowingSort,
          sortState: [{ key: "name", direction: "asc" }],
          errorHub: mockErrorHub as unknown as Parameters<typeof useProcessedData>[0]["errorHub"],
        })
      );

      // Should still return data (treated as equal)
      expect(result.current).toHaveLength(5);
      expect(mockErrorHub.report).toHaveBeenCalled();
    });
  });

  describe("memoization", () => {
    it("should return same reference when inputs are unchanged", () => {
      const options = createDefaultOptions();

      const { result, rerender } = renderHook(() => useProcessedData(options));

      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });

    it("should return new reference when data changes", () => {
      const { result, rerender } = renderHook(
        ({ data }) => useProcessedData(createDefaultOptions({ data })),
        { initialProps: { data: testData } }
      );

      const firstResult = result.current;

      rerender({ data: [...testData] });

      // New array reference should trigger recalculation
      expect(result.current).not.toBe(firstResult);
    });
  });
});
