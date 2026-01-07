import { describe, it, expect } from "vitest";
import {
  validateColumns,
  assertValidColumns,
  isValidColumnKey,
  findDuplicateColumnKeys,
  getAllColumnKeys,
  validateRowIds,
} from "../../utils/validation";
import type { Column, ColumnGroup } from "../../types/column";
import { AggregateDataTableError } from "../../errors/aggregate-error";
import { DuplicateColumnKeyError, InvalidColumnKeyError } from "../../errors/column-errors";

// ─── TEST TYPES ─────────────────────────────────────────────────────────────────

interface TestRow {
  id: string;
  name: string;
  email: string;
  age: number;
}

// ─── TESTS: validateColumns ─────────────────────────────────────────────────────

describe("validateColumns", () => {
  it("should return valid for correct columns", () => {
    const columns: Column<TestRow>[] = [
      { key: "name", header: "Name" },
      { key: "email", header: "Email" },
      { key: "age", header: "Age" },
    ];

    const result = validateColumns(columns);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.columnCount).toBe(3);
  });

  it("should detect duplicate column keys", () => {
    const columns: Column<TestRow>[] = [
      { key: "name", header: "Name" },
      { key: "name", header: "Full Name" }, // Duplicate
      { key: "email", header: "Email" },
    ];

    const result = validateColumns(columns);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toBeInstanceOf(DuplicateColumnKeyError);
  });

  it("should detect multiple duplicate keys", () => {
    const columns: Column<TestRow>[] = [
      { key: "name", header: "Name" },
      { key: "name", header: "Name 2" },
      { key: "email", header: "Email" },
      { key: "email", header: "Email 2" },
    ];

    const result = validateColumns(columns);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  it("should detect invalid column keys (empty string)", () => {
    const columns = [
      { key: "", header: "Empty Key" },
      { key: "name", header: "Name" },
    ] as Column<TestRow>[];

    const result = validateColumns(columns);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toBeInstanceOf(InvalidColumnKeyError);
  });

  it("should detect invalid column keys (whitespace only)", () => {
    const columns = [
      { key: "   ", header: "Whitespace" },
      { key: "name", header: "Name" },
    ] as Column<TestRow>[];

    const result = validateColumns(columns);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  it("should detect invalid column keys (undefined)", () => {
    const columns = [
      { key: undefined, header: "No Key" },
      { key: "name", header: "Name" },
    ] as unknown as Column<TestRow>[];

    const result = validateColumns(columns);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  it("should validate nested column groups", () => {
    const columns: Array<Column<TestRow> | ColumnGroup<TestRow>> = [
      { key: "name", header: "Name" },
      {
        header: "Contact Info",
        children: [
          { key: "email", header: "Email" },
          { key: "email", header: "Email 2" }, // Duplicate
        ],
      },
    ];

    const result = validateColumns(columns);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  it("should count all columns including nested", () => {
    const columns: Array<Column<TestRow> | ColumnGroup<TestRow>> = [
      { key: "name", header: "Name" },
      {
        header: "Details",
        children: [
          { key: "email", header: "Email" },
          { key: "age", header: "Age" },
        ],
      },
    ];

    const result = validateColumns(columns);

    expect(result.columnCount).toBe(3);
  });

  it("should throw on first error when option is set", () => {
    const columns: Column<TestRow>[] = [
      { key: "name", header: "Name" },
      { key: "name", header: "Name 2" },
      { key: "name", header: "Name 3" },
    ];

    expect(() => {
      validateColumns(columns, { throwOnFirst: true });
    }).toThrow(DuplicateColumnKeyError);
  });

  it("should generate warnings for columns without headers", () => {
    const columns = [
      { key: "name" }, // No header
      { key: "email", header: "Email" },
    ] as Column<TestRow>[];

    const result = validateColumns(columns);

    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("no header");
  });

  it("should warn about very wide columns", () => {
    const columns: Column<TestRow>[] = [
      { key: "name", header: "Name", width: 600 },
    ];

    const result = validateColumns(columns);

    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes("very wide"))).toBe(true);
  });

  it("should warn about negative width", () => {
    const columns: Column<TestRow>[] = [
      { key: "name", header: "Name", width: -10 },
    ];

    const result = validateColumns(columns);

    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes("negative width"))).toBe(true);
  });

  it("should skip warnings when includeWarnings is false", () => {
    const columns = [
      { key: "name" }, // No header
    ] as Column<TestRow>[];

    const result = validateColumns(columns, { includeWarnings: false });

    expect(result.warnings).toHaveLength(0);
  });

  it("should handle empty columns array", () => {
    const result = validateColumns([]);

    expect(result.valid).toBe(true);
    expect(result.columnCount).toBe(0);
    expect(result.errors).toHaveLength(0);
  });
});

// ─── TESTS: assertValidColumns ─────────────────────────────────────────────────

describe("assertValidColumns", () => {
  it("should not throw for valid columns", () => {
    const columns: Column<TestRow>[] = [
      { key: "name", header: "Name" },
      { key: "email", header: "Email" },
    ];

    expect(() => {
      assertValidColumns(columns);
    }).not.toThrow();
  });

  it("should throw AggregateDataTableError for invalid columns", () => {
    const columns: Column<TestRow>[] = [
      { key: "name", header: "Name" },
      { key: "name", header: "Name 2" },
    ];

    expect(() => {
      assertValidColumns(columns);
    }).toThrow(AggregateDataTableError);
  });

  it("should include error count in message", () => {
    const columns: Column<TestRow>[] = [
      { key: "name", header: "Name" },
      { key: "name", header: "Name 2" },
      { key: "email", header: "Email" },
      { key: "email", header: "Email 2" },
    ];

    try {
      assertValidColumns(columns);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AggregateDataTableError);
      expect((error as AggregateDataTableError).message).toContain("2 error(s)");
    }
  });
});

// ─── TESTS: isValidColumnKey ─────────────────────────────────────────────────────

describe("isValidColumnKey", () => {
  it("should return true for valid string keys", () => {
    expect(isValidColumnKey("name")).toBe(true);
    expect(isValidColumnKey("user.name")).toBe(true);
    expect(isValidColumnKey("column_1")).toBe(true);
    expect(isValidColumnKey("a")).toBe(true);
  });

  it("should return false for empty string", () => {
    expect(isValidColumnKey("")).toBe(false);
    expect(isValidColumnKey("   ")).toBe(false);
  });

  it("should return false for non-string types", () => {
    expect(isValidColumnKey(null)).toBe(false);
    expect(isValidColumnKey(undefined)).toBe(false);
    expect(isValidColumnKey(123)).toBe(false);
    expect(isValidColumnKey({})).toBe(false);
    expect(isValidColumnKey([])).toBe(false);
  });

  it("should return false for reserved characters", () => {
    expect(isValidColumnKey("col||id")).toBe(false); // Cell ID separator
  });
});

// ─── TESTS: findDuplicateColumnKeys ─────────────────────────────────────────────

describe("findDuplicateColumnKeys", () => {
  it("should return empty array for unique keys", () => {
    const columns: Column<TestRow>[] = [
      { key: "name", header: "Name" },
      { key: "email", header: "Email" },
      { key: "age", header: "Age" },
    ];

    const duplicates = findDuplicateColumnKeys(columns);
    expect(duplicates).toEqual([]);
  });

  it("should find duplicate keys", () => {
    const columns: Column<TestRow>[] = [
      { key: "name", header: "Name" },
      { key: "name", header: "Name 2" },
      { key: "email", header: "Email" },
    ];

    const duplicates = findDuplicateColumnKeys(columns);
    expect(duplicates).toEqual(["name"]);
  });

  it("should find multiple duplicates", () => {
    const columns: Column<TestRow>[] = [
      { key: "name", header: "Name" },
      { key: "name", header: "Name 2" },
      { key: "email", header: "Email" },
      { key: "email", header: "Email 2" },
    ];

    const duplicates = findDuplicateColumnKeys(columns);
    expect(duplicates).toContain("name");
    expect(duplicates).toContain("email");
  });

  it("should find duplicates in nested column groups", () => {
    const columns: Array<Column<TestRow> | ColumnGroup<TestRow>> = [
      { key: "name", header: "Name" },
      {
        header: "Details",
        children: [
          { key: "name", header: "Name Again" },
        ],
      },
    ];

    const duplicates = findDuplicateColumnKeys(columns);
    expect(duplicates).toEqual(["name"]);
  });

  it("should not report same key multiple times", () => {
    const columns: Column<TestRow>[] = [
      { key: "name", header: "Name" },
      { key: "name", header: "Name 2" },
      { key: "name", header: "Name 3" },
    ];

    const duplicates = findDuplicateColumnKeys(columns);
    expect(duplicates).toHaveLength(1);
    expect(duplicates).toEqual(["name"]);
  });

  it("should handle empty array", () => {
    const duplicates = findDuplicateColumnKeys([]);
    expect(duplicates).toEqual([]);
  });
});

// ─── TESTS: getAllColumnKeys ─────────────────────────────────────────────────────

describe("getAllColumnKeys", () => {
  it("should return all keys from flat columns", () => {
    const columns: Column<TestRow>[] = [
      { key: "name", header: "Name" },
      { key: "email", header: "Email" },
      { key: "age", header: "Age" },
    ];

    const keys = getAllColumnKeys(columns);
    expect(keys).toEqual(["name", "email", "age"]);
  });

  it("should return keys from nested column groups", () => {
    const columns: Array<Column<TestRow> | ColumnGroup<TestRow>> = [
      { key: "name", header: "Name" },
      {
        header: "Contact",
        children: [
          { key: "email", header: "Email" },
        ],
      },
      { key: "age", header: "Age" },
    ];

    const keys = getAllColumnKeys(columns);
    expect(keys).toEqual(["name", "email", "age"]);
  });

  it("should handle column groups", () => {
    const columns: Array<Column<TestRow> | ColumnGroup<TestRow>> = [
      {
        header: "Level 1",
        children: [
          { key: "deep", header: "Deep" },
          { key: "other", header: "Other" },
        ],
      },
    ];

    const keys = getAllColumnKeys(columns);
    expect(keys).toEqual(["deep", "other"]);
  });

  it("should handle empty array", () => {
    const keys = getAllColumnKeys([]);
    expect(keys).toEqual([]);
  });

  it("should include duplicate keys", () => {
    const columns: Column<TestRow>[] = [
      { key: "name", header: "Name" },
      { key: "name", header: "Name 2" },
    ];

    const keys = getAllColumnKeys(columns);
    expect(keys).toEqual(["name", "name"]);
  });
});

// ─── TESTS: validateRowIds ─────────────────────────────────────────────────────

describe("validateRowIds", () => {
  it("should return valid for unique IDs", () => {
    const data = [
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
      { id: "3", name: "Charlie" },
    ];

    const result = validateRowIds(data);

    expect(result.valid).toBe(true);
    expect(result.duplicates).toHaveLength(0);
    expect(result.missing).toHaveLength(0);
  });

  it("should detect duplicate IDs", () => {
    const data = [
      { id: "1", name: "Alice" },
      { id: "1", name: "Bob" },
      { id: "3", name: "Charlie" },
    ];

    const result = validateRowIds(data);

    expect(result.valid).toBe(false);
    expect(result.duplicates).toEqual(["1"]);
  });

  it("should detect missing IDs", () => {
    const data = [
      { id: "1", name: "Alice" },
      { id: undefined, name: "Bob" },
      { id: "3", name: "Charlie" },
    ] as { id: string | undefined; name: string }[];

    const result = validateRowIds(data);

    expect(result.valid).toBe(false);
    expect(result.missing).toEqual([1]); // Index of missing
  });

  it("should detect null IDs as missing", () => {
    const data = [
      { id: "1", name: "Alice" },
      { id: null, name: "Bob" },
    ] as { id: string | null; name: string }[];

    const result = validateRowIds(data);

    expect(result.valid).toBe(false);
    expect(result.missing).toEqual([1]);
  });

  it("should detect empty string IDs as missing", () => {
    const data = [
      { id: "1", name: "Alice" },
      { id: "", name: "Bob" },
    ];

    const result = validateRowIds(data);

    expect(result.valid).toBe(false);
    expect(result.missing).toEqual([1]);
  });

  it("should use custom ID key", () => {
    const data = [
      { uuid: "a", name: "Alice" },
      { uuid: "b", name: "Bob" },
    ];

    const result = validateRowIds(data, "uuid");

    expect(result.valid).toBe(true);
  });

  it("should detect both duplicates and missing", () => {
    const data = [
      { id: "1", name: "Alice" },
      { id: "1", name: "Bob" },
      { id: undefined, name: "Charlie" },
    ] as { id: string | undefined; name: string }[];

    const result = validateRowIds(data);

    expect(result.valid).toBe(false);
    expect(result.duplicates).toEqual(["1"]);
    expect(result.missing).toEqual([2]);
  });

  it("should handle empty data array", () => {
    const result = validateRowIds([]);

    expect(result.valid).toBe(true);
    expect(result.duplicates).toHaveLength(0);
    expect(result.missing).toHaveLength(0);
  });

  it("should convert numeric IDs to strings", () => {
    const data = [
      { id: 1, name: "Alice" },
      { id: 1, name: "Bob" },
    ] as unknown as { id: string; name: string }[];

    const result = validateRowIds(data);

    expect(result.valid).toBe(false);
    expect(result.duplicates).toEqual(["1"]);
  });
});
