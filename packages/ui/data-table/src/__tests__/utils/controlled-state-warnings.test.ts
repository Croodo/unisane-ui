import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  DesyncDetector,
  createDesyncDetector,
  warnControlledDesync,
  type DesyncWarning,
} from "../../utils/controlled-state-warnings";
import { createErrorHub } from "../../errors/error-hub";

// ─── TEST HELPERS ────────────────────────────────────────────────────────────

const createMockErrorHub = () => {
  return createErrorHub({ enableConsoleLog: false });
};

// ─── DesyncDetector CLASS TESTS ──────────────────────────────────────────────

describe("DesyncDetector", () => {
  let detector: DesyncDetector;
  let consoleWarn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    detector = new DesyncDetector({
      consoleWarnings: false,
      throttleMs: 0, // Disable throttling for tests
    });
    consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarn.mockRestore();
  });

  describe("construction", () => {
    it("should create with default options", () => {
      const defaultDetector = new DesyncDetector();
      expect(defaultDetector).toBeInstanceOf(DesyncDetector);
    });

    it("should create with custom options", () => {
      const onDesync = vi.fn();
      const customDetector = new DesyncDetector({
        onDesync,
        throttleMs: 500,
        monitorTypes: ["selection", "sort"],
        consoleWarnings: false,
      });
      expect(customDetector).toBeInstanceOf(DesyncDetector);
    });
  });

  describe("selection state", () => {
    it("should detect selection desync", () => {
      const onDesync = vi.fn();
      const selectionDetector = new DesyncDetector({
        onDesync,
        consoleWarnings: false,
        throttleMs: 0,
      });

      selectionDetector.expectSelectionChange(["1", "2", "3"]);
      selectionDetector.verifySelectionState(["1", "2"]); // Missing "3"

      expect(onDesync).toHaveBeenCalled();
      const warning = onDesync.mock.calls[0]![0] as DesyncWarning;
      expect(warning.stateType).toBe("selection");
    });

    it("should not report when selection matches", () => {
      const onDesync = vi.fn();
      const selectionDetector = new DesyncDetector({
        onDesync,
        consoleWarnings: false,
      });

      selectionDetector.expectSelectionChange(["1", "2"]);
      selectionDetector.verifySelectionState(["1", "2"]);

      expect(onDesync).not.toHaveBeenCalled();
    });

    it("should handle order-independent selection comparison", () => {
      const onDesync = vi.fn();
      const selectionDetector = new DesyncDetector({
        onDesync,
        consoleWarnings: false,
      });

      selectionDetector.expectSelectionChange(["1", "2", "3"]);
      selectionDetector.verifySelectionState(["3", "1", "2"]); // Same items, different order

      expect(onDesync).not.toHaveBeenCalled();
    });

    it("should handle undefined actual selection", () => {
      const onDesync = vi.fn();
      const selectionDetector = new DesyncDetector({
        onDesync,
        consoleWarnings: false,
        throttleMs: 0,
      });

      selectionDetector.expectSelectionChange(["1"]);
      selectionDetector.verifySelectionState(undefined);

      expect(onDesync).toHaveBeenCalled();
    });
  });

  describe("sort state", () => {
    it("should detect sort desync", () => {
      const onDesync = vi.fn();
      const sortDetector = new DesyncDetector({
        onDesync,
        consoleWarnings: false,
        throttleMs: 0,
      });

      sortDetector.expectSortChange([{ key: "name", direction: "asc" }]);
      sortDetector.verifySortState([{ key: "name", direction: "desc" }]); // Wrong direction

      expect(onDesync).toHaveBeenCalled();
      const warning = onDesync.mock.calls[0]![0] as DesyncWarning;
      expect(warning.stateType).toBe("sort");
    });

    it("should not report when sort matches", () => {
      const onDesync = vi.fn();
      const sortDetector = new DesyncDetector({
        onDesync,
        consoleWarnings: false,
      });

      sortDetector.expectSortChange([{ key: "name", direction: "asc" }]);
      sortDetector.verifySortState([{ key: "name", direction: "asc" }]);

      expect(onDesync).not.toHaveBeenCalled();
    });

    it("should handle empty sort state", () => {
      const onDesync = vi.fn();
      const sortDetector = new DesyncDetector({
        onDesync,
        consoleWarnings: false,
      });

      sortDetector.expectSortChange([]);
      sortDetector.verifySortState([]);

      expect(onDesync).not.toHaveBeenCalled();
    });

    it("should handle undefined actual sort", () => {
      const onDesync = vi.fn();
      const sortDetector = new DesyncDetector({
        onDesync,
        consoleWarnings: false,
      });

      sortDetector.expectSortChange([]);
      sortDetector.verifySortState(undefined);

      expect(onDesync).not.toHaveBeenCalled(); // Empty array equals undefined
    });
  });

  describe("filter state", () => {
    it("should detect filter desync", () => {
      const onDesync = vi.fn();
      const filterDetector = new DesyncDetector({
        onDesync,
        consoleWarnings: false,
        throttleMs: 0,
      });

      filterDetector.expectFilterChange({ name: "John", age: 30 });
      filterDetector.verifyFilterState({ name: "John" }); // Missing age

      expect(onDesync).toHaveBeenCalled();
      const warning = onDesync.mock.calls[0]![0] as DesyncWarning;
      expect(warning.stateType).toBe("filter");
    });

    it("should not report when filter matches", () => {
      const onDesync = vi.fn();
      const filterDetector = new DesyncDetector({
        onDesync,
        consoleWarnings: false,
      });

      filterDetector.expectFilterChange({ name: "John" });
      filterDetector.verifyFilterState({ name: "John" });

      expect(onDesync).not.toHaveBeenCalled();
    });
  });

  describe("search state", () => {
    it("should detect search desync", () => {
      const onDesync = vi.fn();
      const searchDetector = new DesyncDetector({
        onDesync,
        consoleWarnings: false,
        throttleMs: 0,
      });

      searchDetector.expectSearchChange("search term");
      searchDetector.verifySearchState("different term");

      expect(onDesync).toHaveBeenCalled();
      const warning = onDesync.mock.calls[0]![0] as DesyncWarning;
      expect(warning.stateType).toBe("search");
    });

    it("should not report when search matches", () => {
      const onDesync = vi.fn();
      const searchDetector = new DesyncDetector({
        onDesync,
        consoleWarnings: false,
      });

      searchDetector.expectSearchChange("search");
      searchDetector.verifySearchState("search");

      expect(onDesync).not.toHaveBeenCalled();
    });

    it("should treat undefined as empty string", () => {
      const onDesync = vi.fn();
      const searchDetector = new DesyncDetector({
        onDesync,
        consoleWarnings: false,
      });

      searchDetector.expectSearchChange("");
      searchDetector.verifySearchState(undefined);

      expect(onDesync).not.toHaveBeenCalled();
    });
  });

  describe("column pin state", () => {
    it("should detect column pin desync", () => {
      const onDesync = vi.fn();
      const pinDetector = new DesyncDetector({
        onDesync,
        consoleWarnings: false,
        throttleMs: 0,
      });

      pinDetector.expectColumnPinChange({ name: "left", age: "right" });
      pinDetector.verifyColumnPinState({ name: "left" }); // Missing age

      expect(onDesync).toHaveBeenCalled();
      const warning = onDesync.mock.calls[0]![0] as DesyncWarning;
      expect(warning.stateType).toBe("columnPin");
    });

    it("should not report when pin state matches", () => {
      const onDesync = vi.fn();
      const pinDetector = new DesyncDetector({
        onDesync,
        consoleWarnings: false,
      });

      pinDetector.expectColumnPinChange({ name: "left" });
      pinDetector.verifyColumnPinState({ name: "left" });

      expect(onDesync).not.toHaveBeenCalled();
    });
  });

  describe("column order state", () => {
    it("should detect column order desync", () => {
      const onDesync = vi.fn();
      const orderDetector = new DesyncDetector({
        onDesync,
        consoleWarnings: false,
        throttleMs: 0,
      });

      orderDetector.expectColumnOrderChange(["name", "age", "email"]);
      orderDetector.verifyColumnOrderState(["age", "name", "email"]); // Wrong order

      expect(onDesync).toHaveBeenCalled();
      const warning = onDesync.mock.calls[0]![0] as DesyncWarning;
      expect(warning.stateType).toBe("columnOrder");
    });

    it("should not report when column order matches", () => {
      const onDesync = vi.fn();
      const orderDetector = new DesyncDetector({
        onDesync,
        consoleWarnings: false,
      });

      orderDetector.expectColumnOrderChange(["a", "b", "c"]);
      orderDetector.verifyColumnOrderState(["a", "b", "c"]);

      expect(onDesync).not.toHaveBeenCalled();
    });
  });

  describe("verifyAllState", () => {
    it("should verify all controlled states at once", () => {
      const onDesync = vi.fn();
      const allDetector = new DesyncDetector({
        onDesync,
        consoleWarnings: false,
        throttleMs: 0,
      });

      allDetector.expectSelectionChange(["1"]);
      allDetector.expectSortChange([{ key: "name", direction: "asc" }]);

      allDetector.verifyAllState({
        selectedIds: ["2"], // Wrong
        sortState: [{ key: "name", direction: "asc" }], // Correct
      });

      expect(onDesync).toHaveBeenCalledTimes(1);
      expect((onDesync.mock.calls[0]![0] as DesyncWarning).stateType).toBe("selection");
    });

    it("should handle undefined controlled state", () => {
      const onDesync = vi.fn();
      const allDetector = new DesyncDetector({
        onDesync,
        consoleWarnings: false,
      });

      allDetector.verifyAllState(undefined);
      expect(onDesync).not.toHaveBeenCalled();
    });
  });

  describe("throttling", () => {
    it("should throttle repeated warnings", async () => {
      const onDesync = vi.fn();
      const throttledDetector = new DesyncDetector({
        onDesync,
        consoleWarnings: false,
        throttleMs: 100,
      });

      // First warning should fire
      throttledDetector.expectSelectionChange(["1"]);
      throttledDetector.verifySelectionState(["2"]);
      expect(onDesync).toHaveBeenCalledTimes(1);

      // Second warning should be throttled
      throttledDetector.expectSelectionChange(["1"]);
      throttledDetector.verifySelectionState(["3"]);
      expect(onDesync).toHaveBeenCalledTimes(1);

      // Wait for throttle to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Third warning should fire
      throttledDetector.expectSelectionChange(["1"]);
      throttledDetector.verifySelectionState(["4"]);
      expect(onDesync).toHaveBeenCalledTimes(2);
    });
  });

  describe("monitor types filtering", () => {
    it("should only monitor specified types", () => {
      const onDesync = vi.fn();
      const limitedDetector = new DesyncDetector({
        onDesync,
        consoleWarnings: false,
        monitorTypes: ["selection"], // Only monitor selection
        throttleMs: 0,
      });

      // Selection should be monitored
      limitedDetector.expectSelectionChange(["1"]);
      limitedDetector.verifySelectionState(["2"]);
      expect(onDesync).toHaveBeenCalledTimes(1);

      // Sort should NOT be monitored
      limitedDetector.expectSortChange([{ key: "name", direction: "asc" }]);
      limitedDetector.verifySortState([{ key: "name", direction: "desc" }]);
      expect(onDesync).toHaveBeenCalledTimes(1); // Still 1
    });
  });

  describe("console warnings", () => {
    it("should log to console when enabled", () => {
      const consoleDetector = new DesyncDetector({
        consoleWarnings: true,
        throttleMs: 0,
      });

      consoleDetector.expectSelectionChange(["1"]);
      consoleDetector.verifySelectionState(["2"]);

      expect(consoleWarn).toHaveBeenCalled();
      expect(consoleWarn.mock.calls[0][0]).toContain("Controlled state desync detected");
    });

    it("should not log when disabled", () => {
      const silentDetector = new DesyncDetector({
        consoleWarnings: false,
        throttleMs: 0,
      });

      silentDetector.expectSelectionChange(["1"]);
      silentDetector.verifySelectionState(["2"]);

      expect(consoleWarn).not.toHaveBeenCalled();
    });
  });

  describe("error hub integration", () => {
    it("should report to error hub when provided", () => {
      const errorHub = createMockErrorHub();
      const reportSpy = vi.spyOn(errorHub, "report");

      const hubDetector = new DesyncDetector({
        errorHub,
        consoleWarnings: false,
        throttleMs: 0,
      });

      hubDetector.expectSelectionChange(["1"]);
      hubDetector.verifySelectionState(["2"]);

      expect(reportSpy).toHaveBeenCalled();
      errorHub.destroy();
    });
  });

  describe("getWarnings", () => {
    it("should return empty array initially", () => {
      expect(detector.getWarnings()).toEqual([]);
    });

    it("should return recorded warnings", () => {
      detector.expectSelectionChange(["1"]);
      detector.verifySelectionState(["2"]);

      const warnings = detector.getWarnings();
      expect(warnings.length).toBe(1);
      expect(warnings[0]?.stateType).toBe("selection");
    });

    it("should return copy of warnings", () => {
      detector.expectSelectionChange(["1"]);
      detector.verifySelectionState(["2"]);

      const warnings1 = detector.getWarnings();
      const warnings2 = detector.getWarnings();

      expect(warnings1).not.toBe(warnings2);
    });
  });

  describe("clearWarnings", () => {
    it("should clear all recorded warnings", () => {
      detector.expectSelectionChange(["1"]);
      detector.verifySelectionState(["2"]);

      expect(detector.getWarnings().length).toBe(1);

      detector.clearWarnings();

      expect(detector.getWarnings().length).toBe(0);
    });
  });

  describe("clearExpectations", () => {
    it("should clear all pending expectations", () => {
      const onDesync = vi.fn();
      const clearDetector = new DesyncDetector({
        onDesync,
        consoleWarnings: false,
      });

      clearDetector.expectSelectionChange(["1"]);
      clearDetector.clearExpectations();
      clearDetector.verifySelectionState(["2"]);

      // No desync should be reported because expectation was cleared
      expect(onDesync).not.toHaveBeenCalled();
    });
  });

  describe("stale expectations", () => {
    it("should ignore stale expectations", async () => {
      const onDesync = vi.fn();
      const staleDetector = new DesyncDetector({
        onDesync,
        consoleWarnings: false,
        throttleMs: 50,
      });

      staleDetector.expectSelectionChange(["1"]);

      // Wait for expectation to become stale (5x throttle window)
      await new Promise((resolve) => setTimeout(resolve, 300));

      staleDetector.verifySelectionState(["2"]);

      // No desync because expectation was stale
      expect(onDesync).not.toHaveBeenCalled();
    });
  });
});

// ─── createDesyncDetector TESTS ──────────────────────────────────────────────

describe("createDesyncDetector", () => {
  it("should create detector instance", () => {
    const detector = createDesyncDetector();
    expect(detector).toBeInstanceOf(DesyncDetector);
  });

  it("should accept custom options", () => {
    const onDesync = vi.fn();
    const detector = createDesyncDetector({
      onDesync,
      throttleMs: 200,
    });
    expect(detector).toBeInstanceOf(DesyncDetector);
  });
});

// ─── warnControlledDesync TESTS ──────────────────────────────────────────────

describe("warnControlledDesync", () => {
  let consoleWarn: ReturnType<typeof vi.spyOn>;
  let originalEnv: string | undefined;

  beforeEach(() => {
    consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    consoleWarn.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  it("should warn when values don't match", () => {
    process.env.NODE_ENV = "development";

    warnControlledDesync("selection", ["1", "2"], ["1"]);

    expect(consoleWarn).toHaveBeenCalled();
    expect(consoleWarn.mock.calls[0][0]).toContain("selection");
  });

  it("should not warn when values match", () => {
    process.env.NODE_ENV = "development";

    warnControlledDesync("sort", [{ key: "name" }], [{ key: "name" }]);

    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it("should not warn in production", () => {
    process.env.NODE_ENV = "production";

    warnControlledDesync("selection", ["1"], ["2"]);

    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it("should report to error hub when provided", () => {
    process.env.NODE_ENV = "development";
    const errorHub = createMockErrorHub();
    const reportSpy = vi.spyOn(errorHub, "report");

    warnControlledDesync("filter", { a: 1 }, { b: 2 }, errorHub);

    expect(reportSpy).toHaveBeenCalled();
    errorHub.destroy();
  });

  it("should not report to error hub when values match", () => {
    process.env.NODE_ENV = "development";
    const errorHub = createMockErrorHub();
    const reportSpy = vi.spyOn(errorHub, "report");

    warnControlledDesync("search", "test", "test", errorHub);

    expect(reportSpy).not.toHaveBeenCalled();
    errorHub.destroy();
  });
});

// ─── WARNING MESSAGE FORMAT TESTS ────────────────────────────────────────────

describe("warning message format", () => {
  it("should include state type label in message", () => {
    const onDesync = vi.fn();
    const detector = new DesyncDetector({
      onDesync,
      consoleWarnings: false,
      throttleMs: 0,
    });

    detector.expectSelectionChange(["1"]);
    detector.verifySelectionState(["2"]);

    const warning = onDesync.mock.calls[0]![0] as DesyncWarning;
    expect(warning.message).toContain("Row selection");
  });

  it("should include expected and actual values in message", () => {
    const onDesync = vi.fn();
    const detector = new DesyncDetector({
      onDesync,
      consoleWarnings: false,
      throttleMs: 0,
    });

    detector.expectSortChange([{ key: "name", direction: "asc" }]);
    detector.verifySortState([{ key: "name", direction: "desc" }]);

    const warning = onDesync.mock.calls[0]![0] as DesyncWarning;
    expect(warning.message).toContain("Expected:");
    expect(warning.message).toContain("Actual:");
  });

  it("should include timestamp in warning", () => {
    const onDesync = vi.fn();
    const detector = new DesyncDetector({
      onDesync,
      consoleWarnings: false,
      throttleMs: 0,
    });

    const before = new Date();
    detector.expectSelectionChange(["1"]);
    detector.verifySelectionState(["2"]);
    const after = new Date();

    const warning = onDesync.mock.calls[0]![0] as DesyncWarning;
    expect(warning.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(warning.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
