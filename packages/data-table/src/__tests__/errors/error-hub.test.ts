import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ErrorHub,
  createErrorHub,
  getErrorHub,
  resetDefaultErrorHub,
  type ErrorHubOptions,
  type RecoveryStrategy,
} from "../../errors/error-hub";
import { DataTableError, DataTableErrorCode } from "../../errors/base";
import { ErrorSeverity } from "../../errors/severity";

// ─── TEST HELPERS ────────────────────────────────────────────────────────────

const createTestError = (
  code: string = DataTableErrorCode.FILTER_ERROR,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  message: string = "Test error"
): DataTableError => {
  return new DataTableError(message, code as typeof DataTableErrorCode.FILTER_ERROR, { severity });
};

// ─── ErrorHub CLASS TESTS ────────────────────────────────────────────────────

describe("ErrorHub", () => {
  let hub: ErrorHub;

  beforeEach(() => {
    hub = createErrorHub({ enableConsoleLog: false });
  });

  afterEach(() => {
    hub.destroy();
    resetDefaultErrorHub();
  });

  describe("construction", () => {
    it("should create with default options", () => {
      const defaultHub = createErrorHub();
      expect(defaultHub).toBeInstanceOf(ErrorHub);
      expect(defaultHub.getErrorCount()).toBe(0);
      defaultHub.destroy();
    });

    it("should create with custom options", () => {
      const customHub = createErrorHub({
        maxErrors: 50,
        enableConsoleLog: false,
        deduplicate: false,
        deduplicateWindowMs: 500,
        minStoreSeverity: ErrorSeverity.ERROR,
      });
      expect(customHub).toBeInstanceOf(ErrorHub);
      customHub.destroy();
    });

    it("should use custom logger when provided", () => {
      const customLogger = vi.fn();
      const logHub = createErrorHub({
        enableConsoleLog: true,
        logger: customLogger,
      });

      const error = createTestError();
      logHub.report(error);

      expect(customLogger).toHaveBeenCalledWith(error);
      logHub.destroy();
    });
  });

  describe("report", () => {
    it("should store reported errors", () => {
      const error = createTestError();
      const stored = hub.report(error);

      expect(stored).toBe(true);
      expect(hub.getErrorCount()).toBe(1);
      expect(hub.getErrors()).toContainEqual(error);
    });

    it("should call global onError handler", () => {
      const onError = vi.fn();
      const customHub = createErrorHub({ onError, enableConsoleLog: false });

      const error = createTestError();
      customHub.report(error);

      expect(onError).toHaveBeenCalledWith(error);
      customHub.destroy();
    });

    it("should not store errors below minimum severity", () => {
      const strictHub = createErrorHub({
        minStoreSeverity: ErrorSeverity.CRITICAL,
        enableConsoleLog: false,
      });

      const warningError = createTestError(DataTableErrorCode.FILTER_ERROR, ErrorSeverity.WARNING);
      const stored = strictHub.report(warningError);

      expect(stored).toBe(false);
      expect(strictHub.getErrorCount()).toBe(0);
      strictHub.destroy();
    });

    it("should enforce maxErrors limit", () => {
      const limitedHub = createErrorHub({
        maxErrors: 3,
        enableConsoleLog: false,
        deduplicate: false,
      });

      for (let i = 0; i < 5; i++) {
        limitedHub.report(createTestError(`CODE_${i}` as typeof DataTableErrorCode.FILTER_ERROR));
      }

      expect(limitedHub.getErrorCount()).toBe(3);
      // Should have the last 3 errors
      const errors = limitedHub.getErrors();
      expect(errors[0]?.code).toBe("CODE_2");
      expect(errors[1]?.code).toBe("CODE_3");
      expect(errors[2]?.code).toBe("CODE_4");
      limitedHub.destroy();
    });

    it("should deduplicate errors within time window", async () => {
      const dedupHub = createErrorHub({
        deduplicate: true,
        deduplicateWindowMs: 100,
        enableConsoleLog: false,
      });

      const error1 = createTestError(DataTableErrorCode.FILTER_ERROR);
      const error2 = createTestError(DataTableErrorCode.FILTER_ERROR);

      dedupHub.report(error1);
      const stored = dedupHub.report(error2);

      expect(stored).toBe(false);
      expect(dedupHub.getErrorCount()).toBe(1);

      // Wait for dedup window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      const error3 = createTestError(DataTableErrorCode.FILTER_ERROR);
      const stored2 = dedupHub.report(error3);

      expect(stored2).toBe(true);
      expect(dedupHub.getErrorCount()).toBe(2);
      dedupHub.destroy();
    });

    it("should not deduplicate when disabled", () => {
      const noDedupHub = createErrorHub({
        deduplicate: false,
        enableConsoleLog: false,
      });

      const error1 = createTestError();
      const error2 = createTestError();

      noDedupHub.report(error1);
      const stored = noDedupHub.report(error2);

      expect(stored).toBe(true);
      expect(noDedupHub.getErrorCount()).toBe(2);
      noDedupHub.destroy();
    });
  });

  describe("subscribe", () => {
    it("should notify subscribers when error is reported", () => {
      const handler = vi.fn();
      hub.subscribe(handler);

      const error = createTestError();
      hub.report(error);

      expect(handler).toHaveBeenCalledWith(error);
    });

    it("should support multiple subscribers", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      hub.subscribe(handler1);
      hub.subscribe(handler2);

      const error = createTestError();
      hub.report(error);

      expect(handler1).toHaveBeenCalledWith(error);
      expect(handler2).toHaveBeenCalledWith(error);
    });

    it("should return unsubscribe function", () => {
      const handler = vi.fn();
      const unsubscribe = hub.subscribe(handler);

      hub.report(createTestError());
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      hub.report(createTestError(DataTableErrorCode.SORT_ERROR));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle subscriber errors gracefully", () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      const badHandler = vi.fn().mockImplementation(() => {
        throw new Error("Handler error");
      });
      const goodHandler = vi.fn();

      hub.subscribe(badHandler);
      hub.subscribe(goodHandler);

      const error = createTestError();
      hub.report(error);

      expect(badHandler).toHaveBeenCalled();
      expect(goodHandler).toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe("recovery strategies", () => {
    it("should register recovery strategy", () => {
      const strategy: RecoveryStrategy = {
        id: "test-strategy",
        codes: [DataTableErrorCode.FILTER_ERROR],
        recover: vi.fn().mockReturnValue(true),
      };

      hub.registerRecoveryStrategy(strategy);

      const retrieved = hub.getRecoveryStrategy(DataTableErrorCode.FILTER_ERROR);
      expect(retrieved).toBe(strategy);
    });

    it("should register strategy for multiple codes", () => {
      const strategy: RecoveryStrategy = {
        id: "multi-strategy",
        codes: [DataTableErrorCode.FILTER_ERROR, DataTableErrorCode.SORT_ERROR],
        recover: vi.fn().mockReturnValue(true),
      };

      hub.registerRecoveryStrategy(strategy);

      expect(hub.getRecoveryStrategy(DataTableErrorCode.FILTER_ERROR)).toBe(strategy);
      expect(hub.getRecoveryStrategy(DataTableErrorCode.SORT_ERROR)).toBe(strategy);
    });

    it("should set recovery strategy for single code", () => {
      const strategy: RecoveryStrategy = {
        id: "single-strategy",
        codes: [DataTableErrorCode.RENDER_ERROR],
        recover: vi.fn().mockReturnValue(false),
      };

      hub.setRecoveryStrategy(DataTableErrorCode.RENDER_ERROR, strategy);

      expect(hub.getRecoveryStrategy(DataTableErrorCode.RENDER_ERROR)).toBe(strategy);
    });

    it("should attempt recovery when error is reported", () => {
      const recover = vi.fn().mockReturnValue(true);
      const strategy: RecoveryStrategy = {
        id: "auto-recover",
        codes: [DataTableErrorCode.FILTER_ERROR],
        recover,
      };

      hub.registerRecoveryStrategy(strategy);

      const error = createTestError(DataTableErrorCode.FILTER_ERROR, ErrorSeverity.ERROR);
      const stored = hub.report(error);

      expect(recover).toHaveBeenCalledWith(error);
      expect(stored).toBe(false); // Error was recovered, not stored
    });

    it("should store error if recovery fails", () => {
      const recover = vi.fn().mockReturnValue(false);
      const strategy: RecoveryStrategy = {
        id: "fail-recover",
        codes: [DataTableErrorCode.FILTER_ERROR],
        recover,
      };

      hub.registerRecoveryStrategy(strategy);

      const error = createTestError(DataTableErrorCode.FILTER_ERROR, ErrorSeverity.ERROR);
      const stored = hub.report(error);

      expect(recover).toHaveBeenCalled();
      expect(stored).toBe(true);
    });

    it("should handle recovery errors gracefully", () => {
      const recover = vi.fn().mockImplementation(() => {
        throw new Error("Recovery failed");
      });
      const strategy: RecoveryStrategy = {
        id: "error-recover",
        codes: [DataTableErrorCode.FILTER_ERROR],
        recover,
      };

      hub.registerRecoveryStrategy(strategy);

      const error = createTestError(DataTableErrorCode.FILTER_ERROR, ErrorSeverity.ERROR);
      const stored = hub.report(error);

      expect(stored).toBe(true); // Error stored because recovery threw
    });
  });

  describe("getState", () => {
    it("should return correct initial state", () => {
      const state = hub.getState();

      expect(state.errors).toEqual([]);
      expect(state.errorCount).toBe(0);
      expect(state.lastError).toBeNull();
      expect(state.hasErrors).toBe(false);
      expect(state.hasFatalError).toBe(false);
      expect(state.hasCriticalError).toBe(false);
      expect(state.countBySeverity).toEqual({
        warning: 0,
        error: 0,
        critical: 0,
        fatal: 0,
      });
    });

    it("should return correct state after errors", () => {
      hub.report(createTestError(DataTableErrorCode.FILTER_ERROR, ErrorSeverity.WARNING));
      hub.report(createTestError(DataTableErrorCode.SORT_ERROR, ErrorSeverity.ERROR));
      hub.report(createTestError(DataTableErrorCode.RENDER_ERROR, ErrorSeverity.CRITICAL));

      const state = hub.getState();

      expect(state.errorCount).toBe(3);
      expect(state.hasErrors).toBe(true);
      expect(state.hasFatalError).toBe(false);
      expect(state.hasCriticalError).toBe(true);
      expect(state.countBySeverity.warning).toBe(1);
      expect(state.countBySeverity.error).toBe(1);
      expect(state.countBySeverity.critical).toBe(1);
    });

    it("should detect fatal errors", () => {
      hub.report(createTestError(DataTableErrorCode.CONTEXT_NOT_FOUND, ErrorSeverity.FATAL));

      const state = hub.getState();
      expect(state.hasFatalError).toBe(true);
      expect(state.hasCriticalError).toBe(true);
    });

    it("should return copy of errors array", () => {
      hub.report(createTestError());
      const state = hub.getState();
      const errors = state.errors;

      errors.push(createTestError(DataTableErrorCode.SORT_ERROR));

      expect(hub.getState().errors.length).toBe(1);
    });
  });

  describe("getErrors", () => {
    it("should return all errors", () => {
      hub.report(createTestError(DataTableErrorCode.FILTER_ERROR));
      hub.report(createTestError(DataTableErrorCode.SORT_ERROR));

      const errors = hub.getErrors();
      expect(errors.length).toBe(2);
    });

    it("should return copy of errors", () => {
      hub.report(createTestError());
      const errors = hub.getErrors();

      errors.push(createTestError(DataTableErrorCode.SORT_ERROR));

      expect(hub.getErrors().length).toBe(1);
    });
  });

  describe("getErrorsBySeverity", () => {
    beforeEach(() => {
      hub.report(createTestError(DataTableErrorCode.FILTER_ERROR, ErrorSeverity.WARNING));
      hub.report(createTestError(DataTableErrorCode.SORT_ERROR, ErrorSeverity.ERROR));
      hub.report(createTestError(DataTableErrorCode.RENDER_ERROR, ErrorSeverity.ERROR));
      hub.report(createTestError(DataTableErrorCode.CONTEXT_NOT_FOUND, ErrorSeverity.CRITICAL));
    });

    it("should filter by WARNING severity", () => {
      const warnings = hub.getErrorsBySeverity(ErrorSeverity.WARNING);
      expect(warnings.length).toBe(1);
      expect(warnings[0]?.severity).toBe(ErrorSeverity.WARNING);
    });

    it("should filter by ERROR severity", () => {
      const errors = hub.getErrorsBySeverity(ErrorSeverity.ERROR);
      expect(errors.length).toBe(2);
    });

    it("should filter by CRITICAL severity", () => {
      const critical = hub.getErrorsBySeverity(ErrorSeverity.CRITICAL);
      expect(critical.length).toBe(1);
    });

    it("should return empty for FATAL when none exist", () => {
      const fatal = hub.getErrorsBySeverity(ErrorSeverity.FATAL);
      expect(fatal.length).toBe(0);
    });
  });

  describe("getErrorsByCode", () => {
    it("should filter by error code", () => {
      // Use hub without deduplication for this test
      const noDedupHub = createErrorHub({ enableConsoleLog: false, deduplicate: false });
      noDedupHub.report(createTestError(DataTableErrorCode.FILTER_ERROR));
      noDedupHub.report(createTestError(DataTableErrorCode.FILTER_ERROR));
      noDedupHub.report(createTestError(DataTableErrorCode.SORT_ERROR));

      const filterErrors = noDedupHub.getErrorsByCode(DataTableErrorCode.FILTER_ERROR);
      expect(filterErrors.length).toBe(2);
      noDedupHub.destroy();
    });

    it("should return empty for non-existent code", () => {
      hub.report(createTestError(DataTableErrorCode.FILTER_ERROR));
      const errors = hub.getErrorsByCode(DataTableErrorCode.EXPORT_ERROR);
      expect(errors.length).toBe(0);
    });
  });

  describe("getLastError", () => {
    it("should return null when no errors", () => {
      expect(hub.getLastError()).toBeNull();
    });

    it("should return most recent error", () => {
      hub.report(createTestError(DataTableErrorCode.FILTER_ERROR));
      hub.report(createTestError(DataTableErrorCode.SORT_ERROR));
      hub.report(createTestError(DataTableErrorCode.RENDER_ERROR));

      const last = hub.getLastError();
      expect(last?.code).toBe(DataTableErrorCode.RENDER_ERROR);
    });
  });

  describe("hasSeverity", () => {
    it("should return false when no errors", () => {
      expect(hub.hasSeverity(ErrorSeverity.ERROR)).toBe(false);
    });

    it("should return true when severity exists", () => {
      hub.report(createTestError(DataTableErrorCode.FILTER_ERROR, ErrorSeverity.WARNING));
      hub.report(createTestError(DataTableErrorCode.SORT_ERROR, ErrorSeverity.ERROR));

      expect(hub.hasSeverity(ErrorSeverity.WARNING)).toBe(true);
      expect(hub.hasSeverity(ErrorSeverity.ERROR)).toBe(true);
      expect(hub.hasSeverity(ErrorSeverity.CRITICAL)).toBe(false);
    });
  });

  describe("clearErrors", () => {
    it("should clear all errors", () => {
      hub.report(createTestError());
      hub.report(createTestError(DataTableErrorCode.SORT_ERROR));

      hub.clearErrors();

      expect(hub.getErrorCount()).toBe(0);
      expect(hub.hasErrors()).toBe(false);
    });
  });

  describe("clearErrorsBySeverity", () => {
    beforeEach(() => {
      hub.report(createTestError(DataTableErrorCode.FILTER_ERROR, ErrorSeverity.WARNING));
      hub.report(createTestError(DataTableErrorCode.SORT_ERROR, ErrorSeverity.ERROR));
      hub.report(createTestError(DataTableErrorCode.RENDER_ERROR, ErrorSeverity.ERROR));
    });

    it("should clear only specified severity", () => {
      hub.clearErrorsBySeverity(ErrorSeverity.ERROR);

      expect(hub.getErrorCount()).toBe(1);
      expect(hub.getErrors()[0]?.severity).toBe(ErrorSeverity.WARNING);
    });
  });

  describe("clearErrorsByCode", () => {
    beforeEach(() => {
      hub.report(createTestError(DataTableErrorCode.FILTER_ERROR));
      hub.report(createTestError(DataTableErrorCode.FILTER_ERROR));
      hub.report(createTestError(DataTableErrorCode.SORT_ERROR));
    });

    it("should clear only specified code", () => {
      hub.clearErrorsByCode(DataTableErrorCode.FILTER_ERROR);

      expect(hub.getErrorCount()).toBe(1);
      expect(hub.getErrors()[0]?.code).toBe(DataTableErrorCode.SORT_ERROR);
    });
  });

  describe("hasErrors", () => {
    it("should return false when empty", () => {
      expect(hub.hasErrors()).toBe(false);
    });

    it("should return true when errors exist", () => {
      hub.report(createTestError());
      expect(hub.hasErrors()).toBe(true);
    });
  });

  describe("destroy", () => {
    it("should clear all state", () => {
      const handler = vi.fn();
      hub.subscribe(handler);
      hub.report(createTestError());
      hub.registerRecoveryStrategy({
        id: "test",
        codes: [DataTableErrorCode.FILTER_ERROR],
        recover: () => false,
      });

      hub.destroy();

      expect(hub.getErrorCount()).toBe(0);
      expect(hub.getRecoveryStrategy(DataTableErrorCode.FILTER_ERROR)).toBeUndefined();

      // Verify handler is removed by reporting new error
      hub.report(createTestError());
      expect(handler).toHaveBeenCalledTimes(1); // Only the first call
    });
  });
});

// ─── SINGLETON TESTS ─────────────────────────────────────────────────────────

describe("getErrorHub", () => {
  afterEach(() => {
    resetDefaultErrorHub();
  });

  it("should return singleton instance", () => {
    const hub1 = getErrorHub();
    const hub2 = getErrorHub();

    expect(hub1).toBe(hub2);
  });

  it("should create new instance after reset", () => {
    const hub1 = getErrorHub();
    resetDefaultErrorHub();
    const hub2 = getErrorHub();

    expect(hub1).not.toBe(hub2);
  });
});

describe("createErrorHub", () => {
  it("should create new instances", () => {
    const hub1 = createErrorHub();
    const hub2 = createErrorHub();

    expect(hub1).not.toBe(hub2);

    hub1.destroy();
    hub2.destroy();
  });

  it("should accept custom options", () => {
    const onError = vi.fn();
    const hub = createErrorHub({
      maxErrors: 10,
      onError,
    });

    hub.report(createTestError());
    expect(onError).toHaveBeenCalled();

    hub.destroy();
  });
});

describe("resetDefaultErrorHub", () => {
  it("should destroy existing hub", () => {
    const hub = getErrorHub();
    hub.report(createTestError());

    resetDefaultErrorHub();

    const newHub = getErrorHub();
    expect(newHub.getErrorCount()).toBe(0);
  });

  it("should handle reset when no hub exists", () => {
    expect(() => resetDefaultErrorHub()).not.toThrow();
  });
});

// ─── EDGE CASES ──────────────────────────────────────────────────────────────

describe("edge cases", () => {
  let hub: ErrorHub;

  beforeEach(() => {
    hub = createErrorHub({ enableConsoleLog: false });
  });

  afterEach(() => {
    hub.destroy();
  });

  it("should handle rapid error reporting", () => {
    for (let i = 0; i < 100; i++) {
      hub.report(createTestError(`CODE_${i}` as typeof DataTableErrorCode.FILTER_ERROR));
    }

    expect(hub.getErrorCount()).toBeLessThanOrEqual(100);
  });

  it("should handle concurrent subscriptions and reports", () => {
    const handlers = Array.from({ length: 10 }, () => vi.fn());
    handlers.forEach((h) => hub.subscribe(h));

    for (let i = 0; i < 5; i++) {
      hub.report(createTestError(`CODE_${i}` as typeof DataTableErrorCode.FILTER_ERROR));
    }

    handlers.forEach((h) => {
      expect(h).toHaveBeenCalledTimes(5);
    });
  });

  it("should handle empty string error codes in deduplication", async () => {
    const dedupHub = createErrorHub({
      deduplicate: true,
      deduplicateWindowMs: 100,
      enableConsoleLog: false,
    });

    // Report many errors to trigger cleanup
    for (let i = 0; i < 100; i++) {
      dedupHub.report(createTestError(`CODE_${i}` as typeof DataTableErrorCode.FILTER_ERROR));
    }

    // Should not throw
    expect(dedupHub.getErrorCount()).toBeGreaterThan(0);
    dedupHub.destroy();
  });
});
