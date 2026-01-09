import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  safeExport,
  safeExportCSV,
  safeExportJSON,
  safeExportExcel,
  safeExportWithRetry,
  safeBatchExport,
  type SafeExportResult,
} from "../../../utils/export/safe-export";
import { createErrorHub } from "../../../errors/error-hub";
import { ExportError } from "../../../errors/runtime-errors";
import type { Column } from "../../../types";

// ─── TEST DATA ───────────────────────────────────────────────────────────────

interface TestRow {
  id: string;
  name: string;
  age: number;
  email: string;
}

const testData: TestRow[] = [
  { id: "1", name: "Alice", age: 30, email: "alice@example.com" },
  { id: "2", name: "Bob", age: 25, email: "bob@example.com" },
  { id: "3", name: "Charlie", age: 35, email: "charlie@example.com" },
];

const testColumns: Column<TestRow>[] = [
  { key: "name", header: "Name" },
  { key: "age", header: "Age" },
  { key: "email", header: "Email" },
];

// ─── TEST HELPERS ────────────────────────────────────────────────────────────

// Mock downloadFile to prevent actual file downloads
vi.mock("../../../utils/export/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../utils/export/utils")>();
  return {
    ...actual,
    downloadFile: vi.fn(),
  };
});

let errorHub: ReturnType<typeof createErrorHub>;
let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorHub = createErrorHub({ enableConsoleLog: false });
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  errorHub.destroy();
  consoleError.mockRestore();
});

// ─── safeExport TESTS ────────────────────────────────────────────────────────

describe("safeExport", () => {
  describe("CSV export", () => {
    it("should successfully export to CSV", async () => {
      const result = await safeExport(
        { format: "csv", data: testData, columns: testColumns },
        { errorHub }
      );

      expect(result.success).toBe(true);
      expect(result.format).toBe("csv");
      expect(result.rowCount).toBe(3);
      expect(result.duration).toBeDefined();
    });

    it("should call onStart callback", async () => {
      const onStart = vi.fn();

      await safeExport(
        { format: "csv", data: testData, columns: testColumns },
        { errorHub, onStart }
      );

      expect(onStart).toHaveBeenCalledWith("csv");
    });

    it("should call onSuccess callback on success", async () => {
      const onSuccess = vi.fn();

      await safeExport(
        { format: "csv", data: testData, columns: testColumns },
        { errorHub, onSuccess }
      );

      expect(onSuccess).toHaveBeenCalled();
      const result = onSuccess.mock.calls[0]![0] as SafeExportResult;
      expect(result.success).toBe(true);
    });

    it("should report error on failure", async () => {
      const result = await safeExport(
        { format: "csv", data: [], columns: testColumns },
        { errorHub }
      );

      expect(result.success).toBe(false);
      expect(result.errorReported).toBe(true);
      expect(errorHub.getErrors().length).toBe(1);
    });

    it("should call onError callback on failure", async () => {
      const onError = vi.fn();

      await safeExport(
        { format: "csv", data: [], columns: testColumns },
        { errorHub, onError }
      );

      expect(onError).toHaveBeenCalled();
      const [error, result] = onError.mock.calls[0]!;
      expect(error).toBeInstanceOf(ExportError);
      expect(result.success).toBe(false);
    });
  });

  describe("JSON export", () => {
    it("should successfully export to JSON", async () => {
      const result = await safeExport(
        { format: "json", data: testData, columns: testColumns },
        { errorHub }
      );

      expect(result.success).toBe(true);
      expect(result.format).toBe("json");
      expect(result.rowCount).toBe(3);
    });

    it("should handle JSON export options", async () => {
      const result = await safeExport(
        {
          format: "json",
          data: testData,
          columns: testColumns,
          pretty: true,
          indent: 4,
          includeMetadata: true,
        },
        { errorHub }
      );

      expect(result.success).toBe(true);
    });
  });

  describe("PDF export", () => {
    it("should return error for PDF (not implemented)", async () => {
      const result = await safeExport(
        { format: "pdf", data: testData, columns: testColumns },
        { errorHub }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("not yet implemented");
    });
  });

  describe("unknown format", () => {
    it("should return error for unknown format", async () => {
      const result = await safeExport(
        { format: "unknown" as "csv", data: testData, columns: testColumns },
        { errorHub }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown export format");
    });
  });

  describe("error logging", () => {
    it("should log errors when logErrors is true", async () => {
      await safeExport(
        { format: "csv", data: [], columns: testColumns },
        { errorHub, logErrors: true }
      );

      expect(consoleError).toHaveBeenCalled();
    });

    it("should not log errors when logErrors is false", async () => {
      await safeExport(
        { format: "csv", data: [], columns: testColumns },
        { errorHub, logErrors: false }
      );

      expect(consoleError).not.toHaveBeenCalled();
    });
  });
});

// ─── safeExportCSV TESTS ─────────────────────────────────────────────────────

describe("safeExportCSV", () => {
  it("should export to CSV format", async () => {
    const result = await safeExportCSV(
      { data: testData, columns: testColumns },
      { errorHub }
    );

    expect(result.success).toBe(true);
    expect(result.format).toBe("csv");
  });

  it("should accept CSV-specific options", async () => {
    const result = await safeExportCSV(
      {
        data: testData,
        columns: testColumns,
        delimiter: ";",
        includeBOM: true,
      },
      { errorHub }
    );

    expect(result.success).toBe(true);
  });
});

// ─── safeExportJSON TESTS ────────────────────────────────────────────────────

describe("safeExportJSON", () => {
  it("should export to JSON format", async () => {
    const result = await safeExportJSON(
      { data: testData, columns: testColumns },
      { errorHub }
    );

    expect(result.success).toBe(true);
    expect(result.format).toBe("json");
  });

  it("should accept JSON-specific options", async () => {
    const result = await safeExportJSON(
      {
        data: testData,
        columns: testColumns,
        pretty: false,
        includeMetadata: true,
      },
      { errorHub }
    );

    expect(result.success).toBe(true);
  });
});

// ─── safeExportExcel TESTS ───────────────────────────────────────────────────

describe("safeExportExcel", () => {
  it("should attempt Excel export", async () => {
    // Excel export may fail if xlsx is not available, but should not throw
    const result = await safeExportExcel(
      { data: testData, columns: testColumns },
      { errorHub }
    );

    expect(result.format).toBe("excel");
    // May succeed or fail depending on xlsx availability
    expect(typeof result.success).toBe("boolean");
  });
});

// ─── safeExportWithRetry TESTS ───────────────────────────────────────────────

describe("safeExportWithRetry", () => {
  it("should return immediately on success", async () => {
    const onRetry = vi.fn();

    const result = await safeExportWithRetry(
      { format: "csv", data: testData, columns: testColumns },
      { errorHub },
      { maxAttempts: 3, onRetry }
    );

    expect(result.success).toBe(true);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("should retry on failure", async () => {
    const onRetry = vi.fn();

    // Empty data will fail
    const result = await safeExportWithRetry(
      { format: "csv", data: [], columns: testColumns },
      { errorHub },
      { maxAttempts: 2, delayMs: 10, onRetry }
    );

    expect(result.success).toBe(false);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("should respect maxAttempts", async () => {
    const onRetry = vi.fn();

    await safeExportWithRetry(
      { format: "csv", data: [], columns: testColumns },
      { errorHub },
      { maxAttempts: 3, delayMs: 10, onRetry }
    );

    expect(onRetry).toHaveBeenCalledTimes(2); // 3 attempts = 2 retries
  });

  it("should use default retry options", async () => {
    const result = await safeExportWithRetry(
      { format: "csv", data: testData, columns: testColumns },
      { errorHub }
    );

    expect(result.success).toBe(true);
  });

  it("should only report error on final attempt", async () => {
    await safeExportWithRetry(
      { format: "csv", data: [], columns: testColumns },
      { errorHub },
      { maxAttempts: 3, delayMs: 10 }
    );

    // Only the final attempt should report to errorHub
    expect(errorHub.getErrors().length).toBe(1);
  });
});

// ─── safeBatchExport TESTS ───────────────────────────────────────────────────

describe("safeBatchExport", () => {
  it("should export multiple formats", async () => {
    const results = await safeBatchExport(
      [
        { format: "csv", data: testData, columns: testColumns },
        { format: "json", data: testData, columns: testColumns },
      ],
      { errorHub }
    );

    expect(results.length).toBe(2);
    expect(results[0]!.format).toBe("csv");
    expect(results[1]!.format).toBe("json");
  });

  it("should handle mixed success/failure", async () => {
    const results = await safeBatchExport(
      [
        { format: "csv", data: testData, columns: testColumns },
        { format: "pdf", data: testData, columns: testColumns }, // Not implemented
      ],
      { errorHub }
    );

    expect(results[0]!.success).toBe(true);
    expect(results[1]!.success).toBe(false);
  });

  it("should return empty array for empty configs", async () => {
    const results = await safeBatchExport([], { errorHub });
    expect(results).toEqual([]);
  });

  it("should call callbacks for each export", async () => {
    const onStart = vi.fn();
    const onSuccess = vi.fn();

    await safeBatchExport(
      [
        { format: "csv", data: testData, columns: testColumns },
        { format: "json", data: testData, columns: testColumns },
      ],
      { errorHub, onStart, onSuccess }
    );

    expect(onStart).toHaveBeenCalledTimes(2);
    expect(onSuccess).toHaveBeenCalledTimes(2);
  });
});

// ─── EDGE CASES ──────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("should handle empty columns", async () => {
    const result = await safeExport(
      { format: "csv", data: testData, columns: [] },
      { errorHub }
    );

    expect(result.success).toBe(false);
  });

  it("should handle large dataset", async () => {
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      id: String(i),
      name: `User ${i}`,
      age: 20 + (i % 50),
      email: `user${i}@example.com`,
    }));

    const result = await safeExport(
      { format: "csv", data: largeData, columns: testColumns },
      { errorHub }
    );

    expect(result.success).toBe(true);
    expect(result.rowCount).toBe(1000);
  });

  it("should include duration in result", async () => {
    const result = await safeExport(
      { format: "csv", data: testData, columns: testColumns },
      { errorHub }
    );

    expect(result.duration).toBeDefined();
    expect(typeof result.duration).toBe("number");
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it("should handle special characters in data", async () => {
    const specialData = [
      { id: "1", name: "Alice \"Bob\"", age: 30, email: "alice,bob@example.com" },
      { id: "2", name: "Line\nBreak", age: 25, email: "tab\there@example.com" },
    ];

    const result = await safeExport(
      { format: "csv", data: specialData, columns: testColumns },
      { errorHub }
    );

    expect(result.success).toBe(true);
  });
});

// ─── ERROR HANDLING ──────────────────────────────────────────────────────────

describe("error handling", () => {
  it("should handle thrown errors gracefully", async () => {
    // This should not throw even if export fails
    const result = await safeExport(
      { format: "csv", data: null as unknown as TestRow[], columns: testColumns },
      { errorHub }
    );

    expect(result.success).toBe(false);
  });

  it("should preserve error message", async () => {
    const result = await safeExport(
      { format: "csv", data: [], columns: testColumns },
      { errorHub }
    );

    expect(result.error).toBeDefined();
    expect(typeof result.error).toBe("string");
  });

  it("should report ExportError to hub", async () => {
    await safeExport(
      { format: "csv", data: [], columns: testColumns },
      { errorHub }
    );

    const errors = errorHub.getErrors();
    expect(errors.length).toBe(1);
    expect(errors[0]).toBeInstanceOf(ExportError);
  });
});
