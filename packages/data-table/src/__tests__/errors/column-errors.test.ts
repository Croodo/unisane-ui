import { describe, it, expect } from "vitest";
import {
  InvalidColumnKeyError,
  DuplicateColumnKeyError,
  MissingColumnAccessorError,
} from "../../errors/column-errors";
import { DataTableErrorCode } from "../../errors/base";

// ─── InvalidColumnKeyError TESTS ────────────────────────────────────────────

describe("InvalidColumnKeyError", () => {
  describe("construction", () => {
    it("should create error with column key only", () => {
      const error = new InvalidColumnKeyError("myColumn");

      expect(error.message).toBe('Invalid column key "myColumn".');
      expect(error.columnKey).toBe("myColumn");
      expect(error.code).toBe(DataTableErrorCode.INVALID_COLUMN_KEY);
    });

    it("should create error with column key and reason", () => {
      const error = new InvalidColumnKeyError("myColumn", "cannot contain spaces");

      expect(error.message).toBe('Invalid column key "myColumn": cannot contain spaces');
      expect(error.columnKey).toBe("myColumn");
    });

    it("should set correct error name", () => {
      const error = new InvalidColumnKeyError("test");

      expect(error.name).toBe("InvalidColumnKeyError");
    });

    it("should include context with columnKey and reason", () => {
      const error = new InvalidColumnKeyError("col", "empty key not allowed");

      expect(error.context).toEqual({ columnKey: "col", reason: "empty key not allowed" });
    });
  });

  describe("edge cases", () => {
    it("should handle empty column key", () => {
      const error = new InvalidColumnKeyError("");

      expect(error.message).toBe('Invalid column key "".');
      expect(error.columnKey).toBe("");
    });

    it("should handle special characters in column key", () => {
      const error = new InvalidColumnKeyError("column.with.dots");

      expect(error.columnKey).toBe("column.with.dots");
    });

    it("should handle empty reason (treated as no reason)", () => {
      const error = new InvalidColumnKeyError("col", "");

      // Empty string is falsy, so treated as no reason provided
      expect(error.message).toBe('Invalid column key "col".');
    });
  });

  describe("inheritance", () => {
    it("should be instance of Error", () => {
      const error = new InvalidColumnKeyError("test");

      expect(error).toBeInstanceOf(Error);
    });

    it("should have stack trace", () => {
      const error = new InvalidColumnKeyError("test");

      expect(error.stack).toBeDefined();
    });
  });
});

// ─── DuplicateColumnKeyError TESTS ──────────────────────────────────────────

describe("DuplicateColumnKeyError", () => {
  describe("construction", () => {
    it("should create error with duplicate key", () => {
      const error = new DuplicateColumnKeyError("name");

      expect(error.message).toBe('Duplicate column key "name". Each column must have a unique key.');
      expect(error.duplicateKey).toBe("name");
      expect(error.code).toBe(DataTableErrorCode.DUPLICATE_COLUMN_KEY);
    });

    it("should set correct error name", () => {
      const error = new DuplicateColumnKeyError("id");

      expect(error.name).toBe("DuplicateColumnKeyError");
    });

    it("should include context with duplicate key", () => {
      const error = new DuplicateColumnKeyError("status");

      expect(error.context).toEqual({ duplicateKey: "status" });
    });
  });

  describe("different key types", () => {
    it("should handle numeric string keys", () => {
      const error = new DuplicateColumnKeyError("123");

      expect(error.duplicateKey).toBe("123");
      expect(error.message).toContain('"123"');
    });

    it("should handle empty string key", () => {
      const error = new DuplicateColumnKeyError("");

      expect(error.duplicateKey).toBe("");
    });

    it("should handle key with spaces", () => {
      const error = new DuplicateColumnKeyError("column name");

      expect(error.duplicateKey).toBe("column name");
    });
  });
});

// ─── MissingColumnAccessorError TESTS ───────────────────────────────────────

describe("MissingColumnAccessorError", () => {
  describe("construction", () => {
    it("should create error with column key", () => {
      const error = new MissingColumnAccessorError("customColumn");

      expect(error.message).toBe(
        'Column "customColumn" must have either an accessor function or a key that matches a data property.'
      );
      expect(error.columnKey).toBe("customColumn");
      expect(error.code).toBe(DataTableErrorCode.MISSING_COLUMN_ACCESSOR);
    });

    it("should set correct error name", () => {
      const error = new MissingColumnAccessorError("test");

      expect(error.name).toBe("MissingColumnAccessorError");
    });

    it("should include context with column key", () => {
      const error = new MissingColumnAccessorError("computedField");

      expect(error.context).toEqual({ columnKey: "computedField" });
    });
  });

  describe("message clarity", () => {
    it("should provide actionable message", () => {
      const error = new MissingColumnAccessorError("revenue");

      // Message should explain the solution
      expect(error.message).toContain("accessor function");
      expect(error.message).toContain("key that matches");
    });
  });
});

// ─── ERROR CODE VERIFICATION ────────────────────────────────────────────────

describe("column error codes", () => {
  it("should use unique error codes for each error type", () => {
    const invalidKey = new InvalidColumnKeyError("a");
    const duplicateKey = new DuplicateColumnKeyError("b");
    const missingAccessor = new MissingColumnAccessorError("c");

    expect(invalidKey.code).not.toBe(duplicateKey.code);
    expect(invalidKey.code).not.toBe(missingAccessor.code);
    expect(duplicateKey.code).not.toBe(missingAccessor.code);
  });

  it("should all be column-related error codes", () => {
    const invalidKey = new InvalidColumnKeyError("a");
    const duplicateKey = new DuplicateColumnKeyError("b");
    const missingAccessor = new MissingColumnAccessorError("c");

    expect(invalidKey.code).toBe(DataTableErrorCode.INVALID_COLUMN_KEY);
    expect(duplicateKey.code).toBe(DataTableErrorCode.DUPLICATE_COLUMN_KEY);
    expect(missingAccessor.code).toBe(DataTableErrorCode.MISSING_COLUMN_ACCESSOR);
  });
});
