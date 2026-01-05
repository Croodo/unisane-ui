import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getNestedValue, getNestedValueSafe, setNestedValue } from "../../utils/get-nested-value";

// ─── TESTS: getNestedValue ─────────────────────────────────────────────────────

describe("getNestedValue", () => {
  describe("basic functionality", () => {
    it("should get top-level property", () => {
      const obj = { name: "John", age: 30 };
      expect(getNestedValue(obj, "name")).toBe("John");
      expect(getNestedValue(obj, "age")).toBe(30);
    });

    it("should get nested property", () => {
      const obj = { user: { name: "John" } };
      expect(getNestedValue(obj, "user.name")).toBe("John");
    });

    it("should get deeply nested property", () => {
      const obj = { level1: { level2: { level3: { value: "deep" } } } };
      expect(getNestedValue(obj, "level1.level2.level3.value")).toBe("deep");
    });

    it("should get array element by index", () => {
      const obj = { items: ["a", "b", "c"] };
      expect(getNestedValue(obj, "items.0")).toBe("a");
      expect(getNestedValue(obj, "items.2")).toBe("c");
    });

    it("should get nested property in array element", () => {
      const obj = { users: [{ name: "Alice" }, { name: "Bob" }] };
      expect(getNestedValue(obj, "users.0.name")).toBe("Alice");
      expect(getNestedValue(obj, "users.1.name")).toBe("Bob");
    });

    it("should return undefined for non-existent path", () => {
      const obj = { name: "John" };
      expect(getNestedValue(obj, "email")).toBeUndefined();
      expect(getNestedValue(obj, "user.name")).toBeUndefined();
    });
  });

  describe("default values", () => {
    it("should return default value when path not found", () => {
      const obj = { name: "John" };
      expect(getNestedValue(obj, "email", { defaultValue: "N/A" })).toBe("N/A");
    });

    it("should return default value when intermediate path is undefined", () => {
      const obj = { user: undefined } as { user: { name: string } | undefined };
      expect(getNestedValue(obj, "user.name", { defaultValue: "Unknown" })).toBe("Unknown");
    });

    it("should return default value when intermediate path is null", () => {
      const obj = { user: null } as { user: { name: string } | null };
      expect(getNestedValue(obj, "user.name", { defaultValue: "Default" })).toBe("Default");
    });

    it("should return default value for null input object", () => {
      expect(getNestedValue(null as unknown as object, "path", { defaultValue: "default" })).toBe("default");
    });

    it("should return default value for undefined input object", () => {
      expect(getNestedValue(undefined as unknown as object, "path", { defaultValue: "default" })).toBe("default");
    });

    it("should return default value for non-object input", () => {
      expect(getNestedValue("string" as unknown as object, "path", { defaultValue: "default" })).toBe("default");
      expect(getNestedValue(123 as unknown as object, "path", { defaultValue: "default" })).toBe("default");
    });
  });

  describe("empty and edge cases", () => {
    it("should return default value for empty path", () => {
      const obj = { name: "John" };
      expect(getNestedValue(obj, "")).toBeUndefined();
      expect(getNestedValue(obj, "", { defaultValue: "empty" })).toBe("empty");
    });

    it("should handle path with only separator", () => {
      const obj = { name: "John" };
      expect(getNestedValue(obj, ".")).toBeUndefined();
    });

    it("should return actual null values", () => {
      const obj = { value: null };
      expect(getNestedValue(obj, "value")).toBe(null);
    });

    it("should return actual false values", () => {
      const obj = { active: false };
      expect(getNestedValue(obj, "active")).toBe(false);
    });

    it("should return actual 0 values", () => {
      const obj = { count: 0 };
      expect(getNestedValue(obj, "count")).toBe(0);
    });

    it("should return actual empty string values", () => {
      const obj = { text: "" };
      expect(getNestedValue(obj, "text")).toBe("");
    });
  });

  describe("custom separator", () => {
    it("should use custom separator", () => {
      const obj = { user: { name: "John" } };
      expect(getNestedValue(obj, "user/name", { separator: "/" })).toBe("John");
    });

    it("should handle different separators", () => {
      const obj = { user: { profile: { name: "John" } } };
      expect(getNestedValue(obj, "user->profile->name", { separator: "->" })).toBe("John");
    });
  });

  describe("warning behavior", () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      process.env.NODE_ENV = "development";
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it("should warn when path not found and warnOnMissing is true", () => {
      const obj = { name: "John" };
      getNestedValue(obj, "user.email", { warnOnMissing: true });
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should warn for null object when warnOnMissing is true", () => {
      getNestedValue(null as unknown as object, "path", { warnOnMissing: true });
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should warn for non-object when warnOnMissing is true", () => {
      getNestedValue("string" as unknown as object, "path", { warnOnMissing: true });
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should warn when intermediate value is not an object", () => {
      const obj = { user: "not-an-object" };
      getNestedValue(obj, "user.name", { warnOnMissing: true });
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should not warn when warnOnMissing is false", () => {
      const obj = { name: "John" };
      getNestedValue(obj, "user.email", { warnOnMissing: false });
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it("should not warn by default", () => {
      const obj = { name: "John" };
      getNestedValue(obj, "user.email");
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe("special object types", () => {
    it("should work with Date objects", () => {
      const obj = { created: new Date("2024-01-01") };
      const result = getNestedValue(obj, "created");
      expect(result).toBeInstanceOf(Date);
    });

    it("should work with arrays as values", () => {
      const obj = { items: [1, 2, 3] };
      const result = getNestedValue(obj, "items");
      expect(result).toEqual([1, 2, 3]);
    });

    it("should work with Map objects", () => {
      const map = new Map([["key", "value"]]);
      const obj = { data: map };
      const result = getNestedValue(obj, "data");
      expect(result).toBe(map);
    });
  });
});

// ─── TESTS: getNestedValueSafe ─────────────────────────────────────────────────

describe("getNestedValueSafe", () => {
  it("should get property with type safety", () => {
    const obj = { name: "John", age: 30 };
    expect(getNestedValueSafe(obj, "name")).toBe("John");
    expect(getNestedValueSafe(obj, "age")).toBe(30);
  });

  it("should return undefined for missing keys", () => {
    const obj = { name: "John" } as { name: string; email?: string };
    expect(getNestedValueSafe(obj, "email")).toBeUndefined();
  });
});

// ─── TESTS: setNestedValue ─────────────────────────────────────────────────────

describe("setNestedValue", () => {
  describe("basic functionality", () => {
    it("should set top-level property", () => {
      const obj = { name: "John" };
      const result = setNestedValue(obj, "name", "Jane");
      expect(result.name).toBe("Jane");
    });

    it("should set nested property", () => {
      const obj = { user: { name: "John" } };
      const result = setNestedValue(obj, "user.name", "Jane");
      expect(result.user.name).toBe("Jane");
    });

    it("should set deeply nested property", () => {
      const obj = { level1: { level2: { level3: { value: "old" } } } };
      const result = setNestedValue(obj, "level1.level2.level3.value", "new");
      expect(result.level1.level2.level3.value).toBe("new");
    });

    it("should add new property", () => {
      const obj = { name: "John" };
      const result = setNestedValue(obj, "age", 30);
      expect(result.age).toBe(30);
    });

    it("should add new nested property", () => {
      const obj = { user: { name: "John" } };
      const result = setNestedValue(obj, "user.email", "john@example.com");
      expect(result.user.email).toBe("john@example.com");
    });
  });

  describe("immutability", () => {
    it("should return new object (not mutate original)", () => {
      const obj = { name: "John" };
      const result = setNestedValue(obj, "name", "Jane");
      expect(result).not.toBe(obj);
      expect(obj.name).toBe("John");
    });

    it("should create new nested objects along path", () => {
      const obj = { user: { name: "John" } };
      const result = setNestedValue(obj, "user.name", "Jane");
      expect(result.user).not.toBe(obj.user);
    });

    it("should preserve unaffected properties", () => {
      const obj = { user: { name: "John", age: 30 } };
      const result = setNestedValue(obj, "user.name", "Jane");
      expect(result.user.age).toBe(30);
    });
  });

  describe("creating paths", () => {
    it("should create intermediate objects if they do not exist", () => {
      const obj = {} as Record<string, unknown>;
      const result = setNestedValue(obj, "user.profile.name", "John");
      expect(result.user).toBeDefined();
      expect((result.user as { profile: { name: string } }).profile.name).toBe("John");
    });

    it("should handle setting value where path is not an object", () => {
      const obj = { user: "string-value" } as Record<string, unknown>;
      const result = setNestedValue(obj, "user.name", "John");
      // Should create an object with the name property
      expect((result.user as { name: string }).name).toBe("John");
    });
  });

  describe("edge cases", () => {
    it("should handle single-level key efficiently (fast path)", () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = setNestedValue(obj, "b", 20);
      expect(result.b).toBe(20);
      expect(result.a).toBe(1);
      expect(result.c).toBe(3);
    });

    it("should set null values", () => {
      const obj = { value: "something" };
      const result = setNestedValue(obj, "value", null);
      expect(result.value).toBe(null);
    });

    it("should set undefined values", () => {
      const obj = { value: "something" };
      const result = setNestedValue(obj, "value", undefined);
      expect(result.value).toBeUndefined();
    });

    it("should set object values", () => {
      const obj = { data: null } as { data: { name: string } | null };
      const newValue = { name: "John" };
      const result = setNestedValue(obj, "data", newValue);
      expect(result.data).toEqual(newValue);
    });

    it("should set array values", () => {
      const obj = { items: [] as string[] };
      const result = setNestedValue(obj, "items", ["a", "b", "c"]);
      expect(result.items).toEqual(["a", "b", "c"]);
    });
  });

  describe("type handling", () => {
    it("should handle setting to different type", () => {
      const obj = { count: 5 } as { count: number | string };
      const result = setNestedValue(obj, "count", "five");
      expect(result.count).toBe("five");
    });

    it("should handle boolean values", () => {
      const obj = { active: true };
      const result = setNestedValue(obj, "active", false);
      expect(result.active).toBe(false);
    });
  });
});
