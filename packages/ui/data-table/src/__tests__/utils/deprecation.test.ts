import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  warnDeprecatedProp,
  resolveDeprecatedProp,
  clearDeprecationWarnings,
} from "../../utils/deprecation";

// ─── TEST SETUP ──────────────────────────────────────────────────────────────

let consoleWarn: ReturnType<typeof vi.spyOn>;
let originalEnv: string | undefined;

beforeEach(() => {
  consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
  originalEnv = process.env.NODE_ENV;
  clearDeprecationWarnings();
});

afterEach(() => {
  consoleWarn.mockRestore();
  process.env.NODE_ENV = originalEnv;
});

// ─── warnDeprecatedProp TESTS ────────────────────────────────────────────────

describe("warnDeprecatedProp", () => {
  it("should warn in development mode", () => {
    process.env.NODE_ENV = "development";
    warnDeprecatedProp("oldProp", "newProp");

    expect(consoleWarn).toHaveBeenCalledTimes(1);
    const message = consoleWarn.mock.calls[0]![0] as string;
    expect(message).toContain("oldProp");
    expect(message).toContain("newProp");
    expect(message).toContain("deprecated");
  });

  it("should not warn in production mode", () => {
    process.env.NODE_ENV = "production";
    warnDeprecatedProp("oldProp", "newProp");

    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it("should only warn once per prop", () => {
    process.env.NODE_ENV = "development";
    warnDeprecatedProp("oldProp", "newProp");
    warnDeprecatedProp("oldProp", "newProp");
    warnDeprecatedProp("oldProp", "newProp");

    expect(consoleWarn).toHaveBeenCalledTimes(1);
  });

  it("should warn separately for different props", () => {
    process.env.NODE_ENV = "development";
    warnDeprecatedProp("oldProp1", "newProp1");
    warnDeprecatedProp("oldProp2", "newProp2");

    expect(consoleWarn).toHaveBeenCalledTimes(2);
  });

  it("should include component name in warning", () => {
    process.env.NODE_ENV = "development";
    warnDeprecatedProp("oldProp", "newProp", "CustomComponent");

    const message = consoleWarn.mock.calls[0]![0] as string;
    expect(message).toContain("[CustomComponent]");
  });

  it("should use DataTable as default component name", () => {
    process.env.NODE_ENV = "development";
    warnDeprecatedProp("oldProp", "newProp");

    const message = consoleWarn.mock.calls[0]![0] as string;
    expect(message).toContain("[DataTable]");
  });

  it("should warn separately for same prop in different components", () => {
    process.env.NODE_ENV = "development";
    warnDeprecatedProp("prop", "newProp", "Component1");
    warnDeprecatedProp("prop", "newProp", "Component2");

    expect(consoleWarn).toHaveBeenCalledTimes(2);
  });
});

// ─── resolveDeprecatedProp TESTS ─────────────────────────────────────────────

describe("resolveDeprecatedProp", () => {
  it("should return new value when provided", () => {
    process.env.NODE_ENV = "development";
    const result = resolveDeprecatedProp("newValue", "oldValue", "old", "new", "default");

    expect(result).toBe("newValue");
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it("should return old value with warning when new value is undefined", () => {
    process.env.NODE_ENV = "development";
    const result = resolveDeprecatedProp(undefined, "oldValue", "old", "new", "default");

    expect(result).toBe("oldValue");
    expect(consoleWarn).toHaveBeenCalledTimes(1);
  });

  it("should return default value when both are undefined", () => {
    process.env.NODE_ENV = "development";
    const result = resolveDeprecatedProp(undefined, undefined, "old", "new", "default");

    expect(result).toBe("default");
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it("should prefer new value over old value", () => {
    process.env.NODE_ENV = "development";
    const result = resolveDeprecatedProp("new", "old", "oldName", "newName", "default");

    expect(result).toBe("new");
  });

  it("should work with numeric values", () => {
    process.env.NODE_ENV = "development";
    const result = resolveDeprecatedProp<number>(undefined, 42, "old", "new", 0);

    expect(result).toBe(42);
    expect(consoleWarn).toHaveBeenCalled();
  });

  it("should work with boolean values", () => {
    process.env.NODE_ENV = "development";
    const result = resolveDeprecatedProp<boolean>(undefined, true, "old", "new", false);

    expect(result).toBe(true);
    expect(consoleWarn).toHaveBeenCalled();
  });

  it("should work with object values", () => {
    process.env.NODE_ENV = "development";
    const oldObj = { key: "old" };
    const defaultObj = { key: "default" };
    const result = resolveDeprecatedProp<{ key: string }>(undefined, oldObj, "old", "new", defaultObj);

    expect(result).toBe(oldObj);
  });

  it("should work with array values", () => {
    process.env.NODE_ENV = "development";
    const oldArr = [1, 2, 3];
    const defaultArr: number[] = [];
    const result = resolveDeprecatedProp<number[]>(undefined, oldArr, "old", "new", defaultArr);

    expect(result).toBe(oldArr);
  });

  it("should handle null as a valid value", () => {
    process.env.NODE_ENV = "development";
    const result = resolveDeprecatedProp<string | null>(null, "old", "old", "new", "default");

    expect(result).toBeNull();
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it("should handle empty string as a valid value", () => {
    process.env.NODE_ENV = "development";
    const result = resolveDeprecatedProp("", "old", "old", "new", "default");

    expect(result).toBe("");
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it("should handle zero as a valid value", () => {
    process.env.NODE_ENV = "development";
    const result = resolveDeprecatedProp<number>(0, 42, "old", "new", 100);

    expect(result).toBe(0);
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it("should handle false as a valid value", () => {
    process.env.NODE_ENV = "development";
    const result = resolveDeprecatedProp<boolean>(false, true, "old", "new", true);

    expect(result).toBe(false);
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it("should use custom component name in warning", () => {
    process.env.NODE_ENV = "development";
    resolveDeprecatedProp(undefined, "oldValue", "old", "new", "default", "MyComponent");

    const message = consoleWarn.mock.calls[0]![0] as string;
    expect(message).toContain("[MyComponent]");
  });

  it("should only warn once even when called multiple times", () => {
    process.env.NODE_ENV = "development";
    resolveDeprecatedProp(undefined, "old", "oldProp", "newProp", "default");
    resolveDeprecatedProp(undefined, "old", "oldProp", "newProp", "default");
    resolveDeprecatedProp(undefined, "old", "oldProp", "newProp", "default");

    expect(consoleWarn).toHaveBeenCalledTimes(1);
  });
});

// ─── clearDeprecationWarnings TESTS ──────────────────────────────────────────

describe("clearDeprecationWarnings", () => {
  it("should allow warnings to fire again after clearing", () => {
    process.env.NODE_ENV = "development";

    warnDeprecatedProp("oldProp", "newProp");
    expect(consoleWarn).toHaveBeenCalledTimes(1);

    warnDeprecatedProp("oldProp", "newProp");
    expect(consoleWarn).toHaveBeenCalledTimes(1);

    clearDeprecationWarnings();

    warnDeprecatedProp("oldProp", "newProp");
    expect(consoleWarn).toHaveBeenCalledTimes(2);
  });

  it("should clear all warned props", () => {
    process.env.NODE_ENV = "development";

    warnDeprecatedProp("prop1", "new1");
    warnDeprecatedProp("prop2", "new2");
    warnDeprecatedProp("prop3", "new3");
    expect(consoleWarn).toHaveBeenCalledTimes(3);

    clearDeprecationWarnings();

    warnDeprecatedProp("prop1", "new1");
    warnDeprecatedProp("prop2", "new2");
    warnDeprecatedProp("prop3", "new3");
    expect(consoleWarn).toHaveBeenCalledTimes(6);
  });
});

// ─── EDGE CASES ──────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("should handle undefined NODE_ENV", () => {
    delete (process.env as Record<string, string | undefined>).NODE_ENV;

    // Should not throw
    expect(() => {
      warnDeprecatedProp("old", "new");
    }).not.toThrow();
  });

  it("should handle empty prop names", () => {
    process.env.NODE_ENV = "development";
    warnDeprecatedProp("", "newProp");

    expect(consoleWarn).toHaveBeenCalledTimes(1);
  });

  it("should handle special characters in prop names", () => {
    process.env.NODE_ENV = "development";
    warnDeprecatedProp("old-prop", "new_prop");

    expect(consoleWarn).toHaveBeenCalledTimes(1);
    const message = consoleWarn.mock.calls[0]![0] as string;
    expect(message).toContain("old-prop");
    expect(message).toContain("new_prop");
  });

  it("should handle very long prop names", () => {
    process.env.NODE_ENV = "development";
    const longName = "a".repeat(1000);
    warnDeprecatedProp(longName, "new");

    expect(consoleWarn).toHaveBeenCalledTimes(1);
  });

  it("should handle unicode in prop names", () => {
    process.env.NODE_ENV = "development";
    warnDeprecatedProp("oldProp\u{1F600}", "newProp");

    expect(consoleWarn).toHaveBeenCalledTimes(1);
  });
});

// ─── INTEGRATION TESTS ───────────────────────────────────────────────────────

describe("integration", () => {
  it("should work in a typical component props scenario", () => {
    process.env.NODE_ENV = "development";

    interface Props {
      newName?: string;
      /** @deprecated Use newName instead */
      oldName?: string;
    }

    const processProps = (props: Props) => {
      return resolveDeprecatedProp(
        props.newName,
        props.oldName,
        "oldName",
        "newName",
        "default"
      );
    };

    // Using new prop
    expect(processProps({ newName: "value" })).toBe("value");
    expect(consoleWarn).not.toHaveBeenCalled();

    // Using old prop
    expect(processProps({ oldName: "oldValue" })).toBe("oldValue");
    expect(consoleWarn).toHaveBeenCalledTimes(1);

    // Using both (new takes precedence, no additional warning since old was already warned)
    expect(processProps({ newName: "new", oldName: "old" })).toBe("new");
    // No additional warning because new value is provided (which takes precedence)
    expect(consoleWarn).toHaveBeenCalledTimes(1);

    // Using neither (default)
    expect(processProps({})).toBe("default");
  });

  it("should handle multiple deprecated props in same component", () => {
    process.env.NODE_ENV = "development";

    interface Props {
      newProp1?: string;
      /** @deprecated */
      oldProp1?: string;
      newProp2?: number;
      /** @deprecated */
      oldProp2?: number;
    }

    const processProps = (props: Props) => ({
      prop1: resolveDeprecatedProp(props.newProp1, props.oldProp1, "oldProp1", "newProp1", ""),
      prop2: resolveDeprecatedProp(props.newProp2, props.oldProp2, "oldProp2", "newProp2", 0),
    });

    const result = processProps({ oldProp1: "old1", oldProp2: 42 });

    expect(result.prop1).toBe("old1");
    expect(result.prop2).toBe(42);
    expect(consoleWarn).toHaveBeenCalledTimes(2);
  });
});
