import { describe, it, expect } from "vitest";
import {
  DataTableError,
  DataTableErrorCode,
  DEFAULT_ERROR_SEVERITY,
} from "../../errors/base";
import { ErrorSeverity } from "../../errors/severity";

// ─── TESTS: DataTableErrorCode ─────────────────────────────────────────────────

describe("DataTableErrorCode", () => {
  it("should have unique error codes", () => {
    const codes = Object.values(DataTableErrorCode);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  it("should have codes in expected format", () => {
    Object.values(DataTableErrorCode).forEach((code) => {
      expect(code).toMatch(/^DT_\d{3}$/);
    });
  });

  it("should have data error codes starting with 1xx", () => {
    expect(DataTableErrorCode.DUPLICATE_ROW_ID).toMatch(/^DT_1\d{2}$/);
    expect(DataTableErrorCode.MISSING_ROW_ID).toMatch(/^DT_1\d{2}$/);
    expect(DataTableErrorCode.INVALID_DATA_FORMAT).toMatch(/^DT_1\d{2}$/);
    expect(DataTableErrorCode.DATA_FETCH_FAILED).toMatch(/^DT_1\d{2}$/);
  });

  it("should have column error codes starting with 2xx", () => {
    expect(DataTableErrorCode.INVALID_COLUMN_KEY).toMatch(/^DT_2\d{2}$/);
    expect(DataTableErrorCode.DUPLICATE_COLUMN_KEY).toMatch(/^DT_2\d{2}$/);
    expect(DataTableErrorCode.MISSING_COLUMN_ACCESSOR).toMatch(/^DT_2\d{2}$/);
  });

  it("should have runtime error codes starting with 5xx", () => {
    expect(DataTableErrorCode.RENDER_ERROR).toMatch(/^DT_5\d{2}$/);
    expect(DataTableErrorCode.EXPORT_ERROR).toMatch(/^DT_5\d{2}$/);
    expect(DataTableErrorCode.FILTER_ERROR).toMatch(/^DT_5\d{2}$/);
    expect(DataTableErrorCode.SORT_ERROR).toMatch(/^DT_5\d{2}$/);
  });
});

// ─── TESTS: DEFAULT_ERROR_SEVERITY ─────────────────────────────────────────────

describe("DEFAULT_ERROR_SEVERITY", () => {
  it("should have severity for all error codes", () => {
    Object.values(DataTableErrorCode).forEach((code) => {
      expect(DEFAULT_ERROR_SEVERITY[code]).toBeDefined();
    });
  });

  it("should assign CRITICAL to data integrity errors", () => {
    expect(DEFAULT_ERROR_SEVERITY[DataTableErrorCode.DUPLICATE_ROW_ID]).toBe(ErrorSeverity.CRITICAL);
    expect(DEFAULT_ERROR_SEVERITY[DataTableErrorCode.MISSING_ROW_ID]).toBe(ErrorSeverity.CRITICAL);
  });

  it("should assign FATAL to context errors", () => {
    expect(DEFAULT_ERROR_SEVERITY[DataTableErrorCode.CONTEXT_NOT_FOUND]).toBe(ErrorSeverity.FATAL);
    expect(DEFAULT_ERROR_SEVERITY[DataTableErrorCode.PROVIDER_MISSING]).toBe(ErrorSeverity.FATAL);
  });

  it("should assign WARNING to non-critical errors", () => {
    expect(DEFAULT_ERROR_SEVERITY[DataTableErrorCode.INCOMPATIBLE_OPTIONS]).toBe(ErrorSeverity.WARNING);
    expect(DEFAULT_ERROR_SEVERITY[DataTableErrorCode.SELECTION_ERROR]).toBe(ErrorSeverity.WARNING);
  });
});

// ─── TESTS: DataTableError ─────────────────────────────────────────────────────

describe("DataTableError", () => {
  describe("constructor", () => {
    it("should create error with message and code", () => {
      const error = new DataTableError(
        "Test error",
        DataTableErrorCode.INVALID_DATA_FORMAT
      );

      expect(error.message).toBe("Test error");
      expect(error.code).toBe(DataTableErrorCode.INVALID_DATA_FORMAT);
      expect(error.name).toBe("DataTableError");
    });

    it("should use default severity from error code", () => {
      const error = new DataTableError(
        "Duplicate row",
        DataTableErrorCode.DUPLICATE_ROW_ID
      );

      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
    });

    it("should allow custom severity override", () => {
      const error = new DataTableError(
        "Test error",
        DataTableErrorCode.DUPLICATE_ROW_ID,
        { severity: ErrorSeverity.WARNING }
      );

      expect(error.severity).toBe(ErrorSeverity.WARNING);
    });

    it("should store context", () => {
      const error = new DataTableError(
        "Test error",
        DataTableErrorCode.INVALID_DATA_FORMAT,
        { context: { rowId: "123", column: "name" } }
      );

      expect(error.context).toEqual({ rowId: "123", column: "name" });
    });

    it("should store cause", () => {
      const cause = new Error("Original error");
      const error = new DataTableError(
        "Wrapped error",
        DataTableErrorCode.DATA_FETCH_FAILED,
        { cause }
      );

      expect(error.cause).toBe(cause);
    });

    it("should set timestamp", () => {
      const before = new Date();
      const error = new DataTableError("Test", DataTableErrorCode.INVALID_CONFIG);
      const after = new Date();

      expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("should be an instance of Error", () => {
      const error = new DataTableError("Test", DataTableErrorCode.INVALID_CONFIG);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe("toFormattedString", () => {
    it("should return formatted string with code and severity", () => {
      const error = new DataTableError(
        "Test error",
        DataTableErrorCode.INVALID_DATA_FORMAT,
        { severity: ErrorSeverity.ERROR }
      );

      const formatted = error.toFormattedString();
      expect(formatted).toContain("[DT_103]");
      expect(formatted).toContain("[ERROR]");
      expect(formatted).toContain("Test error");
    });
  });

  describe("toJSON", () => {
    it("should return error as JSON object", () => {
      const cause = new Error("Cause");
      const error = new DataTableError(
        "Test error",
        DataTableErrorCode.INVALID_DATA_FORMAT,
        {
          severity: ErrorSeverity.CRITICAL,
          context: { key: "value" },
          cause,
        }
      );

      const json = error.toJSON();

      expect(json.name).toBe("DataTableError");
      expect(json.code).toBe(DataTableErrorCode.INVALID_DATA_FORMAT);
      expect(json.severity).toBe(ErrorSeverity.CRITICAL);
      expect(json.message).toBe("Test error");
      expect(json.context).toEqual({ key: "value" });
      expect(json.cause).toBe("Cause");
      expect(json.timestamp).toBeDefined();
      expect(json.stack).toBeDefined();
    });

    it("should handle missing cause", () => {
      const error = new DataTableError("Test", DataTableErrorCode.INVALID_CONFIG);
      const json = error.toJSON();
      expect(json.cause).toBeUndefined();
    });
  });

  describe("isAtLeast", () => {
    it("should return true for same severity", () => {
      const error = new DataTableError(
        "Test",
        DataTableErrorCode.INVALID_CONFIG,
        { severity: ErrorSeverity.ERROR }
      );

      expect(error.isAtLeast(ErrorSeverity.ERROR)).toBe(true);
    });

    it("should return true for higher severity", () => {
      const error = new DataTableError(
        "Test",
        DataTableErrorCode.INVALID_CONFIG,
        { severity: ErrorSeverity.CRITICAL }
      );

      expect(error.isAtLeast(ErrorSeverity.ERROR)).toBe(true);
      expect(error.isAtLeast(ErrorSeverity.WARNING)).toBe(true);
    });

    it("should return false for lower severity", () => {
      const error = new DataTableError(
        "Test",
        DataTableErrorCode.INVALID_CONFIG,
        { severity: ErrorSeverity.WARNING }
      );

      expect(error.isAtLeast(ErrorSeverity.ERROR)).toBe(false);
      expect(error.isAtLeast(ErrorSeverity.CRITICAL)).toBe(false);
    });
  });

  describe("shouldTriggerBoundary", () => {
    it("should return true for CRITICAL errors", () => {
      const error = new DataTableError(
        "Test",
        DataTableErrorCode.INVALID_CONFIG,
        { severity: ErrorSeverity.CRITICAL }
      );

      expect(error.shouldTriggerBoundary()).toBe(true);
    });

    it("should return true for FATAL errors", () => {
      const error = new DataTableError(
        "Test",
        DataTableErrorCode.INVALID_CONFIG,
        { severity: ErrorSeverity.FATAL }
      );

      expect(error.shouldTriggerBoundary()).toBe(true);
    });

    it("should return false for ERROR and WARNING", () => {
      const errorSeverity = new DataTableError(
        "Test",
        DataTableErrorCode.INVALID_CONFIG,
        { severity: ErrorSeverity.ERROR }
      );

      const warningSeverity = new DataTableError(
        "Test",
        DataTableErrorCode.INVALID_CONFIG,
        { severity: ErrorSeverity.WARNING }
      );

      expect(errorSeverity.shouldTriggerBoundary()).toBe(false);
      expect(warningSeverity.shouldTriggerBoundary()).toBe(false);
    });
  });

  describe("isRecoverable", () => {
    it("should return false for FATAL errors", () => {
      const error = new DataTableError(
        "Test",
        DataTableErrorCode.INVALID_CONFIG,
        { severity: ErrorSeverity.FATAL }
      );

      expect(error.isRecoverable()).toBe(false);
    });

    it("should return true for non-FATAL errors", () => {
      const severities = [ErrorSeverity.WARNING, ErrorSeverity.ERROR, ErrorSeverity.CRITICAL];

      severities.forEach((severity) => {
        const error = new DataTableError(
          "Test",
          DataTableErrorCode.INVALID_CONFIG,
          { severity }
        );

        expect(error.isRecoverable()).toBe(true);
      });
    });
  });
});
