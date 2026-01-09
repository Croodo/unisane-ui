import { describe, it, expect } from "vitest";
import {
  AggregateDataTableError,
  ErrorCollector,
  aggregateErrors,
  flattenErrors,
  isAggregateError,
} from "../../errors/aggregate-error";
import { DataTableError, DataTableErrorCode } from "../../errors/base";
import { ErrorSeverity } from "../../errors/severity";

// ─── HELPER FACTORY ─────────────────────────────────────────────────────────────

function createError(
  message: string,
  code: (typeof DataTableErrorCode)[keyof typeof DataTableErrorCode] = DataTableErrorCode.INVALID_CONFIG,
  severity: ErrorSeverity = ErrorSeverity.ERROR
): DataTableError {
  return new DataTableError(message, code, { severity });
}

// ─── TESTS: AggregateDataTableError ─────────────────────────────────────────────

describe("AggregateDataTableError", () => {
  describe("constructor", () => {
    it("should create aggregate error with multiple errors", () => {
      const errors = [
        createError("Error 1"),
        createError("Error 2"),
        createError("Error 3"),
      ];

      const aggregate = new AggregateDataTableError(errors);

      expect(aggregate.errorCount).toBe(3);
      expect(aggregate.errors).toHaveLength(3);
      expect(aggregate.name).toBe("AggregateDataTableError");
    });

    it("should use default message with error count", () => {
      const errors = [createError("Error 1"), createError("Error 2")];
      const aggregate = new AggregateDataTableError(errors);

      expect(aggregate.message).toBe("2 errors occurred");
    });

    it("should use singular form for single error", () => {
      const errors = [createError("Error 1")];
      const aggregate = new AggregateDataTableError(errors);

      expect(aggregate.message).toBe("1 error occurred");
    });

    it("should use custom message when provided", () => {
      const errors = [createError("Error 1")];
      const aggregate = new AggregateDataTableError(errors, "Custom message");

      expect(aggregate.message).toBe("Custom message");
    });

    it("should calculate max severity from errors", () => {
      const errors = [
        createError("Warning", DataTableErrorCode.INVALID_CONFIG, ErrorSeverity.WARNING),
        createError("Critical", DataTableErrorCode.INVALID_CONFIG, ErrorSeverity.CRITICAL),
        createError("Error", DataTableErrorCode.INVALID_CONFIG, ErrorSeverity.ERROR),
      ];

      const aggregate = new AggregateDataTableError(errors);

      expect(aggregate.severity).toBe(ErrorSeverity.CRITICAL);
    });

    it("should handle empty errors array", () => {
      const aggregate = new AggregateDataTableError([]);

      expect(aggregate.errorCount).toBe(0);
      expect(aggregate.severity).toBe(ErrorSeverity.ERROR);
    });

    it("should store context with error details", () => {
      const errors = [
        createError("Error 1", DataTableErrorCode.INVALID_COLUMN_KEY),
        createError("Error 2", DataTableErrorCode.DUPLICATE_COLUMN_KEY),
      ];

      const aggregate = new AggregateDataTableError(errors);

      expect(aggregate.context?.errorCount).toBe(2);
      expect(aggregate.context?.errorCodes).toContain(DataTableErrorCode.INVALID_COLUMN_KEY);
      expect(aggregate.context?.errorMessages).toContain("Error 1");
    });
  });

  describe("getErrorsBySeverity", () => {
    it("should filter errors by severity", () => {
      const errors = [
        createError("Warning", DataTableErrorCode.INVALID_CONFIG, ErrorSeverity.WARNING),
        createError("Error", DataTableErrorCode.INVALID_CONFIG, ErrorSeverity.ERROR),
        createError("Critical", DataTableErrorCode.INVALID_CONFIG, ErrorSeverity.CRITICAL),
      ];

      const aggregate = new AggregateDataTableError(errors);

      expect(aggregate.getErrorsBySeverity(ErrorSeverity.ERROR)).toHaveLength(1);
      expect(aggregate.getErrorsBySeverity(ErrorSeverity.WARNING)).toHaveLength(1);
      expect(aggregate.getErrorsBySeverity(ErrorSeverity.FATAL)).toHaveLength(0);
    });
  });

  describe("getErrorsByCode", () => {
    it("should filter errors by code", () => {
      const errors = [
        createError("Error 1", DataTableErrorCode.INVALID_COLUMN_KEY),
        createError("Error 2", DataTableErrorCode.DUPLICATE_COLUMN_KEY),
        createError("Error 3", DataTableErrorCode.INVALID_COLUMN_KEY),
      ];

      const aggregate = new AggregateDataTableError(errors);

      expect(aggregate.getErrorsByCode(DataTableErrorCode.INVALID_COLUMN_KEY)).toHaveLength(2);
      expect(aggregate.getErrorsByCode(DataTableErrorCode.DUPLICATE_COLUMN_KEY)).toHaveLength(1);
      expect(aggregate.getErrorsByCode(DataTableErrorCode.MISSING_ROW_ID)).toHaveLength(0);
    });
  });

  describe("hasErrorCode", () => {
    it("should return true when code exists", () => {
      const errors = [
        createError("Error", DataTableErrorCode.INVALID_COLUMN_KEY),
      ];

      const aggregate = new AggregateDataTableError(errors);

      expect(aggregate.hasErrorCode(DataTableErrorCode.INVALID_COLUMN_KEY)).toBe(true);
    });

    it("should return false when code does not exist", () => {
      const errors = [
        createError("Error", DataTableErrorCode.INVALID_COLUMN_KEY),
      ];

      const aggregate = new AggregateDataTableError(errors);

      expect(aggregate.hasErrorCode(DataTableErrorCode.MISSING_ROW_ID)).toBe(false);
    });
  });

  describe("hasSeverity", () => {
    it("should return true when severity exists", () => {
      const errors = [
        createError("Critical", DataTableErrorCode.INVALID_CONFIG, ErrorSeverity.CRITICAL),
      ];

      const aggregate = new AggregateDataTableError(errors);

      expect(aggregate.hasSeverity(ErrorSeverity.CRITICAL)).toBe(true);
    });

    it("should return false when severity does not exist", () => {
      const errors = [
        createError("Error", DataTableErrorCode.INVALID_CONFIG, ErrorSeverity.ERROR),
      ];

      const aggregate = new AggregateDataTableError(errors);

      expect(aggregate.hasSeverity(ErrorSeverity.FATAL)).toBe(false);
    });
  });

  describe("hasFatalError", () => {
    it("should return true when fatal error exists", () => {
      const errors = [
        createError("Fatal", DataTableErrorCode.INVALID_CONFIG, ErrorSeverity.FATAL),
      ];

      const aggregate = new AggregateDataTableError(errors);

      expect(aggregate.hasFatalError()).toBe(true);
    });

    it("should return false when no fatal error exists", () => {
      const errors = [
        createError("Critical", DataTableErrorCode.INVALID_CONFIG, ErrorSeverity.CRITICAL),
      ];

      const aggregate = new AggregateDataTableError(errors);

      expect(aggregate.hasFatalError()).toBe(false);
    });
  });

  describe("hasCriticalError", () => {
    it("should return true for critical errors", () => {
      const errors = [
        createError("Critical", DataTableErrorCode.INVALID_CONFIG, ErrorSeverity.CRITICAL),
      ];

      const aggregate = new AggregateDataTableError(errors);

      expect(aggregate.hasCriticalError()).toBe(true);
    });

    it("should return true for fatal errors", () => {
      const errors = [
        createError("Fatal", DataTableErrorCode.INVALID_CONFIG, ErrorSeverity.FATAL),
      ];

      const aggregate = new AggregateDataTableError(errors);

      expect(aggregate.hasCriticalError()).toBe(true);
    });

    it("should return false for non-critical errors", () => {
      const errors = [
        createError("Error", DataTableErrorCode.INVALID_CONFIG, ErrorSeverity.ERROR),
      ];

      const aggregate = new AggregateDataTableError(errors);

      expect(aggregate.hasCriticalError()).toBe(false);
    });
  });

  describe("getCountBySeverity", () => {
    it("should return counts for each severity", () => {
      const errors = [
        createError("W1", DataTableErrorCode.INVALID_CONFIG, ErrorSeverity.WARNING),
        createError("W2", DataTableErrorCode.INVALID_CONFIG, ErrorSeverity.WARNING),
        createError("E1", DataTableErrorCode.INVALID_CONFIG, ErrorSeverity.ERROR),
        createError("C1", DataTableErrorCode.INVALID_CONFIG, ErrorSeverity.CRITICAL),
      ];

      const aggregate = new AggregateDataTableError(errors);
      const counts = aggregate.getCountBySeverity();

      expect(counts[ErrorSeverity.WARNING]).toBe(2);
      expect(counts[ErrorSeverity.ERROR]).toBe(1);
      expect(counts[ErrorSeverity.CRITICAL]).toBe(1);
      expect(counts[ErrorSeverity.FATAL]).toBe(0);
    });
  });

  describe("toFormattedString", () => {
    it("should return formatted string with all errors", () => {
      const errors = [
        createError("Error 1"),
        createError("Error 2"),
      ];

      const aggregate = new AggregateDataTableError(errors, "Test aggregate");
      const formatted = aggregate.toFormattedString();

      expect(formatted).toContain("[AGGREGATE]");
      expect(formatted).toContain("Test aggregate");
      expect(formatted).toContain("Error 1");
      expect(formatted).toContain("Error 2");
    });
  });

  describe("toJSON", () => {
    it("should return JSON with all error details", () => {
      const errors = [createError("Error 1"), createError("Error 2")];
      const aggregate = new AggregateDataTableError(errors, "Test");

      const json = aggregate.toJSON();

      expect(json.errorCount).toBe(2);
      expect(json.errors).toHaveLength(2);
      expect(json.countBySeverity).toBeDefined();
    });
  });

  describe("Symbol.iterator", () => {
    it("should be iterable", () => {
      const errors = [
        createError("Error 1"),
        createError("Error 2"),
        createError("Error 3"),
      ];

      const aggregate = new AggregateDataTableError(errors);
      const iteratedErrors: DataTableError[] = [];

      for (const error of aggregate) {
        iteratedErrors.push(error);
      }

      expect(iteratedErrors).toHaveLength(3);
    });
  });
});

// ─── TESTS: ErrorCollector ─────────────────────────────────────────────────────

describe("ErrorCollector", () => {
  describe("add", () => {
    it("should add error to collection", () => {
      const collector = new ErrorCollector();
      collector.add(createError("Error 1"));

      expect(collector.count()).toBe(1);
    });

    it("should return this for chaining", () => {
      const collector = new ErrorCollector();
      const result = collector.add(createError("Error 1"));

      expect(result).toBe(collector);
    });
  });

  describe("addAll", () => {
    it("should add multiple errors", () => {
      const collector = new ErrorCollector();
      collector.addAll([
        createError("Error 1"),
        createError("Error 2"),
        createError("Error 3"),
      ]);

      expect(collector.count()).toBe(3);
    });

    it("should return this for chaining", () => {
      const collector = new ErrorCollector();
      const result = collector.addAll([createError("Error 1")]);

      expect(result).toBe(collector);
    });
  });

  describe("addIf", () => {
    it("should add error when condition is true", () => {
      const collector = new ErrorCollector();
      collector.addIf(true, createError("Error 1"));

      expect(collector.count()).toBe(1);
    });

    it("should not add error when condition is false", () => {
      const collector = new ErrorCollector();
      collector.addIf(false, createError("Error 1"));

      expect(collector.count()).toBe(0);
    });

    it("should accept error factory function", () => {
      const collector = new ErrorCollector();
      collector.addIf(true, () => createError("Error 1"));

      expect(collector.count()).toBe(1);
    });

    it("should not call factory when condition is false", () => {
      const collector = new ErrorCollector();
      let called = false;
      collector.addIf(false, () => {
        called = true;
        return createError("Error 1");
      });

      expect(called).toBe(false);
    });
  });

  describe("hasErrors", () => {
    it("should return false when empty", () => {
      const collector = new ErrorCollector();
      expect(collector.hasErrors()).toBe(false);
    });

    it("should return true when has errors", () => {
      const collector = new ErrorCollector();
      collector.add(createError("Error 1"));
      expect(collector.hasErrors()).toBe(true);
    });
  });

  describe("getErrors", () => {
    it("should return copy of errors array", () => {
      const collector = new ErrorCollector();
      collector.add(createError("Error 1"));

      const errors = collector.getErrors();
      errors.push(createError("Error 2"));

      expect(collector.count()).toBe(1);
    });
  });

  describe("getFirstError", () => {
    it("should return first error", () => {
      const collector = new ErrorCollector();
      collector.add(createError("First"));
      collector.add(createError("Second"));

      expect(collector.getFirstError()?.message).toBe("First");
    });

    it("should return undefined when empty", () => {
      const collector = new ErrorCollector();
      expect(collector.getFirstError()).toBeUndefined();
    });
  });

  describe("clear", () => {
    it("should remove all errors", () => {
      const collector = new ErrorCollector();
      collector.add(createError("Error 1"));
      collector.add(createError("Error 2"));
      collector.clear();

      expect(collector.count()).toBe(0);
    });

    it("should return this for chaining", () => {
      const collector = new ErrorCollector();
      const result = collector.clear();
      expect(result).toBe(collector);
    });
  });

  describe("throwIfErrors", () => {
    it("should not throw when empty", () => {
      const collector = new ErrorCollector();
      expect(() => collector.throwIfErrors()).not.toThrow();
    });

    it("should throw AggregateDataTableError when has errors", () => {
      const collector = new ErrorCollector();
      collector.add(createError("Error 1"));

      expect(() => collector.throwIfErrors()).toThrow(AggregateDataTableError);
    });

    it("should use custom message", () => {
      const collector = new ErrorCollector();
      collector.add(createError("Error 1"));

      try {
        collector.throwIfErrors("Custom message");
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as AggregateDataTableError).message).toBe("Custom message");
      }
    });
  });

  describe("toAggregateError", () => {
    it("should return null when empty", () => {
      const collector = new ErrorCollector();
      expect(collector.toAggregateError()).toBeNull();
    });

    it("should return aggregate error when has errors", () => {
      const collector = new ErrorCollector();
      collector.add(createError("Error 1"));

      const aggregate = collector.toAggregateError();

      expect(aggregate).toBeInstanceOf(AggregateDataTableError);
      expect(aggregate?.errorCount).toBe(1);
    });
  });

  describe("getMaxSeverity", () => {
    it("should return WARNING when empty", () => {
      const collector = new ErrorCollector();
      expect(collector.getMaxSeverity()).toBe(ErrorSeverity.WARNING);
    });

    it("should return max severity", () => {
      const collector = new ErrorCollector();
      collector.add(createError("W", DataTableErrorCode.INVALID_CONFIG, ErrorSeverity.WARNING));
      collector.add(createError("C", DataTableErrorCode.INVALID_CONFIG, ErrorSeverity.CRITICAL));
      collector.add(createError("E", DataTableErrorCode.INVALID_CONFIG, ErrorSeverity.ERROR));

      expect(collector.getMaxSeverity()).toBe(ErrorSeverity.CRITICAL);
    });
  });

  describe("hasSeverityAtLeast", () => {
    it("should return true when has error at severity", () => {
      const collector = new ErrorCollector();
      collector.add(createError("E", DataTableErrorCode.INVALID_CONFIG, ErrorSeverity.ERROR));

      expect(collector.hasSeverityAtLeast(ErrorSeverity.ERROR)).toBe(true);
      expect(collector.hasSeverityAtLeast(ErrorSeverity.WARNING)).toBe(true);
    });

    it("should return false when no error at severity", () => {
      const collector = new ErrorCollector();
      collector.add(createError("W", DataTableErrorCode.INVALID_CONFIG, ErrorSeverity.WARNING));

      expect(collector.hasSeverityAtLeast(ErrorSeverity.ERROR)).toBe(false);
    });
  });
});

// ─── TESTS: Utility Functions ─────────────────────────────────────────────────

describe("aggregateErrors", () => {
  it("should return null for empty array", () => {
    expect(aggregateErrors([])).toBeNull();
  });

  it("should return aggregate error for non-empty array", () => {
    const errors = [createError("Error 1")];
    const aggregate = aggregateErrors(errors);

    expect(aggregate).toBeInstanceOf(AggregateDataTableError);
  });

  it("should use custom message", () => {
    const errors = [createError("Error 1")];
    const aggregate = aggregateErrors(errors, "Custom");

    expect(aggregate?.message).toBe("Custom");
  });
});

describe("flattenErrors", () => {
  it("should return single error in array", () => {
    const error = createError("Single");
    const result = flattenErrors(error);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(error);
  });

  it("should flatten aggregate error", () => {
    const errors = [createError("Error 1"), createError("Error 2")];
    const aggregate = new AggregateDataTableError(errors);

    const result = flattenErrors(aggregate);

    expect(result).toHaveLength(2);
  });

  it("should flatten nested aggregate errors", () => {
    const innerErrors = [createError("Inner 1"), createError("Inner 2")];
    const innerAggregate = new AggregateDataTableError(innerErrors);

    const outerErrors = [createError("Outer"), innerAggregate];
    const outerAggregate = new AggregateDataTableError(outerErrors);

    const result = flattenErrors(outerAggregate);

    expect(result).toHaveLength(3);
  });
});

describe("isAggregateError", () => {
  it("should return true for aggregate error", () => {
    const aggregate = new AggregateDataTableError([createError("Error")]);
    expect(isAggregateError(aggregate)).toBe(true);
  });

  it("should return false for regular error", () => {
    const error = createError("Error");
    expect(isAggregateError(error)).toBe(false);
  });

  it("should return false for non-error", () => {
    expect(isAggregateError(null)).toBe(false);
    expect(isAggregateError(undefined)).toBe(false);
    expect(isAggregateError("string")).toBe(false);
    expect(isAggregateError({})).toBe(false);
  });
});
