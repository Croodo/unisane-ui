import { describe, it, expect } from "vitest";
import {
  DuplicateRowIdError,
  MissingRowIdError,
  InvalidDataFormatError,
  DataFetchError,
} from "../../errors/data-errors";
import { DataTableErrorCode } from "../../errors/base";

// ─── DuplicateRowIdError TESTS ──────────────────────────────────────────────

describe("DuplicateRowIdError", () => {
  describe("construction", () => {
    it("should create error with single duplicate ID", () => {
      const error = new DuplicateRowIdError(["abc123"]);

      expect(error.message).toBe('Duplicate row IDs detected: abc123. Each row must have a unique ID.');
      expect(error.duplicateIds).toEqual(["abc123"]);
      expect(error.code).toBe(DataTableErrorCode.DUPLICATE_ROW_ID);
    });

    it("should create error with multiple duplicate IDs", () => {
      const error = new DuplicateRowIdError(["id1", "id2", "id3"]);

      expect(error.message).toBe('Duplicate row IDs detected: id1, id2, id3. Each row must have a unique ID.');
      expect(error.duplicateIds).toEqual(["id1", "id2", "id3"]);
    });

    it("should set correct error name", () => {
      const error = new DuplicateRowIdError(["test"]);

      expect(error.name).toBe("DuplicateRowIdError");
    });

    it("should include context with duplicate IDs", () => {
      const error = new DuplicateRowIdError(["a", "b"]);

      expect(error.context).toEqual({ duplicateIds: ["a", "b"] });
    });
  });

  describe("message truncation", () => {
    it("should show first 5 IDs when more than 5 duplicates", () => {
      const ids = ["id1", "id2", "id3", "id4", "id5", "id6", "id7"];
      const error = new DuplicateRowIdError(ids);

      expect(error.message).toContain("id1, id2, id3, id4, id5");
      expect(error.message).toContain("and 2 more");
    });

    it("should not truncate when exactly 5 IDs", () => {
      const ids = ["id1", "id2", "id3", "id4", "id5"];
      const error = new DuplicateRowIdError(ids);

      expect(error.message).toContain("id1, id2, id3, id4, id5");
      expect(error.message).not.toContain("more");
    });

    it("should still store all duplicate IDs in property", () => {
      const ids = Array.from({ length: 20 }, (_, i) => `id-${i}`);
      const error = new DuplicateRowIdError(ids);

      expect(error.duplicateIds).toHaveLength(20);
    });
  });

  describe("edge cases", () => {
    it("should handle empty array", () => {
      const error = new DuplicateRowIdError([]);

      expect(error.duplicateIds).toEqual([]);
      expect(error.message).toContain("Duplicate row IDs detected:");
    });

    it("should handle IDs with special characters", () => {
      const error = new DuplicateRowIdError(["user:123", "item-456"]);

      expect(error.message).toContain("user:123");
      expect(error.message).toContain("item-456");
    });
  });
});

// ─── MissingRowIdError TESTS ────────────────────────────────────────────────

describe("MissingRowIdError", () => {
  describe("construction", () => {
    it("should create error with row index", () => {
      const error = new MissingRowIdError(5);

      expect(error.message).toBe("Row at index 5 is missing a required ID field.");
      expect(error.rowIndex).toBe(5);
      expect(error.code).toBe(DataTableErrorCode.MISSING_ROW_ID);
    });

    it("should create error for first row", () => {
      const error = new MissingRowIdError(0);

      expect(error.message).toBe("Row at index 0 is missing a required ID field.");
      expect(error.rowIndex).toBe(0);
    });

    it("should set correct error name", () => {
      const error = new MissingRowIdError(10);

      expect(error.name).toBe("MissingRowIdError");
    });

    it("should include context with row index", () => {
      const error = new MissingRowIdError(42);

      expect(error.context).toEqual({ rowIndex: 42 });
    });
  });

  describe("edge cases", () => {
    it("should handle large row index", () => {
      const error = new MissingRowIdError(999999);

      expect(error.rowIndex).toBe(999999);
      expect(error.message).toContain("999999");
    });

    it("should handle negative index (edge case)", () => {
      const error = new MissingRowIdError(-1);

      expect(error.rowIndex).toBe(-1);
    });
  });
});

// ─── InvalidDataFormatError TESTS ───────────────────────────────────────────

describe("InvalidDataFormatError", () => {
  describe("construction", () => {
    it("should create error with message only", () => {
      const error = new InvalidDataFormatError("Data must be an array");

      expect(error.message).toBe("Data must be an array");
      expect(error.code).toBe(DataTableErrorCode.INVALID_DATA_FORMAT);
    });

    it("should create error with message and details", () => {
      const error = new InvalidDataFormatError("Invalid row structure", {
        expectedType: "object",
        receivedType: "string",
        rowIndex: 5,
      });

      expect(error.message).toBe("Invalid row structure");
      expect(error.context).toEqual({
        expectedType: "object",
        receivedType: "string",
        rowIndex: 5,
      });
    });

    it("should set correct error name", () => {
      const error = new InvalidDataFormatError("Test");

      expect(error.name).toBe("InvalidDataFormatError");
    });
  });

  describe("real world scenarios", () => {
    it("should describe array requirement", () => {
      const error = new InvalidDataFormatError(
        "Data prop must be an array of objects. Received: null"
      );

      expect(error.message).toContain("array");
    });

    it("should describe row structure issue", () => {
      const error = new InvalidDataFormatError(
        "Each row must be an object with an 'id' property",
        { affectedRows: 10 }
      );

      expect(error.message).toContain("object");
      expect(error.context).toEqual({ affectedRows: 10 });
    });
  });
});

// ─── DataFetchError TESTS ───────────────────────────────────────────────────

describe("DataFetchError", () => {
  describe("construction", () => {
    it("should create error with message only", () => {
      const error = new DataFetchError("Network request failed");

      expect(error.message).toBe("Network request failed");
      expect(error.code).toBe(DataTableErrorCode.DATA_FETCH_FAILED);
      expect(error.statusCode).toBeUndefined();
      expect(error.url).toBeUndefined();
    });

    it("should create error with status code", () => {
      const error = new DataFetchError("Server error", { statusCode: 500 });

      expect(error.statusCode).toBe(500);
    });

    it("should create error with URL", () => {
      const error = new DataFetchError("Not found", { url: "/api/data" });

      expect(error.url).toBe("/api/data");
    });

    it("should create error with cause", () => {
      const cause = new Error("Original error");
      const error = new DataFetchError("Fetch failed", { cause });

      expect(error.cause).toBe(cause);
    });

    it("should create error with all options", () => {
      const cause = new Error("Network timeout");
      const error = new DataFetchError("Request timed out", {
        statusCode: 504,
        url: "https://api.example.com/data",
        cause,
      });

      expect(error.statusCode).toBe(504);
      expect(error.url).toBe("https://api.example.com/data");
      expect(error.cause).toBe(cause);
    });

    it("should set correct error name", () => {
      const error = new DataFetchError("Test");

      expect(error.name).toBe("DataFetchError");
    });

    it("should include context with status and URL", () => {
      const error = new DataFetchError("Error", { statusCode: 404, url: "/api" });

      expect(error.context).toEqual({ statusCode: 404, url: "/api" });
    });
  });

  describe("HTTP status codes", () => {
    it("should handle 400 Bad Request", () => {
      const error = new DataFetchError("Bad request", { statusCode: 400 });

      expect(error.statusCode).toBe(400);
    });

    it("should handle 401 Unauthorized", () => {
      const error = new DataFetchError("Unauthorized", { statusCode: 401 });

      expect(error.statusCode).toBe(401);
    });

    it("should handle 403 Forbidden", () => {
      const error = new DataFetchError("Forbidden", { statusCode: 403 });

      expect(error.statusCode).toBe(403);
    });

    it("should handle 404 Not Found", () => {
      const error = new DataFetchError("Not found", { statusCode: 404 });

      expect(error.statusCode).toBe(404);
    });

    it("should handle 500 Internal Server Error", () => {
      const error = new DataFetchError("Server error", { statusCode: 500 });

      expect(error.statusCode).toBe(500);
    });

    it("should handle 503 Service Unavailable", () => {
      const error = new DataFetchError("Service unavailable", { statusCode: 503 });

      expect(error.statusCode).toBe(503);
    });
  });

  describe("URL formats", () => {
    it("should handle relative URLs", () => {
      const error = new DataFetchError("Error", { url: "/api/v1/data" });

      expect(error.url).toBe("/api/v1/data");
    });

    it("should handle absolute URLs", () => {
      const error = new DataFetchError("Error", { url: "https://example.com/api" });

      expect(error.url).toBe("https://example.com/api");
    });

    it("should handle URLs with query parameters", () => {
      const error = new DataFetchError("Error", { url: "/api?page=1&limit=10" });

      expect(error.url).toBe("/api?page=1&limit=10");
    });
  });
});

// ─── ERROR CODE VERIFICATION ────────────────────────────────────────────────

describe("data error codes", () => {
  it("should use unique error codes for each error type", () => {
    const duplicate = new DuplicateRowIdError(["a"]);
    const missing = new MissingRowIdError(0);
    const invalidFormat = new InvalidDataFormatError("msg");
    const fetchError = new DataFetchError("msg");

    const codes = new Set([
      duplicate.code,
      missing.code,
      invalidFormat.code,
      fetchError.code,
    ]);

    expect(codes.size).toBe(4); // All unique
  });

  it("should all be data-related error codes", () => {
    const duplicate = new DuplicateRowIdError(["a"]);
    const missing = new MissingRowIdError(0);
    const invalidFormat = new InvalidDataFormatError("msg");
    const fetchError = new DataFetchError("msg");

    expect(duplicate.code).toBe(DataTableErrorCode.DUPLICATE_ROW_ID);
    expect(missing.code).toBe(DataTableErrorCode.MISSING_ROW_ID);
    expect(invalidFormat.code).toBe(DataTableErrorCode.INVALID_DATA_FORMAT);
    expect(fetchError.code).toBe(DataTableErrorCode.DATA_FETCH_FAILED);
  });
});
