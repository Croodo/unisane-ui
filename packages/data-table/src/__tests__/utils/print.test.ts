import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { printDataTable, printInline, type PrintConfig, type PrintOptions } from "../../utils/print";
import type { Column } from "../../types";

// ─── TEST DATA ───────────────────────────────────────────────────────────────

interface TestRow {
  id: string;
  name: string;
  age: number;
  email: string;
  active?: boolean;
}

const testData: TestRow[] = [
  { id: "1", name: "Alice", age: 30, email: "alice@example.com", active: true },
  { id: "2", name: "Bob", age: 25, email: "bob@example.com", active: false },
  { id: "3", name: "Charlie", age: 35, email: "charlie@example.com" },
];

const testColumns: Column<TestRow>[] = [
  { key: "name", header: "Name" },
  { key: "age", header: "Age" },
  { key: "email", header: "Email" },
];

// ─── MOCKS ───────────────────────────────────────────────────────────────────

const mockPrintWindow = {
  document: {
    write: vi.fn(),
    close: vi.fn(),
  },
  focus: vi.fn(),
  print: vi.fn(),
  close: vi.fn(),
};

let originalWindowOpen: typeof window.open;
let originalWindowPrint: typeof window.print;
let originalAlert: typeof window.alert;
let consoleError: ReturnType<typeof vi.spyOn>;
let consoleWarn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  originalWindowOpen = window.open;
  originalWindowPrint = window.print;
  originalAlert = window.alert;

  window.open = vi.fn().mockReturnValue(mockPrintWindow);
  window.print = vi.fn();
  window.alert = vi.fn();
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  window.open = originalWindowOpen;
  window.print = originalWindowPrint;
  window.alert = originalAlert;
  consoleError.mockRestore();
  consoleWarn.mockRestore();
});

// ─── printDataTable TESTS ────────────────────────────────────────────────────

describe("printDataTable", () => {
  describe("basic functionality", () => {
    it("should open a print window", () => {
      printDataTable({
        data: testData,
        columns: testColumns,
      });

      expect(window.open).toHaveBeenCalledWith("", "_blank", "width=900,height=700");
    });

    it("should write HTML content to print window", () => {
      printDataTable({
        data: testData,
        columns: testColumns,
      });

      expect(mockPrintWindow.document.write).toHaveBeenCalled();
      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("<!DOCTYPE html>");
      expect(content).toContain("<table");
    });

    it("should close the document after writing", () => {
      printDataTable({
        data: testData,
        columns: testColumns,
      });

      expect(mockPrintWindow.document.close).toHaveBeenCalled();
    });

    it("should include data in table body", () => {
      printDataTable({
        data: testData,
        columns: testColumns,
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("Alice");
      expect(content).toContain("Bob");
      expect(content).toContain("Charlie");
    });

    it("should include column headers", () => {
      printDataTable({
        data: testData,
        columns: testColumns,
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("Name");
      expect(content).toContain("Age");
      expect(content).toContain("Email");
    });
  });

  describe("options", () => {
    it("should include title when provided", () => {
      printDataTable({
        data: testData,
        columns: testColumns,
        options: { title: "User Report" },
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("User Report");
      expect(content).toContain("print-title");
    });

    it("should include subtitle when provided", () => {
      printDataTable({
        data: testData,
        columns: testColumns,
        options: { subtitle: "Q4 2024" },
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("Q4 2024");
      expect(content).toContain("print-subtitle");
    });

    it("should include timestamp by default", () => {
      printDataTable({
        data: testData,
        columns: testColumns,
        options: { title: "Test" },
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("print-timestamp");
      expect(content).toContain("Generated:");
    });

    it("should exclude timestamp when includeTimestamp is false", () => {
      printDataTable({
        data: testData,
        columns: testColumns,
        options: { title: "Test", includeTimestamp: false },
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      // When includeTimestamp is false, "Generated:" text should not appear
      expect(content).not.toContain("Generated:");
    });

    it("should show row numbers when requested", () => {
      printDataTable({
        data: testData,
        columns: testColumns,
        options: { showRowNumbers: true },
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("print-row-number");
      expect(content).toContain("#"); // Row number header
    });

    it("should apply custom CSS when provided", () => {
      const customCss = ".custom-class { color: red; }";
      printDataTable({
        data: testData,
        columns: testColumns,
        options: { customCss },
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain(customCss);
    });

    it("should include custom header HTML", () => {
      const headerHtml = '<div class="custom-header">Custom Header</div>';
      printDataTable({
        data: testData,
        columns: testColumns,
        options: { headerHtml },
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("Custom Header");
    });

    it("should include custom footer HTML", () => {
      const footerHtml = '<div class="custom-footer">Custom Footer</div>';
      printDataTable({
        data: testData,
        columns: testColumns,
        options: { footerHtml },
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("Custom Footer");
    });

    it("should filter columns by columnKeys", () => {
      printDataTable({
        data: testData,
        columns: testColumns,
        options: { columnKeys: ["name", "email"] },
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("Name");
      expect(content).toContain("Email");
      // Age header should not appear in table headers
      expect(content.indexOf(">Age<")).toBe(-1);
    });
  });

  describe("orientation and paper size", () => {
    it("should use landscape by default", () => {
      printDataTable({
        data: testData,
        columns: testColumns,
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("landscape");
    });

    it("should use portrait when specified", () => {
      printDataTable({
        data: testData,
        columns: testColumns,
        options: { orientation: "portrait" },
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("portrait");
    });

    it("should use a4 by default", () => {
      printDataTable({
        data: testData,
        columns: testColumns,
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("a4");
    });

    it("should use letter when specified", () => {
      printDataTable({
        data: testData,
        columns: testColumns,
        options: { paperSize: "letter" },
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("letter");
    });
  });

  describe("selected rows", () => {
    it("should print only selected rows when selectedOnly is true", () => {
      printDataTable({
        data: testData,
        columns: testColumns,
        selectedIds: new Set(["1", "3"]),
        selectedOnly: true,
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("Alice");
      expect(content).toContain("Charlie");
      expect(content).not.toContain(">Bob<");
    });

    it("should show selected count in footer", () => {
      printDataTable({
        data: testData,
        columns: testColumns,
        selectedIds: new Set(["1"]),
        selectedOnly: true,
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("selected only");
      expect(content).toContain("Total: 1 row");
    });

    it("should print all rows when selectedOnly is false", () => {
      printDataTable({
        data: testData,
        columns: testColumns,
        selectedIds: new Set(["1"]),
        selectedOnly: false,
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("Alice");
      expect(content).toContain("Bob");
      expect(content).toContain("Charlie");
    });
  });

  describe("popup blocked", () => {
    it("should handle popup blocked scenario", () => {
      (window.open as ReturnType<typeof vi.fn>).mockReturnValue(null);

      printDataTable({
        data: testData,
        columns: testColumns,
      });

      expect(consoleError).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalled();
    });
  });

  describe("column filtering", () => {
    it("should exclude non-printable columns", () => {
      const columnsWithNonPrintable: Column<TestRow>[] = [
        { key: "name", header: "Name" },
        { key: "age", header: "Age", printable: false },
        { key: "email", header: "Email" },
      ];

      printDataTable({
        data: testData,
        columns: columnsWithNonPrintable,
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("Name");
      expect(content).toContain("Email");
      // Age column header should not appear
      expect(content.match(/<th[^>]*>Age<\/th>/)).toBeNull();
    });
  });

  describe("column alignment", () => {
    it("should apply center alignment class", () => {
      const columnsWithAlign: Column<TestRow>[] = [
        { key: "name", header: "Name", align: "center" },
      ];

      printDataTable({
        data: testData,
        columns: columnsWithAlign,
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("print-align-center");
    });

    it("should apply right alignment class for end align", () => {
      const columnsWithAlign: Column<TestRow>[] = [
        { key: "age", header: "Age", align: "end" },
      ];

      printDataTable({
        data: testData,
        columns: columnsWithAlign,
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("print-align-right");
    });
  });

  describe("value formatting", () => {
    it("should format boolean values as Yes/No", () => {
      const columnsWithBool: Column<TestRow>[] = [
        { key: "name", header: "Name" },
        { key: "active", header: "Active" },
      ];

      printDataTable({
        data: testData,
        columns: columnsWithBool,
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain(">Yes<");
      expect(content).toContain(">No<");
    });

    it("should handle null values", () => {
      const dataWithNull = [
        { id: "1", name: null as unknown as string, age: 30, email: "test@test.com" },
      ];

      printDataTable({
        data: dataWithNull,
        columns: testColumns,
      });

      // Should not throw
      expect(mockPrintWindow.document.write).toHaveBeenCalled();
    });

    it("should handle undefined values", () => {
      const dataWithUndefined = [
        { id: "1", name: undefined as unknown as string, age: 30, email: "test@test.com" },
      ];

      printDataTable({
        data: dataWithUndefined,
        columns: testColumns,
      });

      // Should not throw
      expect(mockPrintWindow.document.write).toHaveBeenCalled();
    });

    it("should format arrays as comma-separated strings", () => {
      interface RowWithArray {
        id: string;
        tags: string[];
      }

      const dataWithArray: RowWithArray[] = [
        { id: "1", tags: ["a", "b", "c"] },
      ];

      const columnsWithArray: Column<RowWithArray>[] = [
        { key: "tags", header: "Tags" },
      ];

      printDataTable({
        data: dataWithArray,
        columns: columnsWithArray,
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("a, b, c");
    });

    it("should use custom printValue formatter when provided", () => {
      const columnsWithFormatter: Column<TestRow>[] = [
        {
          key: "age",
          header: "Age",
          printValue: (row) => `${row.age} years old`,
        },
      ];

      printDataTable({
        data: testData,
        columns: columnsWithFormatter,
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("30 years old");
    });
  });

  describe("HTML escaping", () => {
    it("should escape special characters in data", () => {
      const dataWithSpecialChars = [
        { id: "1", name: "<script>alert('xss')</script>", age: 30, email: "test@test.com" },
      ];

      printDataTable({
        data: dataWithSpecialChars,
        columns: testColumns,
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      // The malicious script in user data should be escaped
      expect(content).toContain("&lt;script&gt;");
      expect(content).toContain("alert(&#039;xss&#039;)");
    });

    it("should escape title", () => {
      printDataTable({
        data: testData,
        columns: testColumns,
        options: { title: "Test & Report <2024>" },
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("&amp;");
      expect(content).toContain("&lt;");
      expect(content).toContain("&gt;");
    });
  });

  describe("column widths", () => {
    it("should preserve column widths when preserveColumnWidths is true", () => {
      const columnsWithWidths: Column<TestRow>[] = [
        { key: "name", header: "Name", width: 200 },
        { key: "age", header: "Age", width: "100px" },
      ];

      printDataTable({
        data: testData,
        columns: columnsWithWidths,
        options: { preserveColumnWidths: true },
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("colgroup");
      expect(content).toContain("200px");
      expect(content).toContain("100px");
    });

    it("should not include colgroup when preserveColumnWidths is false", () => {
      printDataTable({
        data: testData,
        columns: testColumns,
        options: { preserveColumnWidths: false },
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).not.toContain("<colgroup>");
    });
  });

  describe("footer", () => {
    it("should show total row count in footer", () => {
      printDataTable({
        data: testData,
        columns: testColumns,
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("Total: 3 rows");
    });

    it("should use singular 'row' for single row", () => {
      printDataTable({
        data: [testData[0]!],
        columns: testColumns,
      });

      const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
      expect(content).toContain("Total: 1 row");
    });
  });
});

// ─── printInline TESTS ───────────────────────────────────────────────────────

describe("printInline", () => {
  it("should call window.print", () => {
    printInline();
    expect(window.print).toHaveBeenCalled();
  });
});

// ─── EDGE CASES ──────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("should handle empty data array", () => {
    printDataTable({
      data: [],
      columns: testColumns,
    });

    const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
    expect(content).toContain("<tbody></tbody>");
  });

  it("should handle empty columns array", () => {
    printDataTable({
      data: testData,
      columns: [],
    });

    // Should not throw and should create a table
    expect(mockPrintWindow.document.write).toHaveBeenCalled();
  });

  it("should handle unicode characters", () => {
    const unicodeData = [
      { id: "1", name: "日本語テスト", age: 30, email: "test@test.com" },
    ];

    printDataTable({
      data: unicodeData,
      columns: testColumns,
    });

    const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
    expect(content).toContain("日本語テスト");
  });

  it("should handle very long content", () => {
    const longData = [
      { id: "1", name: "A".repeat(1000), age: 30, email: "test@test.com" },
    ];

    printDataTable({
      data: longData,
      columns: testColumns,
    });

    // Should not throw
    expect(mockPrintWindow.document.write).toHaveBeenCalled();
  });

  it("should handle Date values", () => {
    interface RowWithDate {
      id: string;
      date: Date;
    }

    const dataWithDate: RowWithDate[] = [
      { id: "1", date: new Date("2024-01-15") },
    ];

    const columnsWithDate: Column<RowWithDate>[] = [
      { key: "date", header: "Date" },
    ];

    printDataTable({
      data: dataWithDate,
      columns: columnsWithDate,
    });

    // Should format date
    expect(mockPrintWindow.document.write).toHaveBeenCalled();
  });

  it("should handle nested object values", () => {
    interface RowWithObject {
      id: string;
      meta: { key: string };
    }

    const dataWithObject: RowWithObject[] = [
      { id: "1", meta: { key: "value" } },
    ];

    const columnsWithObject: Column<RowWithObject>[] = [
      { key: "meta", header: "Meta" },
    ];

    printDataTable({
      data: dataWithObject,
      columns: columnsWithObject,
    });

    const content = mockPrintWindow.document.write.mock.calls[0]![0] as string;
    // JSON is escaped for HTML, quotes become &quot;
    expect(content).toContain("key");
    expect(content).toContain("value");
  });
});
