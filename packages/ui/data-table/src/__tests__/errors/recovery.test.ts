import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  filterErrorRecovery,
  sortErrorRecovery,
  renderErrorRecovery,
  editErrorRecovery,
  dataFetchErrorRecovery,
  virtualizationErrorRecovery,
  selectionErrorRecovery,
  exportErrorRecovery,
  getDefaultRecoveryStrategies,
  createRecoveryStrategyMap,
  executeRecovery,
  executeRecoveryWithRetry,
  createRecoveryStrategy,
  mergeRecoveryStrategies,
  type RecoveryStrategyConfig,
} from "../../errors/recovery";
import { DataTableError, DataTableErrorCode } from "../../errors/base";
import { ErrorSeverity } from "../../errors/severity";

// ─── TEST HELPERS ────────────────────────────────────────────────────────────

const createTestError = (
  code: string,
  context?: Record<string, unknown>
): DataTableError => {
  return new DataTableError(
    "Test error",
    code as typeof DataTableErrorCode.FILTER_ERROR,
    { context }
  );
};

// ─── BUILT-IN RECOVERY STRATEGIES TESTS ──────────────────────────────────────

describe("filterErrorRecovery", () => {
  it("should have correct id", () => {
    expect(filterErrorRecovery.id).toBe("filter-error-recovery");
  });

  it("should handle FILTER_ERROR code", () => {
    expect(filterErrorRecovery.codes).toContain(DataTableErrorCode.FILTER_ERROR);
  });

  it("should not auto-recover", () => {
    const error = createTestError(DataTableErrorCode.FILTER_ERROR);
    expect(filterErrorRecovery.recover(error)).toBe(false);
  });

  it("should provide fallback of true (include row)", () => {
    const error = createTestError(DataTableErrorCode.FILTER_ERROR);
    expect(filterErrorRecovery.getFallback!(error)).toBe(true);
  });
});

describe("sortErrorRecovery", () => {
  it("should have correct id", () => {
    expect(sortErrorRecovery.id).toBe("sort-error-recovery");
  });

  it("should handle SORT_ERROR code", () => {
    expect(sortErrorRecovery.codes).toContain(DataTableErrorCode.SORT_ERROR);
  });

  it("should not auto-recover", () => {
    const error = createTestError(DataTableErrorCode.SORT_ERROR);
    expect(sortErrorRecovery.recover(error)).toBe(false);
  });

  it("should provide fallback of 0 (equal comparison)", () => {
    const error = createTestError(DataTableErrorCode.SORT_ERROR);
    expect(sortErrorRecovery.getFallback!(error)).toBe(0);
  });
});

describe("renderErrorRecovery", () => {
  it("should have correct id", () => {
    expect(renderErrorRecovery.id).toBe("render-error-recovery");
  });

  it("should handle RENDER_ERROR code", () => {
    expect(renderErrorRecovery.codes).toContain(DataTableErrorCode.RENDER_ERROR);
  });

  it("should not auto-recover", () => {
    const error = createTestError(DataTableErrorCode.RENDER_ERROR);
    expect(renderErrorRecovery.recover(error)).toBe(false);
  });

  it("should provide fallback of null", () => {
    const error = createTestError(DataTableErrorCode.RENDER_ERROR);
    expect(renderErrorRecovery.getFallback!(error)).toBeNull();
  });
});

describe("editErrorRecovery", () => {
  it("should have correct id", () => {
    expect(editErrorRecovery.id).toBe("edit-error-recovery");
  });

  it("should handle EDIT_FAILED code", () => {
    expect(editErrorRecovery.codes).toContain(DataTableErrorCode.EDIT_FAILED);
  });

  it("should not auto-recover", () => {
    const error = createTestError(DataTableErrorCode.EDIT_FAILED);
    expect(editErrorRecovery.recover(error)).toBe(false);
  });

  it("should provide fallback of original value from context", () => {
    const error = createTestError(DataTableErrorCode.EDIT_FAILED, {
      originalValue: "original",
    });
    expect(editErrorRecovery.getFallback!(error)).toBe("original");
  });

  it("should return undefined when no original value", () => {
    const error = createTestError(DataTableErrorCode.EDIT_FAILED);
    expect(editErrorRecovery.getFallback!(error)).toBeUndefined();
  });
});

describe("dataFetchErrorRecovery", () => {
  it("should have correct id", () => {
    expect(dataFetchErrorRecovery.id).toBe("data-fetch-error-recovery");
  });

  it("should handle DATA_FETCH_FAILED code", () => {
    expect(dataFetchErrorRecovery.codes).toContain(DataTableErrorCode.DATA_FETCH_FAILED);
  });

  it("should have retry configuration", () => {
    expect(dataFetchErrorRecovery.maxAttempts).toBe(3);
    expect(dataFetchErrorRecovery.retryDelay).toBe(1000);
  });

  it("should not auto-recover", () => {
    const error = createTestError(DataTableErrorCode.DATA_FETCH_FAILED);
    expect(dataFetchErrorRecovery.recover(error)).toBe(false);
  });

  it("should provide fallback of empty array", () => {
    const error = createTestError(DataTableErrorCode.DATA_FETCH_FAILED);
    expect(dataFetchErrorRecovery.getFallback!(error)).toEqual([]);
  });
});

describe("virtualizationErrorRecovery", () => {
  it("should have correct id", () => {
    expect(virtualizationErrorRecovery.id).toBe("virtualization-error-recovery");
  });

  it("should handle VIRTUALIZATION_ERROR code", () => {
    expect(virtualizationErrorRecovery.codes).toContain(DataTableErrorCode.VIRTUALIZATION_ERROR);
  });

  it("should provide fallback to disable virtualization", () => {
    const error = createTestError(DataTableErrorCode.VIRTUALIZATION_ERROR);
    expect(virtualizationErrorRecovery.getFallback!(error)).toEqual({
      disableVirtualization: true,
    });
  });
});

describe("selectionErrorRecovery", () => {
  it("should have correct id", () => {
    expect(selectionErrorRecovery.id).toBe("selection-error-recovery");
  });

  it("should handle SELECTION_ERROR code", () => {
    expect(selectionErrorRecovery.codes).toContain(DataTableErrorCode.SELECTION_ERROR);
  });

  it("should provide fallback of empty selection", () => {
    const error = createTestError(DataTableErrorCode.SELECTION_ERROR);
    expect(selectionErrorRecovery.getFallback!(error)).toEqual([]);
  });
});

describe("exportErrorRecovery", () => {
  it("should have correct id", () => {
    expect(exportErrorRecovery.id).toBe("export-error-recovery");
  });

  it("should handle EXPORT_ERROR code", () => {
    expect(exportErrorRecovery.codes).toContain(DataTableErrorCode.EXPORT_ERROR);
  });

  it("should provide fallback of null", () => {
    const error = createTestError(DataTableErrorCode.EXPORT_ERROR);
    expect(exportErrorRecovery.getFallback!(error)).toBeNull();
  });
});

// ─── getDefaultRecoveryStrategies TESTS ──────────────────────────────────────

describe("getDefaultRecoveryStrategies", () => {
  it("should return array of strategies", () => {
    const strategies = getDefaultRecoveryStrategies();
    expect(Array.isArray(strategies)).toBe(true);
    expect(strategies.length).toBeGreaterThan(0);
  });

  it("should include all built-in strategies", () => {
    const strategies = getDefaultRecoveryStrategies();
    const ids = strategies.map((s) => s.id);

    expect(ids).toContain("filter-error-recovery");
    expect(ids).toContain("sort-error-recovery");
    expect(ids).toContain("render-error-recovery");
    expect(ids).toContain("edit-error-recovery");
    expect(ids).toContain("data-fetch-error-recovery");
    expect(ids).toContain("virtualization-error-recovery");
    expect(ids).toContain("selection-error-recovery");
    expect(ids).toContain("export-error-recovery");
  });

  it("should return a copy (not the original array)", () => {
    const strategies1 = getDefaultRecoveryStrategies();
    const strategies2 = getDefaultRecoveryStrategies();

    expect(strategies1).not.toBe(strategies2);
  });
});

// ─── createRecoveryStrategyMap TESTS ─────────────────────────────────────────

describe("createRecoveryStrategyMap", () => {
  it("should create map from strategies", () => {
    const strategies = getDefaultRecoveryStrategies();
    const map = createRecoveryStrategyMap(strategies);

    expect(map).toBeInstanceOf(Map);
    expect(map.size).toBeGreaterThan(0);
  });

  it("should map error codes to strategies", () => {
    const strategies = getDefaultRecoveryStrategies();
    const map = createRecoveryStrategyMap(strategies);

    expect(map.get(DataTableErrorCode.FILTER_ERROR)).toBe(filterErrorRecovery);
    expect(map.get(DataTableErrorCode.SORT_ERROR)).toBe(sortErrorRecovery);
  });

  it("should handle strategies with multiple codes", () => {
    const multiCodeStrategy: RecoveryStrategyConfig = {
      id: "multi-code",
      codes: ["CODE_1", "CODE_2", "CODE_3"],
      recover: () => false,
    };

    const map = createRecoveryStrategyMap([multiCodeStrategy]);

    expect(map.get("CODE_1")).toBe(multiCodeStrategy);
    expect(map.get("CODE_2")).toBe(multiCodeStrategy);
    expect(map.get("CODE_3")).toBe(multiCodeStrategy);
  });

  it("should handle empty array", () => {
    const map = createRecoveryStrategyMap([]);
    expect(map.size).toBe(0);
  });
});

// ─── executeRecovery TESTS ───────────────────────────────────────────────────

describe("executeRecovery", () => {
  const strategies = getDefaultRecoveryStrategies();

  it("should return recovered=false when no strategy matches", () => {
    const error = createTestError("UNKNOWN_CODE");
    const result = executeRecovery(error, strategies);

    expect(result.recovered).toBe(false);
    expect(result.fallback).toBeUndefined();
  });

  it("should return fallback when recovery fails", () => {
    const error = createTestError(DataTableErrorCode.FILTER_ERROR);
    const result = executeRecovery<boolean>(error, strategies);

    expect(result.recovered).toBe(false);
    expect(result.fallback).toBe(true);
  });

  it("should return recovered=true when strategy succeeds", () => {
    const customStrategy: RecoveryStrategyConfig = {
      id: "success-strategy",
      codes: ["SUCCESS_CODE"],
      recover: () => true,
    };

    const error = createTestError("SUCCESS_CODE");
    const result = executeRecovery(error, [customStrategy]);

    expect(result.recovered).toBe(true);
    expect(result.suppress).toBe(true);
  });

  it("should handle recovery function throwing", () => {
    const throwingStrategy: RecoveryStrategyConfig = {
      id: "throwing-strategy",
      codes: ["THROW_CODE"],
      recover: () => {
        throw new Error("Recovery error");
      },
      getFallback: () => "fallback-value",
    };

    const error = createTestError("THROW_CODE");
    const result = executeRecovery<string>(error, [throwingStrategy]);

    expect(result.recovered).toBe(false);
    expect(result.fallback).toBe("fallback-value");
  });

  it("should return correct typed fallback", () => {
    const error = createTestError(DataTableErrorCode.DATA_FETCH_FAILED);
    const result = executeRecovery<unknown[]>(error, strategies);

    expect(result.fallback).toEqual([]);
  });
});

// ─── executeRecoveryWithRetry TESTS ──────────────────────────────────────────

describe("executeRecoveryWithRetry", () => {
  it("should return recovered=true on first success", async () => {
    const successStrategy: RecoveryStrategyConfig = {
      id: "success",
      codes: ["CODE"],
      recover: () => true,
      maxAttempts: 3,
      retryDelay: 10,
    };

    const error = createTestError("CODE");
    const result = await executeRecoveryWithRetry(error, successStrategy);

    expect(result.recovered).toBe(true);
  });

  it("should retry until maxAttempts", async () => {
    const recoverFn = vi.fn().mockReturnValue(false);
    const retryStrategy: RecoveryStrategyConfig = {
      id: "retry",
      codes: ["CODE"],
      recover: recoverFn,
      maxAttempts: 3,
      retryDelay: 10,
      getFallback: () => "fallback",
    };

    const error = createTestError("CODE");
    const onRetry = vi.fn();
    const result = await executeRecoveryWithRetry(error, retryStrategy, onRetry);

    expect(recoverFn).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2); // Called before retries 2 and 3
    expect(result.recovered).toBe(false);
    expect(result.fallback).toBe("fallback");
  });

  it("should succeed on later attempt", async () => {
    let attempts = 0;
    const laterSuccessStrategy: RecoveryStrategyConfig = {
      id: "later-success",
      codes: ["CODE"],
      recover: () => {
        attempts++;
        return attempts >= 2; // Succeed on second attempt
      },
      maxAttempts: 3,
      retryDelay: 10,
    };

    const error = createTestError("CODE");
    const result = await executeRecoveryWithRetry(error, laterSuccessStrategy);

    expect(result.recovered).toBe(true);
    expect(attempts).toBe(2);
  });

  it("should use default values when not specified", async () => {
    const minimalStrategy: RecoveryStrategyConfig = {
      id: "minimal",
      codes: ["CODE"],
      recover: () => false,
    };

    const error = createTestError("CODE");
    const result = await executeRecoveryWithRetry(error, minimalStrategy);

    expect(result.recovered).toBe(false);
  });

  it("should call onRetry with attempt and delay", async () => {
    const retryStrategy: RecoveryStrategyConfig = {
      id: "retry-callback",
      codes: ["CODE"],
      recover: () => false,
      maxAttempts: 3,
      retryDelay: 50,
    };

    const error = createTestError("CODE");
    const onRetry = vi.fn();
    await executeRecoveryWithRetry(error, retryStrategy, onRetry);

    expect(onRetry).toHaveBeenCalledWith(1, 50); // First retry
    expect(onRetry).toHaveBeenCalledWith(2, 100); // Second retry (linear backoff)
  });

  it("should handle recovery throwing during retries", async () => {
    let attempts = 0;
    const throwingStrategy: RecoveryStrategyConfig = {
      id: "throwing",
      codes: ["CODE"],
      recover: () => {
        attempts++;
        if (attempts < 3) throw new Error("Temp error");
        return true;
      },
      maxAttempts: 3,
      retryDelay: 10,
    };

    const error = createTestError("CODE");
    const result = await executeRecoveryWithRetry(error, throwingStrategy);

    expect(result.recovered).toBe(true);
    expect(attempts).toBe(3);
  });
});

// ─── createRecoveryStrategy TESTS ────────────────────────────────────────────

describe("createRecoveryStrategy", () => {
  it("should create strategy from config", () => {
    const config: RecoveryStrategyConfig = {
      id: "custom",
      codes: ["CUSTOM_CODE"],
      recover: () => true,
      getFallback: () => "fallback",
      maxAttempts: 5,
      retryDelay: 2000,
    };

    const strategy = createRecoveryStrategy(config);

    expect(strategy.id).toBe("custom");
    expect(strategy.codes).toEqual(["CUSTOM_CODE"]);
    expect(strategy.maxAttempts).toBe(5);
    expect(strategy.retryDelay).toBe(2000);
  });

  it("should create a copy of the config", () => {
    const config: RecoveryStrategyConfig = {
      id: "copy-test",
      codes: ["CODE"],
      recover: () => false,
    };

    const strategy = createRecoveryStrategy(config);

    expect(strategy).not.toBe(config);
    expect(strategy).toEqual(config);
  });
});

// ─── mergeRecoveryStrategies TESTS ───────────────────────────────────────────

describe("mergeRecoveryStrategies", () => {
  it("should include all default strategies", () => {
    const merged = mergeRecoveryStrategies([]);
    const ids = merged.map((s) => s.id);

    expect(ids).toContain("filter-error-recovery");
    expect(ids).toContain("sort-error-recovery");
  });

  it("should add custom strategies", () => {
    const custom: RecoveryStrategyConfig = {
      id: "custom-strategy",
      codes: ["CUSTOM"],
      recover: () => true,
    };

    const merged = mergeRecoveryStrategies([custom]);
    const ids = merged.map((s) => s.id);

    expect(ids).toContain("custom-strategy");
  });

  it("should override defaults with same id", () => {
    const override: RecoveryStrategyConfig = {
      id: "filter-error-recovery",
      codes: [DataTableErrorCode.FILTER_ERROR],
      recover: () => true, // Override to succeed
    };

    const merged = mergeRecoveryStrategies([override]);
    const filterStrategy = merged.find((s) => s.id === "filter-error-recovery");

    expect(filterStrategy).toBe(override);
    expect(filterStrategy?.recover(createTestError(DataTableErrorCode.FILTER_ERROR))).toBe(true);
  });

  it("should preserve original defaults when not overridden", () => {
    const custom: RecoveryStrategyConfig = {
      id: "custom-only",
      codes: ["CUSTOM"],
      recover: () => false,
    };

    const merged = mergeRecoveryStrategies([custom]);
    const sortStrategy = merged.find((s) => s.id === "sort-error-recovery");

    expect(sortStrategy).toBe(sortErrorRecovery);
  });
});

// ─── INTEGRATION TESTS ───────────────────────────────────────────────────────

describe("recovery integration", () => {
  it("should work with all default strategies", () => {
    const strategies = getDefaultRecoveryStrategies();

    // Filter error
    const filterError = createTestError(DataTableErrorCode.FILTER_ERROR);
    const filterResult = executeRecovery<boolean>(filterError, strategies);
    expect(filterResult.fallback).toBe(true);

    // Sort error
    const sortError = createTestError(DataTableErrorCode.SORT_ERROR);
    const sortResult = executeRecovery<number>(sortError, strategies);
    expect(sortResult.fallback).toBe(0);

    // Data fetch error
    const fetchError = createTestError(DataTableErrorCode.DATA_FETCH_FAILED);
    const fetchResult = executeRecovery<unknown[]>(fetchError, strategies);
    expect(fetchResult.fallback).toEqual([]);
  });

  it("should handle custom strategy with retry", async () => {
    let attemptCount = 0;
    const customWithRetry: RecoveryStrategyConfig = {
      id: "custom-retry",
      codes: ["RETRY_CODE"],
      recover: () => {
        attemptCount++;
        return attemptCount >= 3;
      },
      maxAttempts: 5,
      retryDelay: 10,
    };

    const error = createTestError("RETRY_CODE");
    const result = await executeRecoveryWithRetry(error, customWithRetry);

    expect(result.recovered).toBe(true);
    expect(attemptCount).toBe(3);
  });
});
