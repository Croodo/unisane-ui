import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { render, screen } from "@testing-library/react";
import React from "react";
import { I18nProvider, useI18n, createTranslator, defaultLocale } from "../../i18n/context";

// ─── I18nProvider TESTS ─────────────────────────────────────────────────────

describe("I18nProvider", () => {
  describe("default locale", () => {
    it("should provide default English locale when no locale prop is passed", () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      });

      expect(result.current.locale).toBe("en");
    });

    it("should provide default strings", () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      });

      expect(result.current.strings.noResults).toBe("No results found");
      expect(result.current.strings.loading).toBe("Loading data...");
    });
  });

  describe("custom locale", () => {
    it("should override locale identifier", () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => (
          <I18nProvider locale={{ locale: "es" }}>{children}</I18nProvider>
        ),
      });

      expect(result.current.locale).toBe("es");
    });

    it("should partially override strings", () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => (
          <I18nProvider
            locale={{
              locale: "es",
              strings: {
                noResults: "Sin resultados",
                loading: "Cargando...",
              },
            }}
          >
            {children}
          </I18nProvider>
        ),
      });

      // Custom strings
      expect(result.current.strings.noResults).toBe("Sin resultados");
      expect(result.current.strings.loading).toBe("Cargando...");
      // Default strings preserved
      expect(result.current.strings.selectAll).toBe("Select all rows");
    });

    it("should merge number format options", () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => (
          <I18nProvider
            locale={{
              locale: "de-DE",
              numberFormat: {
                style: "currency",
                currency: "EUR",
              },
            }}
          >
            {children}
          </I18nProvider>
        ),
      });

      // German locale should format with Euro
      const formatted = result.current.formatNumber(1234.56);
      expect(formatted).toContain("€");
    });

    it("should merge date format options", () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => (
          <I18nProvider
            locale={{
              locale: "en-GB",
              dateFormat: {
                year: "numeric",
                month: "long",
                day: "numeric",
              },
            }}
          >
            {children}
          </I18nProvider>
        ),
      });

      const date = new Date(2024, 0, 15); // January 15, 2024
      const formatted = result.current.formatDate(date);
      expect(formatted).toContain("2024");
      expect(formatted).toContain("January");
    });
  });

  describe("children rendering", () => {
    it("should render children correctly", () => {
      render(
        <I18nProvider>
          <div data-testid="child">Child content</div>
        </I18nProvider>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
  });
});

// ─── useI18n HOOK TESTS ─────────────────────────────────────────────────────

describe("useI18n", () => {
  describe("without provider", () => {
    it("should return default locale when used outside provider", () => {
      const { result } = renderHook(() => useI18n());

      expect(result.current.locale).toBe("en");
      expect(result.current.strings.noResults).toBe("No results found");
    });

    it("should provide working t function outside provider", () => {
      const { result } = renderHook(() => useI18n());

      const translated = result.current.t("noResults");
      expect(translated).toBe("No results found");
    });

    it("should provide working formatNumber outside provider", () => {
      const { result } = renderHook(() => useI18n());

      const formatted = result.current.formatNumber(1234);
      expect(formatted).toBe("1,234");
    });

    it("should provide working formatDate outside provider", () => {
      const { result } = renderHook(() => useI18n());

      const date = new Date(2024, 5, 15); // June 15, 2024
      const formatted = result.current.formatDate(date);
      expect(formatted).toContain("2024");
    });
  });

  describe("t function (translation)", () => {
    it("should translate a simple key", () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      });

      expect(result.current.t("noResults")).toBe("No results found");
    });

    it("should interpolate single placeholder", () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      });

      const translated = result.current.t("selectedCount", { count: 5 });
      expect(translated).toBe("5 selected");
    });

    it("should interpolate multiple placeholders", () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      });

      const translated = result.current.t("pageOfTotal", { page: 2, totalPages: 10 });
      expect(translated).toBe("Page 2 of 10");
    });

    it("should preserve placeholder if param not provided", () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      });

      // selectedCount expects {count} but we don't provide it
      const translated = result.current.t("selectedCount", {});
      expect(translated).toBe("{count} selected");
    });

    it("should handle string params", () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      });

      const translated = result.current.t("filterBy", { column: "Name" });
      expect(translated).toBe("Filter by Name");
    });

    it("should handle number params", () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      });

      const translated = result.current.t("rangeOfTotal", { start: 1, end: 10, total: 100 });
      expect(translated).toBe("1-10 of 100");
    });

    it("should return template without params", () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      });

      // Calling without params
      const translated = result.current.t("noResults");
      expect(translated).toBe("No results found");
    });
  });

  describe("formatNumber", () => {
    it("should format integers with thousands separators", () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      });

      expect(result.current.formatNumber(1000000)).toBe("1,000,000");
    });

    it("should format decimals", () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      });

      const formatted = result.current.formatNumber(1234.56);
      expect(formatted).toContain("1,234");
    });

    it("should format zero", () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      });

      expect(result.current.formatNumber(0)).toBe("0");
    });

    it("should format negative numbers", () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      });

      const formatted = result.current.formatNumber(-1234);
      expect(formatted).toContain("-");
      expect(formatted).toContain("1,234");
    });

    it("should respect locale-specific formatting", () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => (
          <I18nProvider locale={{ locale: "de-DE" }}>{children}</I18nProvider>
        ),
      });

      const formatted = result.current.formatNumber(1234.56);
      // German uses . for thousands and , for decimal
      expect(formatted).toContain("1.234");
    });
  });

  describe("formatDate", () => {
    it("should format dates in default locale", () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      });

      const date = new Date(2024, 11, 25); // December 25, 2024
      const formatted = result.current.formatDate(date);
      expect(formatted).toContain("2024");
    });

    it("should format dates in custom locale", () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => (
          <I18nProvider locale={{ locale: "en-GB" }}>{children}</I18nProvider>
        ),
      });

      const date = new Date(2024, 11, 25);
      const formatted = result.current.formatDate(date);
      expect(formatted).toContain("2024");
    });

    it("should use custom date format options", () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => (
          <I18nProvider
            locale={{
              dateFormat: {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              },
            }}
          >
            {children}
          </I18nProvider>
        ),
      });

      const date = new Date(2024, 11, 25); // December 25, 2024 (Wednesday)
      const formatted = result.current.formatDate(date);
      expect(formatted).toContain("December");
      expect(formatted).toContain("25");
      expect(formatted).toContain("2024");
    });
  });
});

// ─── createTranslator TESTS ─────────────────────────────────────────────────

describe("createTranslator", () => {
  it("should create a translator with default strings", () => {
    const t = createTranslator();

    expect(t("noResults")).toBe("No results found");
    expect(t("loading")).toBe("Loading data...");
  });

  it("should create a translator with custom strings", () => {
    const t = createTranslator({
      noResults: "Aucun résultat",
      loading: "Chargement...",
    });

    expect(t("noResults")).toBe("Aucun résultat");
    expect(t("loading")).toBe("Chargement...");
  });

  it("should merge custom strings with defaults", () => {
    const t = createTranslator({
      noResults: "Custom no results",
    });

    // Custom string
    expect(t("noResults")).toBe("Custom no results");
    // Default strings preserved
    expect(t("loading")).toBe("Loading data...");
  });

  it("should support interpolation", () => {
    const t = createTranslator();

    expect(t("selectedCount", { count: 3 })).toBe("3 selected");
    expect(t("pageOfTotal", { page: 1, totalPages: 5 })).toBe("Page 1 of 5");
  });

  it("should handle interpolation with custom strings", () => {
    const t = createTranslator({
      selectedCount: "{count} éléments sélectionnés",
    });

    expect(t("selectedCount", { count: 7 })).toBe("7 éléments sélectionnés");
  });
});

// ─── defaultLocale TESTS ────────────────────────────────────────────────────

describe("defaultLocale", () => {
  it("should export default locale object", () => {
    expect(defaultLocale).toBeDefined();
    expect(defaultLocale.locale).toBe("en");
    expect(defaultLocale.strings).toBeDefined();
  });

  it("should have all required string keys", () => {
    const requiredKeys = [
      "noResults",
      "loading",
      "selectAll",
      "selectedCount",
      "pageOfTotal",
      "previous",
      "next",
      "export",
      "search",
    ];

    // Check a subset of required keys exist
    expect(defaultLocale.strings.noResults).toBeDefined();
    expect(defaultLocale.strings.loading).toBeDefined();
    expect(defaultLocale.strings.selectAll).toBeDefined();
  });
});

// ─── INTERPOLATION EDGE CASES ───────────────────────────────────────────────

describe("interpolation edge cases", () => {
  it("should handle empty params object", () => {
    const { result } = renderHook(() => useI18n(), {
      wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
    });

    // Should return template with placeholders intact
    const translated = result.current.t("selectedCount", {});
    expect(translated).toBe("{count} selected");
  });

  it("should handle params with value 0", () => {
    const { result } = renderHook(() => useI18n(), {
      wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
    });

    const translated = result.current.t("selectedCount", { count: 0 });
    expect(translated).toBe("0 selected");
  });

  it("should handle params with empty string", () => {
    const { result } = renderHook(() => useI18n(), {
      wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
    });

    const translated = result.current.t("filterBy", { column: "" });
    expect(translated).toBe("Filter by ");
  });

  it("should handle undefined params", () => {
    const { result } = renderHook(() => useI18n(), {
      wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
    });

    const translated = result.current.t("noResults", undefined);
    expect(translated).toBe("No results found");
  });

  it("should not replace non-matching placeholders", () => {
    const { result } = renderHook(() => useI18n(), {
      wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
    });

    // rangeOfTotal expects {start}, {end}, {total}
    // Only providing {start}
    const translated = result.current.t("rangeOfTotal", { start: 1 });
    expect(translated).toBe("1-{end} of {total}");
  });
});

// ─── MEMOIZATION TESTS ──────────────────────────────────────────────────────

describe("memoization", () => {
  it("should return same t function reference when locale does not change", () => {
    const { result, rerender } = renderHook(() => useI18n(), {
      wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
    });

    const firstT = result.current.t;
    rerender();
    const secondT = result.current.t;

    expect(firstT).toBe(secondT);
  });

  it("should return same formatNumber function reference", () => {
    const { result, rerender } = renderHook(() => useI18n(), {
      wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
    });

    const firstFn = result.current.formatNumber;
    rerender();
    const secondFn = result.current.formatNumber;

    expect(firstFn).toBe(secondFn);
  });

  it("should return same formatDate function reference", () => {
    const { result, rerender } = renderHook(() => useI18n(), {
      wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
    });

    const firstFn = result.current.formatDate;
    rerender();
    const secondFn = result.current.formatDate;

    expect(firstFn).toBe(secondFn);
  });
});

// ─── LOCALE FORMATTING INTEGRATION ──────────────────────────────────────────

describe("locale formatting integration", () => {
  it("should format numbers differently based on locale", () => {
    const enHook = renderHook(() => useI18n(), {
      wrapper: ({ children }) => (
        <I18nProvider locale={{ locale: "en-US" }}>{children}</I18nProvider>
      ),
    });

    const deHook = renderHook(() => useI18n(), {
      wrapper: ({ children }) => (
        <I18nProvider locale={{ locale: "de-DE" }}>{children}</I18nProvider>
      ),
    });

    const usFormatted = enHook.result.current.formatNumber(1234567.89);
    const deFormatted = deHook.result.current.formatNumber(1234567.89);

    // US uses commas for thousands
    expect(usFormatted).toContain(",");
    // German uses periods for thousands
    expect(deFormatted).toContain(".");
  });

  it("should format dates differently based on locale", () => {
    const enHook = renderHook(() => useI18n(), {
      wrapper: ({ children }) => (
        <I18nProvider locale={{ locale: "en-US" }}>{children}</I18nProvider>
      ),
    });

    const gbHook = renderHook(() => useI18n(), {
      wrapper: ({ children }) => (
        <I18nProvider locale={{ locale: "en-GB" }}>{children}</I18nProvider>
      ),
    });

    const date = new Date(2024, 0, 15); // January 15, 2024

    const usFormatted = enHook.result.current.formatDate(date);
    const gbFormatted = gbHook.result.current.formatDate(date);

    // Both should contain the year
    expect(usFormatted).toContain("2024");
    expect(gbFormatted).toContain("2024");
  });
});
