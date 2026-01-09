import { describe, it, expect } from "vitest";
import {
  InvalidConfigError,
  MissingRequiredPropError,
  IncompatibleOptionsError,
} from "../../errors/config-errors";
import { DataTableErrorCode } from "../../errors/base";

// ─── InvalidConfigError TESTS ───────────────────────────────────────────────

describe("InvalidConfigError", () => {
  describe("construction", () => {
    it("should create error with message only", () => {
      const error = new InvalidConfigError("Invalid pagination settings");

      expect(error.message).toBe("Invalid pagination settings");
      expect(error.code).toBe(DataTableErrorCode.INVALID_CONFIG);
      expect(error.configKey).toBeUndefined();
    });

    it("should create error with message and config key", () => {
      const error = new InvalidConfigError("Page size must be positive", "pageSize");

      expect(error.message).toBe("Page size must be positive");
      expect(error.configKey).toBe("pageSize");
    });

    it("should set correct error name", () => {
      const error = new InvalidConfigError("Test");

      expect(error.name).toBe("InvalidConfigError");
    });

    it("should include context with config key", () => {
      const error = new InvalidConfigError("Invalid value", "sortDirection");

      expect(error.context).toEqual({ configKey: "sortDirection" });
    });
  });

  describe("edge cases", () => {
    it("should handle empty message", () => {
      const error = new InvalidConfigError("");

      expect(error.message).toBe("");
    });

    it("should handle empty config key", () => {
      const error = new InvalidConfigError("Error", "");

      expect(error.configKey).toBe("");
    });

    it("should handle config key with dots (nested path)", () => {
      const error = new InvalidConfigError("Invalid", "pagination.pageSize");

      expect(error.configKey).toBe("pagination.pageSize");
    });
  });
});

// ─── MissingRequiredPropError TESTS ─────────────────────────────────────────

describe("MissingRequiredPropError", () => {
  describe("construction", () => {
    it("should create error with prop name and default component", () => {
      const error = new MissingRequiredPropError("data");

      expect(error.message).toBe('DataTable requires the "data" prop.');
      expect(error.propName).toBe("data");
      expect(error.code).toBe(DataTableErrorCode.MISSING_REQUIRED_PROP);
    });

    it("should create error with custom component name", () => {
      const error = new MissingRequiredPropError("columns", "DataTableHeader");

      expect(error.message).toBe('DataTableHeader requires the "columns" prop.');
      expect(error.propName).toBe("columns");
    });

    it("should set correct error name", () => {
      const error = new MissingRequiredPropError("items");

      expect(error.name).toBe("MissingRequiredPropError");
    });

    it("should include context with prop and component names", () => {
      const error = new MissingRequiredPropError("rows", "TableBody");

      expect(error.context).toEqual({ propName: "rows", componentName: "TableBody" });
    });
  });

  describe("common props", () => {
    it("should handle 'data' prop", () => {
      const error = new MissingRequiredPropError("data");

      expect(error.message).toContain("data");
    });

    it("should handle 'columns' prop", () => {
      const error = new MissingRequiredPropError("columns");

      expect(error.message).toContain("columns");
    });

    it("should handle 'children' prop", () => {
      const error = new MissingRequiredPropError("children", "Provider");

      expect(error.message).toBe('Provider requires the "children" prop.');
    });
  });

  describe("edge cases", () => {
    it("should handle empty prop name", () => {
      const error = new MissingRequiredPropError("");

      expect(error.message).toBe('DataTable requires the "" prop.');
      expect(error.propName).toBe("");
    });

    it("should handle empty component name", () => {
      const error = new MissingRequiredPropError("data", "");

      expect(error.message).toBe(' requires the "data" prop.');
    });
  });
});

// ─── IncompatibleOptionsError TESTS ─────────────────────────────────────────

describe("IncompatibleOptionsError", () => {
  describe("construction", () => {
    it("should create error with two options", () => {
      const error = new IncompatibleOptionsError(
        ["virtualization", "grouping"],
        "Cannot use both features together."
      );

      expect(error.message).toBe("Incompatible options: virtualization and grouping. Cannot use both features together.");
      expect(error.options).toEqual(["virtualization", "grouping"]);
      expect(error.code).toBe(DataTableErrorCode.INCOMPATIBLE_OPTIONS);
    });

    it("should create error with multiple options", () => {
      const error = new IncompatibleOptionsError(
        ["optionA", "optionB", "optionC"],
        "Only one can be active."
      );

      expect(error.message).toBe("Incompatible options: optionA and optionB and optionC. Only one can be active.");
    });

    it("should set correct error name", () => {
      const error = new IncompatibleOptionsError(["a", "b"], "Test");

      expect(error.name).toBe("IncompatibleOptionsError");
    });

    it("should include context with options and reason", () => {
      const error = new IncompatibleOptionsError(
        ["selection", "readOnly"],
        "Cannot select in read-only mode."
      );

      expect(error.context).toEqual({
        options: ["selection", "readOnly"],
        reason: "Cannot select in read-only mode.",
      });
    });
  });

  describe("message formatting", () => {
    it("should join options with 'and'", () => {
      const error = new IncompatibleOptionsError(
        ["sorting", "fixed"],
        "Fixed tables cannot be sorted."
      );

      expect(error.message).toContain("sorting and fixed");
    });

    it("should append reason after period and space", () => {
      const error = new IncompatibleOptionsError(["a", "b"], "Reason here");

      expect(error.message).toMatch(/\. Reason here$/);
    });
  });

  describe("edge cases", () => {
    it("should handle single option array", () => {
      const error = new IncompatibleOptionsError(["single"], "Cannot use alone");

      expect(error.options).toEqual(["single"]);
      expect(error.message).toContain("single");
    });

    it("should handle empty options array", () => {
      const error = new IncompatibleOptionsError([], "No options");

      expect(error.options).toEqual([]);
      expect(error.message).toBe("Incompatible options: . No options");
    });

    it("should handle empty reason", () => {
      const error = new IncompatibleOptionsError(["a", "b"], "");

      expect(error.message).toBe("Incompatible options: a and b. ");
    });
  });
});

// ─── ERROR CODE VERIFICATION ────────────────────────────────────────────────

describe("config error codes", () => {
  it("should use unique error codes for each error type", () => {
    const invalidConfig = new InvalidConfigError("msg");
    const missingProp = new MissingRequiredPropError("prop");
    const incompatible = new IncompatibleOptionsError(["a", "b"], "reason");

    expect(invalidConfig.code).not.toBe(missingProp.code);
    expect(invalidConfig.code).not.toBe(incompatible.code);
    expect(missingProp.code).not.toBe(incompatible.code);
  });

  it("should all be config-related error codes", () => {
    const invalidConfig = new InvalidConfigError("msg");
    const missingProp = new MissingRequiredPropError("prop");
    const incompatible = new IncompatibleOptionsError(["a", "b"], "reason");

    expect(invalidConfig.code).toBe(DataTableErrorCode.INVALID_CONFIG);
    expect(missingProp.code).toBe(DataTableErrorCode.MISSING_REQUIRED_PROP);
    expect(incompatible.code).toBe(DataTableErrorCode.INCOMPATIBLE_OPTIONS);
  });
});

// ─── REAL WORLD SCENARIOS ───────────────────────────────────────────────────

describe("real world config error scenarios", () => {
  it("should create helpful error for invalid page size", () => {
    const error = new InvalidConfigError(
      "Page size must be a positive number. Received: -5",
      "pageSize"
    );

    expect(error.message).toContain("positive number");
    expect(error.configKey).toBe("pageSize");
  });

  it("should create helpful error for missing data prop", () => {
    const error = new MissingRequiredPropError("data", "DataTable");

    expect(error.message).toContain("data");
    expect(error.message).toContain("DataTable");
  });

  it("should create helpful error for conflicting features", () => {
    const error = new IncompatibleOptionsError(
      ["enableVirtualization", "enableRowSpanning"],
      "Virtualized tables cannot have rows that span multiple cells."
    );

    expect(error.message).toContain("enableVirtualization");
    expect(error.message).toContain("enableRowSpanning");
  });
});
