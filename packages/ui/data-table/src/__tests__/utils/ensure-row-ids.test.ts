import { describe, it, expect } from "vitest";
import {
  validateRowIds,
  findDuplicateRowIds,
  ensureRowIds,
} from "../../utils/ensure-row-ids";
import { DuplicateRowIdError } from "../../errors/data-errors";

// ─── validateRowIds TESTS ───────────────────────────────────────────────────

describe("validateRowIds", () => {
  describe("valid data", () => {
    it("should not throw for empty array", () => {
      expect(() => validateRowIds([])).not.toThrow();
    });

    it("should not throw for array with unique IDs", () => {
      const data = [
        { id: "1", name: "A" },
        { id: "2", name: "B" },
        { id: "3", name: "C" },
      ];

      expect(() => validateRowIds(data)).not.toThrow();
    });

    it("should not throw for single item", () => {
      const data = [{ id: "only-one", value: 42 }];

      expect(() => validateRowIds(data)).not.toThrow();
    });
  });

  describe("duplicate detection", () => {
    it("should throw DuplicateRowIdError for duplicate IDs", () => {
      const data = [
        { id: "1", name: "A" },
        { id: "1", name: "B" }, // Duplicate
      ];

      expect(() => validateRowIds(data)).toThrow(DuplicateRowIdError);
    });

    it("should include duplicate ID in error", () => {
      const data = [
        { id: "dup", name: "A" },
        { id: "dup", name: "B" },
      ];

      try {
        validateRowIds(data);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(DuplicateRowIdError);
        expect((error as DuplicateRowIdError).duplicateIds).toContain("dup");
      }
    });

    it("should detect multiple duplicates", () => {
      const data = [
        { id: "a", name: "1" },
        { id: "a", name: "2" }, // dup
        { id: "b", name: "3" },
        { id: "b", name: "4" }, // dup
      ];

      try {
        validateRowIds(data);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(DuplicateRowIdError);
        const dupError = error as DuplicateRowIdError;
        expect(dupError.duplicateIds).toContain("a");
        expect(dupError.duplicateIds).toContain("b");
      }
    });

    it("should detect duplicates at any position", () => {
      const data = [
        { id: "1", name: "A" },
        { id: "2", name: "B" },
        { id: "3", name: "C" },
        { id: "1", name: "D" }, // Duplicate at end
      ];

      expect(() => validateRowIds(data)).toThrow(DuplicateRowIdError);
    });
  });
});

// ─── findDuplicateRowIds TESTS ──────────────────────────────────────────────

describe("findDuplicateRowIds", () => {
  describe("no duplicates", () => {
    it("should return empty array for empty data", () => {
      expect(findDuplicateRowIds([])).toEqual([]);
    });

    it("should return empty array for unique IDs", () => {
      const data = [
        { id: "1" },
        { id: "2" },
        { id: "3" },
      ];

      expect(findDuplicateRowIds(data)).toEqual([]);
    });
  });

  describe("with duplicates", () => {
    it("should return array of duplicate IDs", () => {
      const data = [
        { id: "1" },
        { id: "1" }, // dup
        { id: "2" },
      ];

      expect(findDuplicateRowIds(data)).toEqual(["1"]);
    });

    it("should return each duplicate ID only once", () => {
      const data = [
        { id: "1" },
        { id: "1" }, // dup 1
        { id: "1" }, // dup 2
        { id: "1" }, // dup 3
      ];

      const duplicates = findDuplicateRowIds(data);
      expect(duplicates).toEqual(["1"]);
      expect(duplicates).toHaveLength(1);
    });

    it("should return all duplicate IDs", () => {
      const data = [
        { id: "a" },
        { id: "a" },
        { id: "b" },
        { id: "b" },
        { id: "c" },
      ];

      const duplicates = findDuplicateRowIds(data);
      expect(duplicates).toHaveLength(2);
      expect(duplicates).toContain("a");
      expect(duplicates).toContain("b");
    });
  });
});

// ─── ensureRowIds TESTS ─────────────────────────────────────────────────────

describe("ensureRowIds", () => {
  describe("rows with existing id", () => {
    it("should preserve existing id field", () => {
      const data = [
        { id: "existing-1", name: "A" },
        { id: "existing-2", name: "B" },
      ];

      const result = ensureRowIds(data);

      expect(result[0]?.id).toBe("existing-1");
      expect(result[1]?.id).toBe("existing-2");
    });

    it("should convert numeric id to string", () => {
      const data = [
        { id: 123, name: "A" },
        { id: 456, name: "B" },
      ];

      const result = ensureRowIds(data as unknown as Array<Record<string, unknown>>);

      expect(result[0]?.id).toBe("123");
      expect(result[1]?.id).toBe("456");
    });

    it("should preserve other properties", () => {
      const data = [
        { id: "1", name: "John", age: 30, active: true },
      ];

      const result = ensureRowIds(data);

      expect(result[0]).toEqual({
        id: "1",
        name: "John",
        age: 30,
        active: true,
      });
    });
  });

  describe("rows without id", () => {
    it("should use _id field if present", () => {
      const data = [
        { _id: "mongo-id-123", name: "A" },
      ];

      const result = ensureRowIds(data);

      expect(result[0]?.id).toBe("mongo-id-123");
    });

    it("should use key field if present", () => {
      const data = [
        { key: "react-key-1", name: "A" },
      ];

      const result = ensureRowIds(data);

      expect(result[0]?.id).toBe("react-key-1");
    });

    it("should use uid field if present", () => {
      const data = [
        { uid: "user-id-abc", name: "A" },
      ];

      const result = ensureRowIds(data);

      expect(result[0]?.id).toBe("user-id-abc");
    });

    it("should use uuid field if present", () => {
      const data = [
        { uuid: "550e8400-e29b-41d4-a716-446655440000", name: "A" },
      ];

      const result = ensureRowIds(data);

      expect(result[0]?.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should fallback to index-based id", () => {
      const data = [
        { name: "First" },
        { name: "Second" },
        { name: "Third" },
      ];

      const result = ensureRowIds(data);

      expect(result[0]?.id).toBe("row-0");
      expect(result[1]?.id).toBe("row-1");
      expect(result[2]?.id).toBe("row-2");
    });

    it("should prioritize id field alternatives in order", () => {
      // Has both _id and key, should use _id (first in priority)
      const data = [
        { _id: "mongo", key: "react", uid: "user", name: "A" },
      ];

      const result = ensureRowIds(data);

      expect(result[0]?.id).toBe("mongo");
    });
  });

  describe("mixed data", () => {
    it("should handle mix of existing and missing ids", () => {
      const data = [
        { id: "has-id", name: "A" },
        { name: "B" }, // No id, will get row-1
        { _id: "has-mongo-id", name: "C" },
      ];

      const result = ensureRowIds(data);

      expect(result[0]?.id).toBe("has-id");
      expect(result[1]?.id).toBe("row-1");
      expect(result[2]?.id).toBe("has-mongo-id");
    });
  });

  describe("validation option", () => {
    it("should not validate by default", () => {
      const data = [
        { id: "dup" },
        { id: "dup" }, // Duplicate - should not throw without validation
      ];

      expect(() => ensureRowIds(data)).not.toThrow();
    });

    it("should validate when validateUnique is true", () => {
      const data = [
        { id: "dup" },
        { id: "dup" },
      ];

      expect(() => ensureRowIds(data, true)).toThrow(DuplicateRowIdError);
    });

    it("should not throw when valid and validateUnique is true", () => {
      const data = [
        { id: "1" },
        { id: "2" },
      ];

      expect(() => ensureRowIds(data, true)).not.toThrow();
    });

    it("should detect duplicates created by index fallback", () => {
      // This can happen if user explicitly uses the fallback format
      const data = [
        { id: "row-1" }, // Explicitly using what would be the second row's fallback
        { name: "No ID" }, // Will get row-1 (index 1)
      ];

      expect(() => ensureRowIds(data, true)).toThrow(DuplicateRowIdError);
    });
  });

  describe("edge cases", () => {
    it("should handle empty array", () => {
      expect(ensureRowIds([])).toEqual([]);
    });

    it("should handle null id values", () => {
      const data = [
        { id: null, name: "A" },
      ];

      const result = ensureRowIds(data as unknown as Array<Record<string, unknown>>);

      expect(result[0]?.id).toBe("row-0"); // Fallback since null
    });

    it("should handle undefined id values", () => {
      const data = [
        { id: undefined, name: "A" },
      ];

      const result = ensureRowIds(data as unknown as Array<Record<string, unknown>>);

      expect(result[0]?.id).toBe("row-0"); // Fallback since undefined
    });

    it("should convert boolean id to string", () => {
      const data = [
        { id: true, name: "A" },
      ];

      const result = ensureRowIds(data as unknown as Array<Record<string, unknown>>);

      expect(result[0]?.id).toBe("true");
    });

    it("should handle large datasets", () => {
      const data = Array.from({ length: 1000 }, (_, i) => ({
        name: `Item ${i}`,
      }));

      const result = ensureRowIds(data);

      expect(result).toHaveLength(1000);
      expect(result[0]?.id).toBe("row-0");
      expect(result[999]?.id).toBe("row-999");
    });
  });
});
