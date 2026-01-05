import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exportToHTML, toHTMLString } from "../../../utils/export/html";
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

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = vi.fn(() => "blob:mock-url");
const mockRevokeObjectURL = vi.fn();

// Mock document.createElement for anchor element
const mockClick = vi.fn();
const mockSetAttribute = vi.fn();
const mockRemove = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  // Mock URL methods
  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;

  // Mock document methods
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

// ─── TESTS ─────────────────────────────────────────────────────────────────────

describe("toHTMLString", () => {
  it("should generate valid HTML table structure", () => {
    const html = toHTMLString({
      data: testData,
      columns: testColumns,
    });

    expect(html).toContain("<table");
    expect(html).toContain("<thead>");
    expect(html).toContain("<tbody>");
    expect(html).toContain("</table>");
  });

  it("should include all column headers", () => {
    const html = toHTMLString({
      data: testData,
      columns: testColumns,
    });

    expect(html).toContain("<th");
    expect(html).toContain("Name");
    expect(html).toContain("Email");
    expect(html).toContain("Age");
  });

  it("should include all row data", () => {
    const html = toHTMLString({
      data: testData,
      columns: testColumns,
    });

    expect(html).toContain("Alice");
    expect(html).toContain("alice@example.com");
    expect(html).toContain("28");
    expect(html).toContain("Bob");
    expect(html).toContain("Charlie");
  });

  it("should escape HTML special characters", () => {
    const dataWithHtml: TestRow[] = [
      { id: "1", name: "<script>alert('xss')</script>", email: "test@test.com", age: 30 },
    ];

    const html = toHTMLString({
      data: dataWithHtml,
      columns: testColumns,
    });

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("should add title when provided", () => {
    const html = toHTMLString({
      data: testData,
      columns: testColumns,
      title: "User List",
    });

    expect(html).toContain("<h2");
    expect(html).toContain("User List");
  });

  it("should not wrap in document by default", () => {
    const html = toHTMLString({
      data: testData,
      columns: testColumns,
    });

    expect(html).not.toContain("<!DOCTYPE html>");
    expect(html).not.toContain("<html");
  });

  it("should wrap in full document when specified", () => {
    const html = toHTMLString({
      data: testData,
      columns: testColumns,
      wrapInDocument: true,
    });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html");
    expect(html).toContain("<head>");
    expect(html).toContain("<body>");
  });

  it("should include CSS styles when not using inline", () => {
    const html = toHTMLString({
      data: testData,
      columns: testColumns,
      wrapInDocument: true,
      includeStyles: true,
      inlineStyles: false,
    });

    expect(html).toContain("<style>");
    expect(html).toContain(".datatable-export");
  });

  it("should use inline styles when specified", () => {
    const html = toHTMLString({
      data: testData,
      columns: testColumns,
      inlineStyles: true,
    });

    expect(html).toContain('style="');
    expect(html).not.toContain('class="datatable-export"');
  });

  it("should apply custom header color", () => {
    const html = toHTMLString({
      data: testData,
      columns: testColumns,
      inlineStyles: true,
      headerColor: "#FF0000",
    });

    expect(html).toContain("background-color: #FF0000");
  });

  it("should include metadata footer when requested", () => {
    const html = toHTMLString({
      data: testData,
      columns: testColumns,
      includeMetadata: true,
    });

    expect(html).toContain("Exported");
    expect(html).toContain("3 rows");
  });

  it("should exclude headers when includeHeaders is false", () => {
    const html = toHTMLString({
      data: testData,
      columns: testColumns,
      includeHeaders: false,
    });

    expect(html).not.toContain("<thead>");
    expect(html).not.toContain("<th");
  });

  it("should handle empty data", () => {
    const html = toHTMLString({
      data: [],
      columns: testColumns,
    });

    // Should have thead but empty tbody
    expect(html).toContain("<thead>");
    expect(html).toContain("<tbody>");
  });

  it("should apply zebra stripes with inline styles", () => {
    const html = toHTMLString({
      data: testData,
      columns: testColumns,
      inlineStyles: true,
      zebraColor: "#EEEEEE",
    });

    // Odd rows (index 1, 3, etc.) should have background color
    expect(html).toContain("background-color: #EEEEEE");
  });

  it("should use custom font settings", () => {
    const html = toHTMLString({
      data: testData,
      columns: testColumns,
      inlineStyles: true,
      fontSize: 16,
      fontFamily: "Arial, sans-serif",
    });

    expect(html).toContain("font-size: 16px");
    expect(html).toContain("font-family: Arial, sans-serif");
  });

  it("should use custom border color", () => {
    const html = toHTMLString({
      data: testData,
      columns: testColumns,
      inlineStyles: true,
      borderColor: "#CCCCCC",
    });

    expect(html).toContain("border: 1px solid #CCCCCC");
  });
});

describe("exportToHTML", () => {
  it("should return success result with row count", () => {
    const result = exportToHTML({
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

    exportToHTML({
      data: testData,
      columns: testColumns,
      filename: "test-export",
    });

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();

    // revokeObjectURL is called in a setTimeout with 150ms delay
    vi.advanceTimersByTime(200);
    expect(mockRevokeObjectURL).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("should return error for empty data", () => {
    const result = exportToHTML({
      data: [],
      columns: testColumns,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("No data");
  });

  it("should return error for empty columns", () => {
    const result = exportToHTML({
      data: testData,
      columns: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("No columns");
  });

  it("should return error when data is undefined", () => {
    const result = exportToHTML({
      data: undefined as unknown as TestRow[],
      columns: testColumns,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("No data");
  });

  it("should return error when columns is undefined", () => {
    const result = exportToHTML({
      data: testData,
      columns: undefined as unknown as Column<TestRow>[],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("No columns");
  });

  it("should generate default filename with date", () => {
    exportToHTML({
      data: testData,
      columns: testColumns,
    });

    // The download should be triggered with a filename
    expect(mockClick).toHaveBeenCalled();
  });

  it("should filter visible columns only when specified", () => {
    const result = exportToHTML({
      data: testData,
      columns: testColumns,
      visibleColumnsOnly: true,
      hiddenColumns: new Set(["email"]),
    });

    expect(result.success).toBe(true);
    // The HTML should be generated without the email column
  });

  it("should export only selected rows when specified", () => {
    const result = exportToHTML({
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

    const result = exportToHTML({
      data: testData,
      columns: testColumns,
      formatValue,
    });

    expect(result.success).toBe(true);
    expect(formatValue).toHaveBeenCalled();
  });
});

describe("HTML export with special cases", () => {
  it("should handle null values in data", () => {
    const dataWithNull = [
      { id: "1", name: null as unknown as string, email: "test@test.com", age: 30 },
    ];

    const html = toHTMLString({
      data: dataWithNull,
      columns: testColumns,
    });

    // Should not throw, null should be converted to empty string or "null"
    expect(html).toContain("<td");
  });

  it("should handle undefined values in data", () => {
    const dataWithUndefined = [
      { id: "1", name: undefined as unknown as string, email: "test@test.com", age: 30 },
    ];

    const html = toHTMLString({
      data: dataWithUndefined,
      columns: testColumns,
    });

    expect(html).toContain("<td");
  });

  it("should handle numeric values correctly", () => {
    const html = toHTMLString({
      data: testData,
      columns: testColumns,
    });

    expect(html).toContain(">28<");
    expect(html).toContain(">32<");
    expect(html).toContain(">25<");
  });

  it("should handle ampersands in data", () => {
    const dataWithAmpersand: TestRow[] = [
      { id: "1", name: "Tom & Jerry", email: "t&j@example.com", age: 30 },
    ];

    const html = toHTMLString({
      data: dataWithAmpersand,
      columns: testColumns,
    });

    expect(html).toContain("Tom &amp; Jerry");
    expect(html).toContain("t&amp;j@example.com");
  });

  it("should handle quotes in data", () => {
    const dataWithQuotes: TestRow[] = [
      { id: "1", name: 'He said "Hello"', email: "test@test.com", age: 30 },
    ];

    const html = toHTMLString({
      data: dataWithQuotes,
      columns: testColumns,
    });

    expect(html).toContain("&quot;Hello&quot;");
  });
});
