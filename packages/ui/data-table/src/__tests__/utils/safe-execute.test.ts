import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  safeExecute,
  createSafeFilter,
  createSafeFilters,
  createSafeSort,
  createSafeSearch,
  createSafeCellRenderer,
  createSafeAccessor,
  safeBatchExecute,
  safeExecuteAsync,
  type SafeExecuteOptions,
  type CellRenderContext,
} from "../../utils/safe-execute";
import { DataTableErrorCode } from "../../errors/base";
import { ErrorSeverity } from "../../errors/severity";
import type { ErrorHub } from "../../errors/error-hub";

// ─── MOCK ERROR HUB ─────────────────────────────────────────────────────────

function createMockErrorHub(): ErrorHub & { reportedErrors: unknown[] } {
  const reportedErrors: unknown[] = [];
  return {
    reportedErrors,
    report: vi.fn((error) => {
      reportedErrors.push(error);
    }),
    subscribe: vi.fn(() => vi.fn()),
    getErrors: vi.fn(() => []),
    clearErrors: vi.fn(),
    hasErrors: vi.fn(() => false),
  } as unknown as ErrorHub & { reportedErrors: unknown[] };
}

// ─── safeExecute TESTS ──────────────────────────────────────────────────────

describe("safeExecute", () => {
  let mockErrorHub: ReturnType<typeof createMockErrorHub>;

  beforeEach(() => {
    mockErrorHub = createMockErrorHub();
  });

  describe("successful execution", () => {
    it("should return function result on success", () => {
      const fn = (a: number, b: number) => a + b;
      const result = safeExecute(fn, [2, 3], {
        errorHub: mockErrorHub,
        fallback: 0,
        errorCode: DataTableErrorCode.FILTER_ERROR,
      });

      expect(result).toBe(5);
      expect(mockErrorHub.report).not.toHaveBeenCalled();
    });

    it("should pass all arguments to function", () => {
      const fn = vi.fn((a: string, b: number, c: boolean) => `${a}-${b}-${c}`);

      safeExecute(fn, ["test", 42, true], {
        errorHub: mockErrorHub,
        fallback: "",
        errorCode: DataTableErrorCode.RENDER_ERROR,
      });

      expect(fn).toHaveBeenCalledWith("test", 42, true);
    });

    it("should not report error on success", () => {
      const fn = () => "success";

      safeExecute(fn, [], {
        errorHub: mockErrorHub,
        fallback: "fallback",
        errorCode: DataTableErrorCode.FILTER_ERROR,
      });

      expect(mockErrorHub.reportedErrors).toHaveLength(0);
    });
  });

  describe("error handling", () => {
    it("should return fallback on error", () => {
      const fn = () => {
        throw new Error("Test error");
      };

      const result = safeExecute(fn, [], {
        errorHub: mockErrorHub,
        fallback: "fallback value",
        errorCode: DataTableErrorCode.FILTER_ERROR,
      });

      expect(result).toBe("fallback value");
    });

    it("should report error to error hub", () => {
      const fn = () => {
        throw new Error("Test error");
      };

      safeExecute(fn, [], {
        errorHub: mockErrorHub,
        fallback: null,
        errorCode: DataTableErrorCode.RENDER_ERROR,
      });

      expect(mockErrorHub.report).toHaveBeenCalledTimes(1);
    });

    it("should include error context", () => {
      const fn = () => {
        throw new Error("Test error");
      };

      safeExecute(fn, [], {
        errorHub: mockErrorHub,
        fallback: null,
        errorCode: DataTableErrorCode.FILTER_ERROR,
        context: { columnKey: "name", rowIndex: 5 },
      });

      expect(mockErrorHub.report).toHaveBeenCalled();
    });

    it("should handle non-Error throws", () => {
      const fn = () => {
        throw "string error";
      };

      const result = safeExecute(fn, [], {
        errorHub: mockErrorHub,
        fallback: "fallback",
        errorCode: DataTableErrorCode.FILTER_ERROR,
      });

      expect(result).toBe("fallback");
      expect(mockErrorHub.report).toHaveBeenCalled();
    });

    it("should respect custom severity", () => {
      const fn = () => {
        throw new Error("Test error");
      };

      safeExecute(fn, [], {
        errorHub: mockErrorHub,
        fallback: null,
        errorCode: DataTableErrorCode.FILTER_ERROR,
        severity: ErrorSeverity.WARNING,
      });

      expect(mockErrorHub.report).toHaveBeenCalled();
    });
  });

  describe("development warnings", () => {
    const originalEnv = process.env.NODE_ENV;
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it("should log warning in development when logWarning is true", () => {
      process.env.NODE_ENV = "development";

      const fn = () => {
        throw new Error("Test error");
      };

      safeExecute(fn, [], {
        errorHub: mockErrorHub,
        fallback: null,
        errorCode: DataTableErrorCode.FILTER_ERROR,
        logWarning: true,
      });

      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("should not log warning in production", () => {
      process.env.NODE_ENV = "production";

      const fn = () => {
        throw new Error("Test error");
      };

      safeExecute(fn, [], {
        errorHub: mockErrorHub,
        fallback: null,
        errorCode: DataTableErrorCode.FILTER_ERROR,
        logWarning: true,
      });

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("should not log warning when logWarning is false", () => {
      process.env.NODE_ENV = "development";

      const fn = () => {
        throw new Error("Test error");
      };

      safeExecute(fn, [], {
        errorHub: mockErrorHub,
        fallback: null,
        errorCode: DataTableErrorCode.FILTER_ERROR,
        logWarning: false,
      });

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});

// ─── createSafeFilter TESTS ─────────────────────────────────────────────────

describe("createSafeFilter", () => {
  let mockErrorHub: ReturnType<typeof createMockErrorHub>;

  beforeEach(() => {
    mockErrorHub = createMockErrorHub();
  });

  it("should return true when filter returns true", () => {
    const filterFn = (row: { name: string }, value: unknown) => row.name.includes(value as string);
    const safeFilter = createSafeFilter(filterFn, mockErrorHub, "name");

    const result = safeFilter({ name: "John" }, "oh");
    expect(result).toBe(true);
  });

  it("should return false when filter returns false", () => {
    const filterFn = (row: { name: string }, value: unknown) => row.name.includes(value as string);
    const safeFilter = createSafeFilter(filterFn, mockErrorHub, "name");

    const result = safeFilter({ name: "John" }, "xyz");
    expect(result).toBe(false);
  });

  it("should return true (include row) on error", () => {
    const filterFn = () => {
      throw new Error("Filter failed");
    };
    const safeFilter = createSafeFilter(filterFn, mockErrorHub, "name");

    const result = safeFilter({ name: "John" }, "test");
    expect(result).toBe(true);
  });

  it("should report only first error", () => {
    const filterFn = () => {
      throw new Error("Filter failed");
    };
    const safeFilter = createSafeFilter(filterFn, mockErrorHub, "name");

    // Call multiple times
    safeFilter({ name: "A" }, "test");
    safeFilter({ name: "B" }, "test");
    safeFilter({ name: "C" }, "test");

    // Should only report once
    expect(mockErrorHub.report).toHaveBeenCalledTimes(1);
  });

  it("should handle non-Error throws", () => {
    const filterFn = () => {
      throw "string error";
    };
    const safeFilter = createSafeFilter(filterFn, mockErrorHub, "name");

    const result = safeFilter({ name: "John" }, "test");
    expect(result).toBe(true);
    expect(mockErrorHub.report).toHaveBeenCalled();
  });
});

// ─── createSafeFilters TESTS ────────────────────────────────────────────────

describe("createSafeFilters", () => {
  let mockErrorHub: ReturnType<typeof createMockErrorHub>;

  beforeEach(() => {
    mockErrorHub = createMockErrorHub();
  });

  it("should create map of safe filters", () => {
    const columns = [
      { key: "name", filterFn: (row: { name: string }, val: unknown) => row.name.includes(val as string) },
      { key: "age", filterFn: (row: { name: string }, val: unknown) => (row as unknown as { age: number }).age >= (val as number) },
    ];

    const safeFilters = createSafeFilters(columns, mockErrorHub);

    expect(safeFilters.size).toBe(2);
    expect(safeFilters.has("name")).toBe(true);
    expect(safeFilters.has("age")).toBe(true);
  });

  it("should skip columns without filterFn", () => {
    const columns = [
      { key: "name", filterFn: (row: { name: string }, val: unknown) => row.name.includes(val as string) },
      { key: "id" }, // No filterFn
    ];

    const safeFilters = createSafeFilters(columns, mockErrorHub);

    expect(safeFilters.size).toBe(1);
    expect(safeFilters.has("name")).toBe(true);
    expect(safeFilters.has("id")).toBe(false);
  });

  it("should create working safe filters", () => {
    const columns = [
      { key: "name", filterFn: (row: { name: string }, val: unknown) => row.name === val },
    ];

    const safeFilters = createSafeFilters(columns, mockErrorHub);
    const nameFilter = safeFilters.get("name");

    expect(nameFilter?.({ name: "John" }, "John")).toBe(true);
    expect(nameFilter?.({ name: "Jane" }, "John")).toBe(false);
  });

  it("should return empty map for empty columns", () => {
    const safeFilters = createSafeFilters([], mockErrorHub);
    expect(safeFilters.size).toBe(0);
  });
});

// ─── createSafeSort TESTS ───────────────────────────────────────────────────

describe("createSafeSort", () => {
  let mockErrorHub: ReturnType<typeof createMockErrorHub>;

  beforeEach(() => {
    mockErrorHub = createMockErrorHub();
  });

  it("should return correct comparison value on success", () => {
    const sortFn = (a: { age: number }, b: { age: number }) => a.age - b.age;
    const safeSort = createSafeSort(sortFn, mockErrorHub, "age");

    expect(safeSort({ age: 20 }, { age: 30 })).toBeLessThan(0);
    expect(safeSort({ age: 30 }, { age: 20 })).toBeGreaterThan(0);
    expect(safeSort({ age: 25 }, { age: 25 })).toBe(0);
  });

  it("should return 0 on error (stable sort)", () => {
    const sortFn = () => {
      throw new Error("Sort failed");
    };
    const safeSort = createSafeSort(sortFn, mockErrorHub, "name");

    const result = safeSort({ name: "A" }, { name: "B" });
    expect(result).toBe(0);
  });

  it("should report only first error", () => {
    const sortFn = () => {
      throw new Error("Sort failed");
    };
    const safeSort = createSafeSort(sortFn, mockErrorHub, "name");

    safeSort({ name: "A" }, { name: "B" });
    safeSort({ name: "C" }, { name: "D" });

    expect(mockErrorHub.report).toHaveBeenCalledTimes(1);
  });

  it("should work with Array.sort", () => {
    const sortFn = (a: { val: number }, b: { val: number }) => a.val - b.val;
    const safeSort = createSafeSort(sortFn, mockErrorHub, "val");

    const data = [{ val: 3 }, { val: 1 }, { val: 2 }];
    const sorted = [...data].sort(safeSort);

    expect(sorted[0]?.val).toBe(1);
    expect(sorted[1]?.val).toBe(2);
    expect(sorted[2]?.val).toBe(3);
  });
});

// ─── createSafeSearch TESTS ─────────────────────────────────────────────────

describe("createSafeSearch", () => {
  let mockErrorHub: ReturnType<typeof createMockErrorHub>;

  beforeEach(() => {
    mockErrorHub = createMockErrorHub();
  });

  it("should return true when search matches", () => {
    const searchFn = (row: { name: string }, text: string) =>
      row.name.toLowerCase().includes(text.toLowerCase());
    const safeSearch = createSafeSearch(searchFn, mockErrorHub);

    expect(safeSearch({ name: "John Doe" }, "john")).toBe(true);
  });

  it("should return false when search does not match", () => {
    const searchFn = (row: { name: string }, text: string) =>
      row.name.toLowerCase().includes(text.toLowerCase());
    const safeSearch = createSafeSearch(searchFn, mockErrorHub);

    expect(safeSearch({ name: "John Doe" }, "jane")).toBe(false);
  });

  it("should return true (include row) on error", () => {
    const searchFn = () => {
      throw new Error("Search failed");
    };
    const safeSearch = createSafeSearch(searchFn, mockErrorHub);

    expect(safeSearch({ name: "John" }, "test")).toBe(true);
  });

  it("should report only first error", () => {
    const searchFn = () => {
      throw new Error("Search failed");
    };
    const safeSearch = createSafeSearch(searchFn, mockErrorHub);

    safeSearch({ name: "A" }, "test");
    safeSearch({ name: "B" }, "test");

    expect(mockErrorHub.report).toHaveBeenCalledTimes(1);
  });
});

// ─── createSafeCellRenderer TESTS ───────────────────────────────────────────

describe("createSafeCellRenderer", () => {
  let mockErrorHub: ReturnType<typeof createMockErrorHub>;

  beforeEach(() => {
    mockErrorHub = createMockErrorHub();
  });

  const createContext = (rowId: string, value: unknown = "test"): CellRenderContext<{ id: string; name: string }> => ({
    row: { id: rowId, name: "Test" },
    value,
    columnKey: "name",
    rowIndex: 0,
  });

  it("should return renderer result on success", () => {
    const renderer = (ctx: CellRenderContext<{ id: string; name: string }>) => `Value: ${ctx.value}`;
    const safeRenderer = createSafeCellRenderer(renderer, mockErrorHub, "name");

    const result = safeRenderer(createContext("1", "John"));
    expect(result).toBe("Value: John");
  });

  it("should return null on error without fallback", () => {
    const renderer = () => {
      throw new Error("Render failed");
    };
    const safeRenderer = createSafeCellRenderer(renderer, mockErrorHub, "name");

    const result = safeRenderer(createContext("1"));
    expect(result).toBeNull();
  });

  it("should return fallback result on error", () => {
    const renderer = () => {
      throw new Error("Render failed");
    };
    const fallback = () => "Error occurred";
    const safeRenderer = createSafeCellRenderer(renderer, mockErrorHub, "name", fallback);

    const result = safeRenderer(createContext("1"));
    expect(result).toBe("Error occurred");
  });

  it("should report error once per row", () => {
    const renderer = () => {
      throw new Error("Render failed");
    };
    const safeRenderer = createSafeCellRenderer(renderer, mockErrorHub, "name");

    // Same row ID multiple times
    safeRenderer(createContext("1"));
    safeRenderer(createContext("1"));

    expect(mockErrorHub.report).toHaveBeenCalledTimes(1);
  });

  it("should report error for different rows", () => {
    const renderer = () => {
      throw new Error("Render failed");
    };
    const safeRenderer = createSafeCellRenderer(renderer, mockErrorHub, "name");

    safeRenderer(createContext("1"));
    safeRenderer(createContext("2"));
    safeRenderer(createContext("3"));

    expect(mockErrorHub.report).toHaveBeenCalledTimes(3);
  });

  it("should clear reported rows after 100 entries", () => {
    const renderer = () => {
      throw new Error("Render failed");
    };
    const safeRenderer = createSafeCellRenderer(renderer, mockErrorHub, "name");

    // Generate 101 different rows
    for (let i = 0; i < 101; i++) {
      safeRenderer(createContext(`row-${i}`));
    }

    // After 100+ rows, the set should be cleared, so this should report again
    safeRenderer(createContext("row-0"));

    // More than 101 reports (101 initial + 1 after clear)
    expect(mockErrorHub.report).toHaveBeenCalledTimes(102);
  });
});

// ─── createSafeAccessor TESTS ───────────────────────────────────────────────

describe("createSafeAccessor", () => {
  let mockErrorHub: ReturnType<typeof createMockErrorHub>;

  beforeEach(() => {
    mockErrorHub = createMockErrorHub();
  });

  it("should return accessor value on success", () => {
    const accessorFn = (row: { name: string }) => row.name;
    const safeAccessor = createSafeAccessor(accessorFn, mockErrorHub, "name");

    expect(safeAccessor({ name: "John" })).toBe("John");
  });

  it("should return undefined on error", () => {
    const accessorFn = () => {
      throw new Error("Accessor failed");
    };
    const safeAccessor = createSafeAccessor(accessorFn, mockErrorHub, "name");

    expect(safeAccessor({ name: "John" })).toBeUndefined();
  });

  it("should report only first error", () => {
    const accessorFn = () => {
      throw new Error("Accessor failed");
    };
    const safeAccessor = createSafeAccessor(accessorFn, mockErrorHub, "name");

    safeAccessor({ name: "A" });
    safeAccessor({ name: "B" });

    expect(mockErrorHub.report).toHaveBeenCalledTimes(1);
  });

  it("should handle complex return types", () => {
    const accessorFn = (row: { data: { nested: { value: number } } }) => row.data.nested;
    const safeAccessor = createSafeAccessor(accessorFn, mockErrorHub, "data");

    const result = safeAccessor({ data: { nested: { value: 42 } } });
    expect(result).toEqual({ value: 42 });
  });
});

// ─── safeBatchExecute TESTS ─────────────────────────────────────────────────

describe("safeBatchExecute", () => {
  let mockErrorHub: ReturnType<typeof createMockErrorHub>;

  beforeEach(() => {
    mockErrorHub = createMockErrorHub();
  });

  it("should return all results on success", () => {
    const operations = [
      { fn: () => 1, errorCode: DataTableErrorCode.INVALID_DATA_FORMAT },
      { fn: () => 2, errorCode: DataTableErrorCode.INVALID_DATA_FORMAT },
      { fn: () => 3, errorCode: DataTableErrorCode.INVALID_DATA_FORMAT },
    ];

    const results = safeBatchExecute(operations, mockErrorHub);

    expect(results).toEqual([1, 2, 3]);
    expect(mockErrorHub.report).not.toHaveBeenCalled();
  });

  it("should return undefined for failed operations", () => {
    const operations = [
      { fn: () => 1, errorCode: DataTableErrorCode.INVALID_DATA_FORMAT },
      { fn: () => { throw new Error("Failed"); }, errorCode: DataTableErrorCode.INVALID_DATA_FORMAT },
      { fn: () => 3, errorCode: DataTableErrorCode.INVALID_DATA_FORMAT },
    ];

    const results = safeBatchExecute(operations, mockErrorHub);

    expect(results).toEqual([1, undefined, 3]);
  });

  it("should report all errors", () => {
    const operations = [
      { fn: () => { throw new Error("Error 1"); }, errorCode: DataTableErrorCode.INVALID_DATA_FORMAT },
      { fn: () => { throw new Error("Error 2"); }, errorCode: DataTableErrorCode.INVALID_DATA_FORMAT },
    ];

    safeBatchExecute(operations, mockErrorHub);

    expect(mockErrorHub.report).toHaveBeenCalledTimes(2);
  });

  it("should include context in error reports", () => {
    const operations = [
      {
        fn: () => { throw new Error("Error"); },
        errorCode: DataTableErrorCode.INVALID_DATA_FORMAT,
        context: { index: 0, operation: "validate" },
      },
    ];

    safeBatchExecute(operations, mockErrorHub);

    expect(mockErrorHub.report).toHaveBeenCalled();
  });

  it("should handle empty operations array", () => {
    const results = safeBatchExecute([], mockErrorHub);
    expect(results).toEqual([]);
  });
});

// ─── safeExecuteAsync TESTS ─────────────────────────────────────────────────

describe("safeExecuteAsync", () => {
  let mockErrorHub: ReturnType<typeof createMockErrorHub>;

  beforeEach(() => {
    mockErrorHub = createMockErrorHub();
  });

  it("should return result on success", async () => {
    const fn = async () => "success";

    const result = await safeExecuteAsync(fn, {
      errorHub: mockErrorHub,
      fallback: "fallback",
      errorCode: DataTableErrorCode.DATA_FETCH_FAILED,
    });

    expect(result).toBe("success");
    expect(mockErrorHub.report).not.toHaveBeenCalled();
  });

  it("should return fallback on rejection", async () => {
    const fn = async () => {
      throw new Error("Async error");
    };

    const result = await safeExecuteAsync(fn, {
      errorHub: mockErrorHub,
      fallback: "fallback",
      errorCode: DataTableErrorCode.DATA_FETCH_FAILED,
    });

    expect(result).toBe("fallback");
    expect(mockErrorHub.report).toHaveBeenCalled();
  });

  it("should handle delayed async operations", async () => {
    const fn = async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return "delayed result";
    };

    const result = await safeExecuteAsync(fn, {
      errorHub: mockErrorHub,
      fallback: "fallback",
      errorCode: DataTableErrorCode.DATA_FETCH_FAILED,
    });

    expect(result).toBe("delayed result");
  });

  it("should handle delayed rejection", async () => {
    const fn = async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      throw new Error("Delayed error");
    };

    const result = await safeExecuteAsync(fn, {
      errorHub: mockErrorHub,
      fallback: "fallback",
      errorCode: DataTableErrorCode.DATA_FETCH_FAILED,
    });

    expect(result).toBe("fallback");
  });

  it("should include context in error", async () => {
    const fn = async () => {
      throw new Error("Error");
    };

    await safeExecuteAsync(fn, {
      errorHub: mockErrorHub,
      fallback: null,
      errorCode: DataTableErrorCode.DATA_FETCH_FAILED,
      context: { endpoint: "/api/data" },
    });

    expect(mockErrorHub.report).toHaveBeenCalled();
  });

  it("should respect custom severity", async () => {
    const fn = async () => {
      throw new Error("Error");
    };

    await safeExecuteAsync(fn, {
      errorHub: mockErrorHub,
      fallback: null,
      errorCode: DataTableErrorCode.DATA_FETCH_FAILED,
      severity: ErrorSeverity.WARNING,
    });

    expect(mockErrorHub.report).toHaveBeenCalled();
  });
});
