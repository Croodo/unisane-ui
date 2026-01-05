import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exportToCSV, toCSVString } from "../../../utils/export/csv";
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

// ─── TESTS: toCSVString ─────────────────────────────────────────────────────────

describe("toCSVString", () => {
  it("should generate valid CSV with headers and data", () => {
    const csv = toCSVString({
      data: testData,
      columns: testColumns,
    });

    const lines = csv.split("\n");
    expect(lines).toHaveLength(4); // 1 header + 3 data rows
    expect(lines[0]).toBe("Name,Email,Age");
    expect(lines[1]).toBe("Alice,alice@example.com,28");
    expect(lines[2]).toBe("Bob,bob@example.com,32");
    expect(lines[3]).toBe("Charlie,charlie@example.com,25");
  });

  it("should exclude headers when includeHeaders is false", () => {
    const csv = toCSVString({
      data: testData,
      columns: testColumns,
      includeHeaders: false,
    });

    const lines = csv.split("\n");
    expect(lines).toHaveLength(3); // 3 data rows only
    expect(lines[0]).toBe("Alice,alice@example.com,28");
  });

  it("should use custom delimiter", () => {
    const csv = toCSVString({
      data: testData,
      columns: testColumns,
      delimiter: ";",
    });

    const lines = csv.split("\n");
    expect(lines[0]).toBe("Name;Email;Age");
    expect(lines[1]).toBe("Alice;alice@example.com;28");
  });

  it("should escape values containing delimiter", () => {
    const dataWithComma: TestRow[] = [
      { id: "1", name: "Smith, John", email: "john@test.com", age: 30 },
    ];

    const csv = toCSVString({
      data: dataWithComma,
      columns: testColumns,
    });

    expect(csv).toContain('"Smith, John"');
  });

  it("should escape values containing quotes", () => {
    const dataWithQuotes: TestRow[] = [
      { id: "1", name: 'He said "Hello"', email: "test@test.com", age: 30 },
    ];

    const csv = toCSVString({
      data: dataWithQuotes,
      columns: testColumns,
    });

    expect(csv).toContain('"He said ""Hello"""');
  });

  it("should escape values containing newlines", () => {
    const dataWithNewline: TestRow[] = [
      { id: "1", name: "Line1\nLine2", email: "test@test.com", age: 30 },
    ];

    const csv = toCSVString({
      data: dataWithNewline,
      columns: testColumns,
    });

    expect(csv).toContain('"Line1\nLine2"');
  });

  it("should handle empty data", () => {
    const csv = toCSVString({
      data: [],
      columns: testColumns,
    });

    expect(csv).toBe("Name,Email,Age");
  });

  it("should use custom value formatter", () => {
    const formatValue = vi.fn((value) => `[${value}]`);

    const csv = toCSVString({
      data: testData,
      columns: testColumns,
      formatValue,
    });

    expect(csv).toContain("[Alice]");
    expect(csv).toContain("[28]");
    expect(formatValue).toHaveBeenCalled();
  });

  it("should handle null values", () => {
    const dataWithNull = [
      { id: "1", name: null as unknown as string, email: "test@test.com", age: 30 },
    ];

    const csv = toCSVString({
      data: dataWithNull,
      columns: testColumns,
    });

    // null should be converted to empty string
    const lines = csv.split("\n");
    expect(lines[1]).toMatch(/^,test@test.com,30$/);
  });

  it("should handle undefined values", () => {
    const dataWithUndefined = [
      { id: "1", name: undefined as unknown as string, email: "test@test.com", age: 30 },
    ];

    const csv = toCSVString({
      data: dataWithUndefined,
      columns: testColumns,
    });

    const lines = csv.split("\n");
    expect(lines[1]).toMatch(/^,test@test.com,30$/);
  });

  it("should filter visible columns when hiddenColumns specified", () => {
    const csv = toCSVString({
      data: testData,
      columns: testColumns,
      visibleColumnsOnly: true,
      hiddenColumns: new Set(["email"]),
    });

    const lines = csv.split("\n");
    expect(lines[0]).toBe("Name,Age");
    expect(lines[1]).toBe("Alice,28");
  });

  it("should export only selected rows when specified", () => {
    const csv = toCSVString({
      data: testData,
      columns: testColumns,
      selectedOnly: true,
      selectedIds: new Set(["1", "3"]),
    });

    const lines = csv.split("\n");
    expect(lines).toHaveLength(3); // header + 2 rows
    expect(lines[1]).toContain("Alice");
    expect(lines[2]).toContain("Charlie");
  });
});

// ─── TESTS: exportToCSV ─────────────────────────────────────────────────────────

describe("exportToCSV", () => {
  it("should return success result with row count", () => {
    const result = exportToCSV({
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

    exportToCSV({
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
    const result = exportToCSV({
      data: [],
      columns: testColumns,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("No data");
  });

  it("should return error for empty columns", () => {
    const result = exportToCSV({
      data: testData,
      columns: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("No columns");
  });

  it("should return error when data is undefined", () => {
    const result = exportToCSV({
      data: undefined as unknown as TestRow[],
      columns: testColumns,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("No data");
  });

  it("should return error when columns is undefined", () => {
    const result = exportToCSV({
      data: testData,
      columns: undefined as unknown as Column<TestRow>[],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("No columns");
  });

  it("should include BOM by default", () => {
    const result = exportToCSV({
      data: testData,
      columns: testColumns,
      filename: "test",
    });

    expect(result.success).toBe(true);
    // BOM adds 3 bytes (\ufeff is UTF-8 BOM)
    expect(result.fileSize).toBeGreaterThan(0);
  });

  it("should not include BOM when disabled", () => {
    const resultWithBOM = exportToCSV({
      data: testData,
      columns: testColumns,
      filename: "with-bom",
      includeBOM: true,
    });

    const resultWithoutBOM = exportToCSV({
      data: testData,
      columns: testColumns,
      filename: "without-bom",
      includeBOM: false,
    });

    expect(resultWithoutBOM.success).toBe(true);
    expect(resultWithBOM.success).toBe(true);
    // BOM adds 3 bytes to file size
    expect(resultWithBOM.fileSize).toBeGreaterThan(resultWithoutBOM.fileSize!);
  });

  it("should filter visible columns only when specified", () => {
    const result = exportToCSV({
      data: testData,
      columns: testColumns,
      visibleColumnsOnly: true,
      hiddenColumns: new Set(["email"]),
    });

    expect(result.success).toBe(true);
  });

  it("should export only selected rows when specified", () => {
    const result = exportToCSV({
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

    const result = exportToCSV({
      data: testData,
      columns: testColumns,
      formatValue,
    });

    expect(result.success).toBe(true);
    expect(formatValue).toHaveBeenCalled();
  });
});

// ─── EDGE CASES ─────────────────────────────────────────────────────────────────

describe("CSV export edge cases", () => {
  it("should handle special characters in header", () => {
    const columnsWithSpecial: Column<TestRow>[] = [
      { key: "name", header: "Full, Name" },
      { key: "email", header: 'Email "Address"' },
      { key: "age", header: "Age\nYears" },
    ];

    const csv = toCSVString({
      data: testData,
      columns: columnsWithSpecial,
    });

    expect(csv).toContain('"Full, Name"');
    expect(csv).toContain('"Email ""Address"""');
    expect(csv).toContain('"Age\nYears"');
  });

  it("should handle numeric values", () => {
    const csv = toCSVString({
      data: testData,
      columns: testColumns,
    });

    expect(csv).toContain(",28");
    expect(csv).toContain(",32");
    expect(csv).toContain(",25");
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

    const csv = toCSVString({
      data: dataWithBool,
      columns,
    });

    // Booleans are converted to Yes/No by the getCellValue utility
    expect(csv).toContain("Alice,Yes");
    expect(csv).toContain("Bob,No");
  });

  it("should handle tab delimiter", () => {
    const csv = toCSVString({
      data: testData,
      columns: testColumns,
      delimiter: "\t",
    });

    const lines = csv.split("\n");
    expect(lines[0]).toBe("Name\tEmail\tAge");
    expect(lines[1]).toBe("Alice\talice@example.com\t28");
  });

  it("should handle pipe delimiter", () => {
    const csv = toCSVString({
      data: testData,
      columns: testColumns,
      delimiter: "|",
    });

    const lines = csv.split("\n");
    expect(lines[0]).toBe("Name|Email|Age");
  });

  it("should escape values containing pipe when using pipe delimiter", () => {
    const dataWithPipe: TestRow[] = [
      { id: "1", name: "Alice | Bob", email: "test@test.com", age: 30 },
    ];

    const csv = toCSVString({
      data: dataWithPipe,
      columns: testColumns,
      delimiter: "|",
    });

    expect(csv).toContain('"Alice | Bob"');
  });

  it("should handle large numbers", () => {
    interface RowWithLargeNum {
      id: string;
      value: number;
    }

    const dataWithLargeNum: RowWithLargeNum[] = [
      { id: "1", value: 123456789012345 },
    ];

    const columns: Column<RowWithLargeNum>[] = [
      { key: "value", header: "Value" },
    ];

    const csv = toCSVString({
      data: dataWithLargeNum,
      columns,
    });

    expect(csv).toContain("123456789012345");
  });

  it("should handle empty strings", () => {
    const dataWithEmpty: TestRow[] = [
      { id: "1", name: "", email: "test@test.com", age: 30 },
    ];

    const csv = toCSVString({
      data: dataWithEmpty,
      columns: testColumns,
    });

    const lines = csv.split("\n");
    expect(lines[1]).toBe(",test@test.com,30");
  });
});
