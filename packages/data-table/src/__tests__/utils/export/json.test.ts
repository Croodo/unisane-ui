import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exportToJSON, toJSONString } from "../../../utils/export/json";
import type { Column } from "../../../types";

// ─── TEST DATA ─────────────────────────────────────────────────────────────────

interface TestRow {
  id: string;
  name: string;
  email: string;
  age: number;
}

const testData: TestRow[] = [
  { id: "1", name: "Alice", email: "alice@example.com", age: 28 },
  { id: "2", name: "Bob", email: "bob@example.com", age: 32 },
  { id: "3", name: "Charlie", email: "charlie@example.com", age: 25 },
];

const testColumns: Column<TestRow>[] = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "age", header: "Age" },
];

// ─── MOCKS ─────────────────────────────────────────────────────────────────────

const mockCreateObjectURL = vi.fn(() => "blob:mock-url");
const mockRevokeObjectURL = vi.fn();

const mockClick = vi.fn();
const mockSetAttribute = vi.fn();
const mockRemove = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;

  vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
    if (tagName === "a") {
      return {
        href: "",
        download: "",
        click: mockClick,
        setAttribute: mockSetAttribute,
        remove: mockRemove,
        style: { visibility: "" },
      } as unknown as HTMLAnchorElement;
    }
    return document.createElement(tagName);
  });

  vi.spyOn(document.body, "appendChild").mockImplementation(mockAppendChild);
  vi.spyOn(document.body, "removeChild").mockImplementation(mockRemoveChild);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── TESTS: toJSONString ─────────────────────────────────────────────────────────

describe("toJSONString", () => {
  it("should generate valid JSON array", () => {
    const json = toJSONString({
      data: testData,
      columns: testColumns,
    });

    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(3);
  });

  it("should include all column data", () => {
    const json = toJSONString({
      data: testData,
      columns: testColumns,
    });

    const parsed = JSON.parse(json);
    expect(parsed[0]).toHaveProperty("name", "Alice");
    expect(parsed[0]).toHaveProperty("email", "alice@example.com");
    expect(parsed[0]).toHaveProperty("age", "28"); // Numbers converted to strings
  });

  it("should use pretty formatting by default", () => {
    const json = toJSONString({
      data: testData,
      columns: testColumns,
    });

    // Pretty JSON has newlines
    expect(json).toContain("\n");
    expect(json).toContain("  "); // Default indent of 2 spaces
  });

  it("should use compact formatting when pretty is false", () => {
    const json = toJSONString({
      data: testData,
      columns: testColumns,
      pretty: false,
    });

    // Compact JSON has no newlines
    expect(json).not.toContain("\n");
  });

  it("should use custom indent", () => {
    const json = toJSONString({
      data: testData,
      columns: testColumns,
      indent: 4,
    });

    expect(json).toContain("    "); // 4 space indent
  });

  it("should include metadata when requested", () => {
    const json = toJSONString({
      data: testData,
      columns: testColumns,
      includeMetadata: true,
    });

    const parsed = JSON.parse(json);
    expect(parsed).toHaveProperty("metadata");
    expect(parsed).toHaveProperty("data");
    expect(parsed.metadata).toHaveProperty("exportDate");
    expect(parsed.metadata).toHaveProperty("rowCount", 3);
    expect(parsed.metadata).toHaveProperty("columnCount", 3);
    expect(parsed.metadata.columns).toEqual(["Name", "Email", "Age"]);
  });

  it("should handle empty data", () => {
    const json = toJSONString({
      data: [],
      columns: testColumns,
    });

    const parsed = JSON.parse(json);
    expect(parsed).toEqual([]);
  });

  it("should use custom value formatter", () => {
    const formatValue = vi.fn((value) => `[${value}]`);

    const json = toJSONString({
      data: testData,
      columns: testColumns,
      formatValue,
    });

    const parsed = JSON.parse(json);
    expect(parsed[0].name).toBe("[Alice]");
    expect(formatValue).toHaveBeenCalled();
  });

  it("should handle null values", () => {
    const dataWithNull = [
      { id: "1", name: null as unknown as string, email: "test@test.com", age: 30 },
    ];

    const json = toJSONString({
      data: dataWithNull,
      columns: testColumns,
    });

    const parsed = JSON.parse(json);
    expect(parsed[0].name).toBe("");
  });

  it("should handle undefined values", () => {
    const dataWithUndefined = [
      { id: "1", name: undefined as unknown as string, email: "test@test.com", age: 30 },
    ];

    const json = toJSONString({
      data: dataWithUndefined,
      columns: testColumns,
    });

    const parsed = JSON.parse(json);
    expect(parsed[0].name).toBe("");
  });

  it("should filter visible columns when hiddenColumns specified", () => {
    const json = toJSONString({
      data: testData,
      columns: testColumns,
      visibleColumnsOnly: true,
      hiddenColumns: new Set(["email"]),
    });

    const parsed = JSON.parse(json);
    expect(parsed[0]).toHaveProperty("name");
    expect(parsed[0]).toHaveProperty("age");
    expect(parsed[0]).not.toHaveProperty("email");
  });

  it("should export only selected rows when specified", () => {
    const json = toJSONString({
      data: testData,
      columns: testColumns,
      selectedOnly: true,
      selectedIds: new Set(["1", "3"]),
    });

    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].name).toBe("Alice");
    expect(parsed[1].name).toBe("Charlie");
  });
});

// ─── TESTS: exportToJSON ─────────────────────────────────────────────────────────

describe("exportToJSON", () => {
  it("should return success result with row count", () => {
    const result = exportToJSON({
      data: testData,
      columns: testColumns,
      filename: "test-export",
    });

    expect(result.success).toBe(true);
    expect(result.rowCount).toBe(3);
    expect(result.fileSize).toBeGreaterThan(0);
  });

  it("should trigger file download", () => {
    vi.useFakeTimers();

    exportToJSON({
      data: testData,
      columns: testColumns,
      filename: "test-export",
    });

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(mockRevokeObjectURL).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("should return error for empty data", () => {
    const result = exportToJSON({
      data: [],
      columns: testColumns,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("No data");
  });

  it("should return error for empty columns", () => {
    const result = exportToJSON({
      data: testData,
      columns: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("No columns");
  });

  it("should return error when data is undefined", () => {
    const result = exportToJSON({
      data: undefined as unknown as TestRow[],
      columns: testColumns,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("No data");
  });

  it("should return error when columns is undefined", () => {
    const result = exportToJSON({
      data: testData,
      columns: undefined as unknown as Column<TestRow>[],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("No columns");
  });

  it("should filter visible columns only when specified", () => {
    const result = exportToJSON({
      data: testData,
      columns: testColumns,
      visibleColumnsOnly: true,
      hiddenColumns: new Set(["email"]),
    });

    expect(result.success).toBe(true);
  });

  it("should export only selected rows when specified", () => {
    const result = exportToJSON({
      data: testData,
      columns: testColumns,
      selectedOnly: true,
      selectedIds: new Set(["1", "3"]),
    });

    expect(result.success).toBe(true);
    expect(result.rowCount).toBe(2);
  });

  it("should use custom value formatter", () => {
    const formatValue = vi.fn((value) => `Formatted: ${value}`);

    const result = exportToJSON({
      data: testData,
      columns: testColumns,
      formatValue,
    });

    expect(result.success).toBe(true);
    expect(formatValue).toHaveBeenCalled();
  });
});

// ─── EDGE CASES ─────────────────────────────────────────────────────────────────

describe("JSON export edge cases", () => {
  it("should handle special characters", () => {
    const dataWithSpecial: TestRow[] = [
      { id: "1", name: 'Quote "test"', email: "test@test.com", age: 30 },
    ];

    const json = toJSONString({
      data: dataWithSpecial,
      columns: testColumns,
    });

    const parsed = JSON.parse(json);
    expect(parsed[0].name).toBe('Quote "test"');
  });

  it("should handle unicode characters", () => {
    const dataWithUnicode: TestRow[] = [
      { id: "1", name: "日本語テスト", email: "test@test.com", age: 30 },
    ];

    const json = toJSONString({
      data: dataWithUnicode,
      columns: testColumns,
    });

    const parsed = JSON.parse(json);
    expect(parsed[0].name).toBe("日本語テスト");
  });

  it("should handle emoji", () => {
    const dataWithEmoji: TestRow[] = [
      { id: "1", name: "Alice 🎉", email: "test@test.com", age: 30 },
    ];

    const json = toJSONString({
      data: dataWithEmoji,
      columns: testColumns,
    });

    const parsed = JSON.parse(json);
    expect(parsed[0].name).toBe("Alice 🎉");
  });

  it("should handle newlines in values", () => {
    const dataWithNewline: TestRow[] = [
      { id: "1", name: "Line1\nLine2", email: "test@test.com", age: 30 },
    ];

    const json = toJSONString({
      data: dataWithNewline,
      columns: testColumns,
    });

    const parsed = JSON.parse(json);
    expect(parsed[0].name).toBe("Line1\nLine2");
  });

  it("should handle backslashes", () => {
    const dataWithBackslash: TestRow[] = [
      { id: "1", name: "C:\\Users\\Test", email: "test@test.com", age: 30 },
    ];

    const json = toJSONString({
      data: dataWithBackslash,
      columns: testColumns,
    });

    const parsed = JSON.parse(json);
    expect(parsed[0].name).toBe("C:\\Users\\Test");
  });

  it("should handle boolean values", () => {
    interface RowWithBool {
      id: string;
      name: string;
      active: boolean;
    }

    const dataWithBool: RowWithBool[] = [
      { id: "1", name: "Alice", active: true },
      { id: "2", name: "Bob", active: false },
    ];

    const columns: Column<RowWithBool>[] = [
      { key: "name", header: "Name" },
      { key: "active", header: "Active" },
    ];

    const json = toJSONString({
      data: dataWithBool,
      columns,
    });

    const parsed = JSON.parse(json);
    // Booleans converted to Yes/No strings
    expect(parsed[0].active).toBe("Yes");
    expect(parsed[1].active).toBe("No");
  });

  it("should handle very large numbers", () => {
    interface RowWithLargeNum {
      id: string;
      value: number;
    }

    const dataWithLargeNum: RowWithLargeNum[] = [
      { id: "1", value: Number.MAX_SAFE_INTEGER },
    ];

    const columns: Column<RowWithLargeNum>[] = [
      { key: "value", header: "Value" },
    ];

    const json = toJSONString({
      data: dataWithLargeNum,
      columns,
    });

    const parsed = JSON.parse(json);
    expect(parsed[0].value).toBe(String(Number.MAX_SAFE_INTEGER));
  });

  it("should handle zero indent", () => {
    const json = toJSONString({
      data: testData,
      columns: testColumns,
      indent: 0,
    });

    // With indent 0, JSON.stringify produces compact output (no newlines or extra spaces)
    expect(json).not.toContain("  ");
    // Can still be parsed correctly
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(3);
  });

  it("should handle metadata with selected rows", () => {
    const json = toJSONString({
      data: testData,
      columns: testColumns,
      includeMetadata: true,
      selectedOnly: true,
      selectedIds: new Set(["1", "2"]),
    });

    const parsed = JSON.parse(json);
    expect(parsed.metadata.rowCount).toBe(2);
    expect(parsed.data).toHaveLength(2);
  });

  it("should handle metadata with hidden columns", () => {
    const json = toJSONString({
      data: testData,
      columns: testColumns,
      includeMetadata: true,
      visibleColumnsOnly: true,
      hiddenColumns: new Set(["age"]),
    });

    const parsed = JSON.parse(json);
    expect(parsed.metadata.columnCount).toBe(2);
    expect(parsed.metadata.columns).toEqual(["Name", "Email"]);
  });
});
