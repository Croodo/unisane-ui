import { describe, it, expect } from "vitest";
import {
  ContextNotFoundError,
  ProviderMissingError,
} from "../../errors/context-errors";
import { DataTableErrorCode } from "../../errors/base";

// ─── ContextNotFoundError TESTS ─────────────────────────────────────────────

describe("ContextNotFoundError", () => {
  describe("construction", () => {
    it("should create error with hook and provider names", () => {
      const error = new ContextNotFoundError("useDataTable", "DataTableProvider");

      expect(error.message).toBe("useDataTable must be used within a DataTableProvider.");
      expect(error.hookName).toBe("useDataTable");
      expect(error.providerName).toBe("DataTableProvider");
      expect(error.code).toBe(DataTableErrorCode.CONTEXT_NOT_FOUND);
    });

    it("should set correct error name", () => {
      const error = new ContextNotFoundError("useTest", "TestProvider");

      expect(error.name).toBe("ContextNotFoundError");
    });

    it("should include context with hook and provider names", () => {
      const error = new ContextNotFoundError("useFiltering", "FilterProvider");

      expect(error.context).toEqual({
        hookName: "useFiltering",
        providerName: "FilterProvider",
      });
    });
  });

  describe("common hook names", () => {
    it("should handle useDataTableContext", () => {
      const error = new ContextNotFoundError("useDataTableContext", "DataTableProvider");

      expect(error.message).toContain("useDataTableContext");
      expect(error.hookName).toBe("useDataTableContext");
    });

    it("should handle useSelection", () => {
      const error = new ContextNotFoundError("useSelection", "DataTableProvider");

      expect(error.hookName).toBe("useSelection");
    });

    it("should handle useSorting", () => {
      const error = new ContextNotFoundError("useSorting", "DataTableProvider");

      expect(error.hookName).toBe("useSorting");
    });

    it("should handle useFiltering", () => {
      const error = new ContextNotFoundError("useFiltering", "DataTableProvider");

      expect(error.hookName).toBe("useFiltering");
    });
  });

  describe("inheritance", () => {
    it("should be instance of Error", () => {
      const error = new ContextNotFoundError("hook", "provider");

      expect(error).toBeInstanceOf(Error);
    });

    it("should have stack trace", () => {
      const error = new ContextNotFoundError("hook", "provider");

      expect(error.stack).toBeDefined();
    });
  });
});

// ─── ProviderMissingError TESTS ─────────────────────────────────────────────

describe("ProviderMissingError", () => {
  describe("construction without component name", () => {
    it("should create error with provider name only", () => {
      const error = new ProviderMissingError("DataTableProvider");

      expect(error.message).toBe("DataTableProvider is required but was not found.");
      expect(error.providerName).toBe("DataTableProvider");
      expect(error.code).toBe(DataTableErrorCode.PROVIDER_MISSING);
    });

    it("should set correct error name", () => {
      const error = new ProviderMissingError("TestProvider");

      expect(error.name).toBe("ProviderMissingError");
    });

    it("should include context with provider name only", () => {
      const error = new ProviderMissingError("MyProvider");

      expect(error.context).toEqual({
        providerName: "MyProvider",
        componentName: undefined,
      });
    });
  });

  describe("construction with component name", () => {
    it("should create error with both provider and component names", () => {
      const error = new ProviderMissingError("DataTableProvider", "DataTableBody");

      expect(error.message).toBe(
        "DataTableBody requires DataTableProvider to be present in the component tree."
      );
      expect(error.providerName).toBe("DataTableProvider");
    });

    it("should include context with both names", () => {
      const error = new ProviderMissingError("Provider", "Component");

      expect(error.context).toEqual({
        providerName: "Provider",
        componentName: "Component",
      });
    });
  });

  describe("common provider names", () => {
    it("should handle DataTableProvider", () => {
      const error = new ProviderMissingError("DataTableProvider");

      expect(error.providerName).toBe("DataTableProvider");
    });

    it("should handle I18nProvider", () => {
      const error = new ProviderMissingError("I18nProvider", "TranslatedColumn");

      expect(error.message).toContain("I18nProvider");
    });

    it("should handle ThemeProvider", () => {
      const error = new ProviderMissingError("ThemeProvider", "StyledCell");

      expect(error.providerName).toBe("ThemeProvider");
    });
  });

  describe("inheritance", () => {
    it("should be instance of Error", () => {
      const error = new ProviderMissingError("Provider");

      expect(error).toBeInstanceOf(Error);
    });

    it("should have stack trace", () => {
      const error = new ProviderMissingError("Provider");

      expect(error.stack).toBeDefined();
    });
  });
});

// ─── ERROR CODE VERIFICATION ────────────────────────────────────────────────

describe("context error codes", () => {
  it("should use unique error codes for each error type", () => {
    const contextNotFound = new ContextNotFoundError("hook", "provider");
    const providerMissing = new ProviderMissingError("provider");

    expect(contextNotFound.code).not.toBe(providerMissing.code);
  });

  it("should use correct error codes", () => {
    const contextNotFound = new ContextNotFoundError("hook", "provider");
    const providerMissing = new ProviderMissingError("provider");

    expect(contextNotFound.code).toBe(DataTableErrorCode.CONTEXT_NOT_FOUND);
    expect(providerMissing.code).toBe(DataTableErrorCode.PROVIDER_MISSING);
  });
});

// ─── REAL WORLD SCENARIOS ───────────────────────────────────────────────────

describe("real world context error scenarios", () => {
  it("should create helpful error for missing DataTable context", () => {
    const error = new ContextNotFoundError(
      "useDataTableContext",
      "DataTableProvider"
    );

    expect(error.message).toContain("useDataTableContext");
    expect(error.message).toContain("DataTableProvider");
    expect(error.message).toContain("must be used within");
  });

  it("should create helpful error for component outside provider", () => {
    const error = new ProviderMissingError("DataTableProvider", "DataTableHeader");

    expect(error.message).toContain("DataTableHeader");
    expect(error.message).toContain("DataTableProvider");
    expect(error.message).toContain("component tree");
  });

  it("should create helpful error for nested provider requirement", () => {
    const error = new ContextNotFoundError("useRowContext", "RowProvider");

    expect(error.message).toBe("useRowContext must be used within a RowProvider.");
  });
});
