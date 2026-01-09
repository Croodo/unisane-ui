import { describe, it, expect } from "vitest";
import {
  formatMessage,
  extractMessageContext,
  getUserMessage,
  getSeverityLabel,
  getUserMessages,
  formatErrorForDisplay,
  formatErrorForClipboard,
} from "../../errors/user-messages";
import { DataTableError, DataTableErrorCode } from "../../errors/base";
import { ErrorSeverity } from "../../errors/severity";
import { enStrings } from "../../i18n/locales/en";

// ─── TEST DATA ───────────────────────────────────────────────────────────────

// Use the actual English strings for testing
const mockStrings = enStrings;

const createTestError = (
  code: string,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  context?: Record<string, unknown>
): DataTableError => {
  return new DataTableError("Test error message", code as typeof DataTableErrorCode.FILTER_ERROR, {
    severity,
    context,
  });
};

// ─── formatMessage TESTS ─────────────────────────────────────────────────────

describe("formatMessage", () => {
  it("should return template unchanged when no placeholders", () => {
    const result = formatMessage("Hello world");
    expect(result).toBe("Hello world");
  });

  it("should replace single placeholder", () => {
    const result = formatMessage("Hello {name}", { name: "John" });
    expect(result).toBe("Hello John");
  });

  it("should replace multiple placeholders", () => {
    const result = formatMessage("{greeting} {name}!", {
      greeting: "Hello",
      name: "World",
    });
    expect(result).toBe("Hello World!");
  });

  it("should handle numeric values", () => {
    const result = formatMessage("Page {page} of {total}", { page: 5, total: 10 });
    expect(result).toBe("Page 5 of 10");
  });

  it("should leave placeholder unchanged when key missing", () => {
    const result = formatMessage("Hello {name}", {});
    expect(result).toBe("Hello {name}");
  });

  it("should handle undefined context", () => {
    const result = formatMessage("Hello {name}");
    expect(result).toBe("Hello {name}");
  });

  it("should handle empty string values", () => {
    const result = formatMessage("Value: {value}", { value: "" });
    expect(result).toBe("Value: ");
  });

  it("should handle zero values", () => {
    const result = formatMessage("Count: {count}", { count: 0 });
    expect(result).toBe("Count: 0");
  });

  it("should handle multiple occurrences of same placeholder", () => {
    const result = formatMessage("{name} loves {name}", { name: "Alice" });
    expect(result).toBe("Alice loves Alice");
  });
});

// ─── extractMessageContext TESTS ─────────────────────────────────────────────

describe("extractMessageContext", () => {
  it("should extract id from context", () => {
    const error = createTestError(DataTableErrorCode.DUPLICATE_ROW_ID, ErrorSeverity.ERROR, {
      id: "row-123",
    });
    const context = extractMessageContext(error);
    expect(context.id).toBe("row-123");
  });

  it("should extract key from context", () => {
    const error = createTestError(DataTableErrorCode.INVALID_COLUMN_KEY, ErrorSeverity.ERROR, {
      key: "invalidKey",
    });
    const context = extractMessageContext(error);
    expect(context.key).toBe("invalidKey");
  });

  it("should extract column from context", () => {
    const error = createTestError(DataTableErrorCode.FILTER_ERROR, ErrorSeverity.ERROR, {
      column: "name",
    });
    const context = extractMessageContext(error);
    expect(context.column).toBe("name");
  });

  it("should extract columnKey as column", () => {
    const error = createTestError(DataTableErrorCode.FILTER_ERROR, ErrorSeverity.ERROR, {
      columnKey: "age",
    });
    const context = extractMessageContext(error);
    expect(context.column).toBe("age");
  });

  it("should extract index from context", () => {
    const error = createTestError(DataTableErrorCode.MISSING_ROW_ID, ErrorSeverity.ERROR, {
      index: 5,
    });
    const context = extractMessageContext(error);
    expect(context.index).toBe(5);
  });

  it("should extract prop from context", () => {
    const error = createTestError(DataTableErrorCode.MISSING_REQUIRED_PROP, ErrorSeverity.ERROR, {
      prop: "columns",
    });
    const context = extractMessageContext(error);
    expect(context.prop).toBe("columns");
  });

  it("should extract component from context", () => {
    const error = createTestError(DataTableErrorCode.MISSING_REQUIRED_PROP, ErrorSeverity.ERROR, {
      component: "DataTable",
    });
    const context = extractMessageContext(error);
    expect(context.component).toBe("DataTable");
  });

  it("should extract format from context", () => {
    const error = createTestError(DataTableErrorCode.EXPORT_ERROR, ErrorSeverity.ERROR, {
      format: "PDF",
    });
    const context = extractMessageContext(error);
    expect(context.format).toBe("PDF");
  });

  it("should return empty context when no error context", () => {
    const error = createTestError(DataTableErrorCode.FILTER_ERROR);
    const context = extractMessageContext(error);
    expect(context).toEqual({});
  });

  it("should ignore non-string/non-number values", () => {
    const error = createTestError(DataTableErrorCode.FILTER_ERROR, ErrorSeverity.ERROR, {
      id: { nested: true },
      column: ["array"],
    });
    const context = extractMessageContext(error);
    expect(context.id).toBeUndefined();
    expect(context.column).toBeUndefined();
  });
});

// ─── getUserMessage TESTS ────────────────────────────────────────────────────

describe("getUserMessage", () => {
  it("should return formatted message for duplicate row ID", () => {
    const error = createTestError(DataTableErrorCode.DUPLICATE_ROW_ID, ErrorSeverity.CRITICAL, {
      id: "dup-id",
    });
    const message = getUserMessage(error, mockStrings);

    expect(message.message).toContain("dup-id"); // Actual format: Duplicate row ID "dup-id" found
    expect(message.severity).toBe(ErrorSeverity.CRITICAL);
    expect(message.code).toBe(DataTableErrorCode.DUPLICATE_ROW_ID);
    expect(message.recoverable).toBe(true);
  });

  it("should return formatted message for invalid column key", () => {
    const error = createTestError(DataTableErrorCode.INVALID_COLUMN_KEY, ErrorSeverity.ERROR, {
      key: "badKey",
    });
    const message = getUserMessage(error, mockStrings);

    expect(message.message).toContain("badKey");
    expect(message.message.toLowerCase()).toContain("invalid");
  });

  it("should return formatted message for filter error", () => {
    const error = createTestError(DataTableErrorCode.FILTER_ERROR, ErrorSeverity.ERROR, {
      column: "age",
    });
    const message = getUserMessage(error, mockStrings);

    expect(message.message).toContain("age");
    expect(message.message.toLowerCase()).toContain("filter");
  });

  it("should return formatted message for export error", () => {
    const error = createTestError(DataTableErrorCode.EXPORT_ERROR, ErrorSeverity.ERROR, {
      format: "Excel",
    });
    const message = getUserMessage(error, mockStrings);

    expect(message.message).toContain("Excel");
    expect(message.message.toLowerCase()).toContain("export");
  });

  it("should include technical details", () => {
    const error = createTestError(DataTableErrorCode.FILTER_ERROR);
    const message = getUserMessage(error, mockStrings);

    expect(message.details).toBe("Test error message");
  });

  it("should indicate recoverability", () => {
    const fatalError = createTestError(DataTableErrorCode.CONTEXT_NOT_FOUND, ErrorSeverity.FATAL);
    const errorLevel = createTestError(DataTableErrorCode.FILTER_ERROR, ErrorSeverity.ERROR);

    const fatalMessage = getUserMessage(fatalError, mockStrings);
    const errorMessage = getUserMessage(errorLevel, mockStrings);

    expect(fatalMessage.recoverable).toBe(false);
    expect(errorMessage.recoverable).toBe(true);
  });

  it("should provide action for data fetch error", () => {
    const error = createTestError(DataTableErrorCode.DATA_FETCH_FAILED);
    const message = getUserMessage(error, mockStrings);

    expect(message.action).toBe("Try again");
  });

  it("should provide action for filter error", () => {
    const error = createTestError(DataTableErrorCode.FILTER_ERROR);
    const message = getUserMessage(error, mockStrings);

    expect(message.action).toBe("Clear all");
  });

  it("should provide action for export error", () => {
    const error = createTestError(DataTableErrorCode.EXPORT_ERROR);
    const message = getUserMessage(error, mockStrings);

    expect(message.action).toBe("Try again");
  });

  it("should use generic message for unknown code", () => {
    const error = createTestError("UNKNOWN_CODE");
    const message = getUserMessage(error, mockStrings);

    expect(message.message).toBe("An unexpected error occurred.");
  });
});

// ─── getSeverityLabel TESTS ──────────────────────────────────────────────────

describe("getSeverityLabel", () => {
  it("should return Warning for WARNING severity", () => {
    const label = getSeverityLabel(ErrorSeverity.WARNING, mockStrings);
    expect(label).toBe("Warning");
  });

  it("should return Error for ERROR severity", () => {
    const label = getSeverityLabel(ErrorSeverity.ERROR, mockStrings);
    expect(label).toBe("Error");
  });

  it("should return Critical for CRITICAL severity", () => {
    const label = getSeverityLabel(ErrorSeverity.CRITICAL, mockStrings);
    expect(label).toBe("Critical");
  });

  it("should return Fatal for FATAL severity", () => {
    const label = getSeverityLabel(ErrorSeverity.FATAL, mockStrings);
    expect(label).toBe("Fatal");
  });
});

// ─── getUserMessages TESTS ───────────────────────────────────────────────────

describe("getUserMessages", () => {
  it("should return empty array for empty errors", () => {
    const messages = getUserMessages([], mockStrings);
    expect(messages).toEqual([]);
  });

  it("should return messages for all errors", () => {
    const errors = [
      createTestError(DataTableErrorCode.FILTER_ERROR),
      createTestError(DataTableErrorCode.SORT_ERROR),
      createTestError(DataTableErrorCode.EXPORT_ERROR),
    ];

    const messages = getUserMessages(errors, mockStrings);

    expect(messages.length).toBe(3);
    expect(messages[0]?.code).toBe(DataTableErrorCode.FILTER_ERROR);
    expect(messages[1]?.code).toBe(DataTableErrorCode.SORT_ERROR);
    expect(messages[2]?.code).toBe(DataTableErrorCode.EXPORT_ERROR);
  });
});

// ─── formatErrorForDisplay TESTS ─────────────────────────────────────────────

describe("formatErrorForDisplay", () => {
  it("should format error with severity and message", () => {
    const error = createTestError(DataTableErrorCode.FILTER_ERROR, ErrorSeverity.ERROR, {
      column: "name",
    });
    const display = formatErrorForDisplay(error, mockStrings);

    expect(display).toContain("[Error]");
    expect(display).toContain("Filter failed for column");
    expect(display).toContain("name");
  });

  it("should format warning error", () => {
    const error = createTestError(DataTableErrorCode.INCOMPATIBLE_OPTIONS, ErrorSeverity.WARNING);
    const display = formatErrorForDisplay(error, mockStrings);

    expect(display).toContain("[Warning]");
  });

  it("should format critical error", () => {
    const error = createTestError(DataTableErrorCode.DUPLICATE_ROW_ID, ErrorSeverity.CRITICAL, {
      id: "123",
    });
    const display = formatErrorForDisplay(error, mockStrings);

    expect(display).toContain("[Critical]");
    expect(display).toContain("Duplicate row ID");
    expect(display).toContain("123");
  });

  it("should format fatal error", () => {
    const error = createTestError(DataTableErrorCode.CONTEXT_NOT_FOUND, ErrorSeverity.FATAL);
    const display = formatErrorForDisplay(error, mockStrings);

    expect(display).toContain("[Fatal]");
  });
});

// ─── formatErrorForClipboard TESTS ───────────────────────────────────────────

describe("formatErrorForClipboard", () => {
  it("should include error code", () => {
    const error = createTestError(DataTableErrorCode.FILTER_ERROR);
    const clipboard = formatErrorForClipboard(error, mockStrings);

    expect(clipboard).toContain(DataTableErrorCode.FILTER_ERROR);
  });

  it("should include severity label", () => {
    const error = createTestError(DataTableErrorCode.FILTER_ERROR, ErrorSeverity.ERROR);
    const clipboard = formatErrorForClipboard(error, mockStrings);

    expect(clipboard).toContain("Error");
  });

  it("should include user message", () => {
    const error = createTestError(DataTableErrorCode.FILTER_ERROR, ErrorSeverity.ERROR, {
      column: "age",
    });
    const clipboard = formatErrorForClipboard(error, mockStrings);

    expect(clipboard).toContain("Filter failed for column");
    expect(clipboard).toContain("age");
  });

  it("should include technical details", () => {
    const error = createTestError(DataTableErrorCode.FILTER_ERROR);
    const clipboard = formatErrorForClipboard(error, mockStrings);

    expect(clipboard).toContain("Details: Test error message");
  });

  it("should include timestamp", () => {
    const error = createTestError(DataTableErrorCode.FILTER_ERROR);
    const clipboard = formatErrorForClipboard(error, mockStrings);

    expect(clipboard).toContain("Time:");
    expect(clipboard).toMatch(/\d{4}-\d{2}-\d{2}T/); // ISO timestamp format
  });

  it("should include context when present", () => {
    const error = createTestError(DataTableErrorCode.FILTER_ERROR, ErrorSeverity.ERROR, {
      column: "name",
      value: "test",
    });
    const clipboard = formatErrorForClipboard(error, mockStrings);

    expect(clipboard).toContain("Context:");
    expect(clipboard).toContain("column");
    expect(clipboard).toContain("name");
  });

  it("should include stack trace", () => {
    const error = createTestError(DataTableErrorCode.FILTER_ERROR);
    const clipboard = formatErrorForClipboard(error, mockStrings);

    expect(clipboard).toContain("Stack:");
  });
});

// ─── EDGE CASES ──────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("should handle error with all context fields", () => {
    const error = createTestError(DataTableErrorCode.MISSING_REQUIRED_PROP, ErrorSeverity.FATAL, {
      id: "error-id",
      key: "key-value",
      column: "col-name",
      columnKey: "col-key",
      index: 42,
      prop: "required-prop",
      component: "Component",
      format: "JSON",
    });

    const context = extractMessageContext(error);

    expect(context.id).toBe("error-id");
    expect(context.key).toBe("key-value");
    expect(context.column).toBe("col-key"); // columnKey overwrites column (processed second)
    expect(context.index).toBe(42);
    expect(context.prop).toBe("required-prop");
    expect(context.component).toBe("Component");
    expect(context.format).toBe("JSON");
  });

  it("should handle placeholder at start of string", () => {
    const result = formatMessage("{name} is here", { name: "Bob" });
    expect(result).toBe("Bob is here");
  });

  it("should handle placeholder at end of string", () => {
    const result = formatMessage("Hello {name}", { name: "World" });
    expect(result).toBe("Hello World");
  });

  it("should handle only placeholder", () => {
    const result = formatMessage("{value}", { value: "Test" });
    expect(result).toBe("Test");
  });

  it("should handle special characters in placeholder values", () => {
    const result = formatMessage("Error: {message}", {
      message: "Something & <dangerous>",
    });
    expect(result).toBe("Error: Something & <dangerous>");
  });
});
