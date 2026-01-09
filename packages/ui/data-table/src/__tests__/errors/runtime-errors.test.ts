import { describe, it, expect } from "vitest";
import {
  RenderError,
  VirtualizationError,
  EditError,
  FilterError,
  SortError,
  ExportError,
  SelectionError,
  SearchError,
} from "../../errors/runtime-errors";
import { DataTableErrorCode } from "../../errors/base";
import { ErrorSeverity } from "../../errors/severity";

// ─── RenderError TESTS ──────────────────────────────────────────────────────

describe("RenderError", () => {
  describe("construction", () => {
    it("should create error with message only", () => {
      const error = new RenderError("Failed to render cell");

      expect(error.message).toBe("Failed to render cell");
      expect(error.code).toBe(DataTableErrorCode.RENDER_ERROR);
      expect(error.componentName).toBeUndefined();
    });

    it("should create error with component name", () => {
      const error = new RenderError("Render failed", "DataTableRow");

      expect(error.componentName).toBe("DataTableRow");
    });

    it("should create error with cause", () => {
      const cause = new Error("Original error");
      const error = new RenderError("Render failed", "Cell", cause);

      expect(error.cause).toBe(cause);
    });

    it("should set correct error name", () => {
      const error = new RenderError("Test");

      expect(error.name).toBe("RenderError");
    });

    it("should include context with component name", () => {
      const error = new RenderError("Error", "Header");

      expect(error.context).toEqual({ componentName: "Header" });
    });
  });
});

// ─── VirtualizationError TESTS ──────────────────────────────────────────────

describe("VirtualizationError", () => {
  describe("construction", () => {
    it("should create error with message only", () => {
      const error = new VirtualizationError("Virtual scroll failed");

      expect(error.message).toBe("Virtual scroll failed");
      expect(error.code).toBe(DataTableErrorCode.VIRTUALIZATION_ERROR);
    });

    it("should create error with details", () => {
      const error = new VirtualizationError("Overscan calculation failed", {
        visibleRows: 50,
        totalRows: 10000,
        scrollTop: 500,
      });

      expect(error.context).toEqual({
        visibleRows: 50,
        totalRows: 10000,
        scrollTop: 500,
      });
    });

    it("should set correct error name", () => {
      const error = new VirtualizationError("Test");

      expect(error.name).toBe("VirtualizationError");
    });
  });
});

// ─── EditError TESTS ────────────────────────────────────────────────────────

describe("EditError", () => {
  describe("construction", () => {
    it("should create error with message only", () => {
      const error = new EditError("Edit operation failed");

      expect(error.message).toBe("Edit operation failed");
      expect(error.code).toBe(DataTableErrorCode.EDIT_FAILED);
      expect(error.rowId).toBeUndefined();
      expect(error.columnKey).toBeUndefined();
    });

    it("should create error with row ID", () => {
      const error = new EditError("Failed", { rowId: "row-123" });

      expect(error.rowId).toBe("row-123");
    });

    it("should create error with column key", () => {
      const error = new EditError("Failed", { columnKey: "name" });

      expect(error.columnKey).toBe("name");
    });

    it("should create error with all options", () => {
      const cause = new Error("Validation error");
      const error = new EditError("Cell edit failed", {
        rowId: "row-1",
        columnKey: "email",
        cause,
      });

      expect(error.rowId).toBe("row-1");
      expect(error.columnKey).toBe("email");
      expect(error.cause).toBe(cause);
    });

    it("should set correct error name", () => {
      const error = new EditError("Test");

      expect(error.name).toBe("EditError");
    });

    it("should include context with row and column", () => {
      const error = new EditError("Error", { rowId: "1", columnKey: "age" });

      expect(error.context).toEqual({ rowId: "1", columnKey: "age" });
    });
  });
});

// ─── FilterError TESTS ──────────────────────────────────────────────────────

describe("FilterError", () => {
  describe("construction", () => {
    it("should create error with column key and filter value", () => {
      const error = new FilterError("status", "active");

      expect(error.message).toBe('Filter function failed for column "status"');
      expect(error.columnKey).toBe("status");
      expect(error.filterValue).toBe("active");
      expect(error.code).toBe(DataTableErrorCode.FILTER_ERROR);
    });

    it("should create error with cause", () => {
      const cause = new Error("Regex error");
      const error = new FilterError("name", "*invalid*", cause);

      expect(error.cause).toBe(cause);
    });

    it("should set ERROR severity", () => {
      const error = new FilterError("col", "val");

      expect(error.severity).toBe(ErrorSeverity.ERROR);
    });

    it("should set correct error name", () => {
      const error = new FilterError("test", "value");

      expect(error.name).toBe("FilterError");
    });

    it("should include context with column and filter value", () => {
      const error = new FilterError("age", 25);

      expect(error.context).toEqual({ columnKey: "age", filterValue: 25 });
    });
  });

  describe("filter value types", () => {
    it("should handle string filter value", () => {
      const error = new FilterError("name", "John");

      expect(error.filterValue).toBe("John");
    });

    it("should handle number filter value", () => {
      const error = new FilterError("age", 30);

      expect(error.filterValue).toBe(30);
    });

    it("should handle object filter value", () => {
      const filterVal = { min: 10, max: 100 };
      const error = new FilterError("range", filterVal);

      expect(error.filterValue).toEqual({ min: 10, max: 100 });
    });

    it("should handle null filter value", () => {
      const error = new FilterError("status", null);

      expect(error.filterValue).toBeNull();
    });

    it("should handle array filter value", () => {
      const error = new FilterError("tags", ["a", "b", "c"]);

      expect(error.filterValue).toEqual(["a", "b", "c"]);
    });
  });
});

// ─── SortError TESTS ────────────────────────────────────────────────────────

describe("SortError", () => {
  describe("construction", () => {
    it("should create error with column key", () => {
      const error = new SortError("customDate");

      expect(error.message).toBe('Sort function failed for column "customDate"');
      expect(error.columnKey).toBe("customDate");
      expect(error.code).toBe(DataTableErrorCode.SORT_ERROR);
    });

    it("should create error with cause", () => {
      const cause = new Error("Invalid comparison");
      const error = new SortError("mixed", cause);

      expect(error.cause).toBe(cause);
    });

    it("should set ERROR severity", () => {
      const error = new SortError("col");

      expect(error.severity).toBe(ErrorSeverity.ERROR);
    });

    it("should set correct error name", () => {
      const error = new SortError("test");

      expect(error.name).toBe("SortError");
    });

    it("should include context with column key", () => {
      const error = new SortError("amount");

      expect(error.context).toEqual({ columnKey: "amount" });
    });
  });
});

// ─── ExportError TESTS ──────────────────────────────────────────────────────

describe("ExportError", () => {
  describe("construction", () => {
    it("should create error with export type and message", () => {
      const error = new ExportError("csv", "File creation failed");

      expect(error.message).toBe("Export to CSV failed: File creation failed");
      expect(error.exportType).toBe("csv");
      expect(error.code).toBe(DataTableErrorCode.EXPORT_ERROR);
    });

    it("should create error with row count", () => {
      const error = new ExportError("excel", "Too many rows", { rowCount: 100000 });

      expect(error.rowCount).toBe(100000);
    });

    it("should create error with cause", () => {
      const cause = new Error("Memory limit");
      const error = new ExportError("pdf", "Generation failed", { cause });

      expect(error.cause).toBe(cause);
    });

    it("should create error with all options", () => {
      const cause = new Error("Network error");
      const error = new ExportError("json", "Upload failed", {
        rowCount: 500,
        cause,
      });

      expect(error.rowCount).toBe(500);
      expect(error.cause).toBe(cause);
    });

    it("should set ERROR severity", () => {
      const error = new ExportError("csv", "msg");

      expect(error.severity).toBe(ErrorSeverity.ERROR);
    });

    it("should set correct error name", () => {
      const error = new ExportError("html", "msg");

      expect(error.name).toBe("ExportError");
    });
  });

  describe("export types", () => {
    it("should handle CSV export", () => {
      const error = new ExportError("csv", "Failed");

      expect(error.exportType).toBe("csv");
      expect(error.message).toContain("CSV");
    });

    it("should handle Excel export", () => {
      const error = new ExportError("excel", "Failed");

      expect(error.exportType).toBe("excel");
      expect(error.message).toContain("EXCEL");
    });

    it("should handle PDF export", () => {
      const error = new ExportError("pdf", "Failed");

      expect(error.exportType).toBe("pdf");
      expect(error.message).toContain("PDF");
    });

    it("should handle JSON export", () => {
      const error = new ExportError("json", "Failed");

      expect(error.exportType).toBe("json");
      expect(error.message).toContain("JSON");
    });

    it("should handle HTML export", () => {
      const error = new ExportError("html", "Failed");

      expect(error.exportType).toBe("html");
      expect(error.message).toContain("HTML");
    });
  });
});

// ─── SelectionError TESTS ───────────────────────────────────────────────────

describe("SelectionError", () => {
  describe("construction", () => {
    it("should create error with operation and message", () => {
      const error = new SelectionError("selectAll", "Cannot select all rows");

      expect(error.message).toBe("Selection selectAll failed: Cannot select all rows");
      expect(error.operation).toBe("selectAll");
      expect(error.code).toBe(DataTableErrorCode.SELECTION_ERROR);
    });

    it("should create error with affected IDs", () => {
      const error = new SelectionError("toggle", "Failed", {
        affectedIds: ["row-1", "row-2"],
      });

      expect(error.affectedIds).toEqual(["row-1", "row-2"]);
    });

    it("should create error with cause", () => {
      const cause = new Error("State error");
      const error = new SelectionError("deselect", "Failed", { cause });

      expect(error.cause).toBe(cause);
    });

    it("should set WARNING severity", () => {
      const error = new SelectionError("select", "msg");

      expect(error.severity).toBe(ErrorSeverity.WARNING);
    });

    it("should set correct error name", () => {
      const error = new SelectionError("clear", "msg");

      expect(error.name).toBe("SelectionError");
    });
  });

  describe("selection operations", () => {
    it("should handle select operation", () => {
      const error = new SelectionError("select", "Failed");

      expect(error.operation).toBe("select");
    });

    it("should handle deselect operation", () => {
      const error = new SelectionError("deselect", "Failed");

      expect(error.operation).toBe("deselect");
    });

    it("should handle selectAll operation", () => {
      const error = new SelectionError("selectAll", "Failed");

      expect(error.operation).toBe("selectAll");
    });

    it("should handle clear operation", () => {
      const error = new SelectionError("clear", "Failed");

      expect(error.operation).toBe("clear");
    });

    it("should handle toggle operation", () => {
      const error = new SelectionError("toggle", "Failed");

      expect(error.operation).toBe("toggle");
    });
  });
});

// ─── SearchError TESTS ──────────────────────────────────────────────────────

describe("SearchError", () => {
  describe("construction", () => {
    it("should create error with search query", () => {
      const error = new SearchError("user query");

      expect(error.message).toBe('Search function failed for query "user query"');
      expect(error.searchQuery).toBe("user query");
      // Note: Uses FILTER_ERROR code
      expect(error.code).toBe(DataTableErrorCode.FILTER_ERROR);
    });

    it("should create error with cause", () => {
      const cause = new Error("Regex syntax error");
      const error = new SearchError("[invalid", cause);

      expect(error.cause).toBe(cause);
    });

    it("should set ERROR severity", () => {
      const error = new SearchError("test");

      expect(error.severity).toBe(ErrorSeverity.ERROR);
    });

    it("should set correct error name", () => {
      const error = new SearchError("query");

      expect(error.name).toBe("SearchError");
    });

    it("should include context with search query", () => {
      const error = new SearchError("find me");

      expect(error.context).toEqual({ searchQuery: "find me" });
    });
  });

  describe("search query types", () => {
    it("should handle simple text query", () => {
      const error = new SearchError("hello");

      expect(error.searchQuery).toBe("hello");
    });

    it("should handle empty query", () => {
      const error = new SearchError("");

      expect(error.searchQuery).toBe("");
    });

    it("should handle regex-like query", () => {
      const error = new SearchError("^start.*end$");

      expect(error.searchQuery).toBe("^start.*end$");
    });

    it("should handle query with special characters", () => {
      const error = new SearchError("test@example.com");

      expect(error.searchQuery).toBe("test@example.com");
    });
  });
});

// ─── ERROR CODE VERIFICATION ────────────────────────────────────────────────

describe("runtime error codes", () => {
  it("should use appropriate error codes", () => {
    expect(new RenderError("msg").code).toBe(DataTableErrorCode.RENDER_ERROR);
    expect(new VirtualizationError("msg").code).toBe(DataTableErrorCode.VIRTUALIZATION_ERROR);
    expect(new EditError("msg").code).toBe(DataTableErrorCode.EDIT_FAILED);
    expect(new FilterError("col", "val").code).toBe(DataTableErrorCode.FILTER_ERROR);
    expect(new SortError("col").code).toBe(DataTableErrorCode.SORT_ERROR);
    expect(new ExportError("csv", "msg").code).toBe(DataTableErrorCode.EXPORT_ERROR);
    expect(new SelectionError("select", "msg").code).toBe(DataTableErrorCode.SELECTION_ERROR);
    // SearchError uses FILTER_ERROR code
    expect(new SearchError("query").code).toBe(DataTableErrorCode.FILTER_ERROR);
  });
});

// ─── SEVERITY LEVELS ────────────────────────────────────────────────────────

describe("runtime error severity levels", () => {
  it("should have appropriate severity levels", () => {
    // ERROR severity for operation failures
    expect(new FilterError("col", "val").severity).toBe(ErrorSeverity.ERROR);
    expect(new SortError("col").severity).toBe(ErrorSeverity.ERROR);
    expect(new ExportError("csv", "msg").severity).toBe(ErrorSeverity.ERROR);
    expect(new SearchError("query").severity).toBe(ErrorSeverity.ERROR);

    // WARNING severity for recoverable issues
    expect(new SelectionError("select", "msg").severity).toBe(ErrorSeverity.WARNING);
  });
});
