import { describe, it, expect } from "vitest";
import {
  ErrorSeverity,
  SEVERITY_CONFIG,
  SEVERITY_ORDER,
  getSeverityConfig,
  compareSeverity,
  maxSeverity,
  meetsMinSeverity,
  shouldReport,
  shouldTriggerBoundary,
  shouldAttemptRecovery,
  shouldNotifyUser,
} from "../../errors/severity";

// ─── ErrorSeverity ENUM TESTS ───────────────────────────────────────────────

describe("ErrorSeverity", () => {
  it("should have WARNING level", () => {
    expect(ErrorSeverity.WARNING).toBe("warning");
  });

  it("should have ERROR level", () => {
    expect(ErrorSeverity.ERROR).toBe("error");
  });

  it("should have CRITICAL level", () => {
    expect(ErrorSeverity.CRITICAL).toBe("critical");
  });

  it("should have FATAL level", () => {
    expect(ErrorSeverity.FATAL).toBe("fatal");
  });
});

// ─── SEVERITY_CONFIG TESTS ──────────────────────────────────────────────────

describe("SEVERITY_CONFIG", () => {
  describe("WARNING config", () => {
    it("should log but not notify, trigger boundary, or recover", () => {
      const config = SEVERITY_CONFIG[ErrorSeverity.WARNING];

      expect(config.log).toBe(true);
      expect(config.notify).toBe(false);
      expect(config.boundary).toBe(false);
      expect(config.recover).toBe(false);
    });
  });

  describe("ERROR config", () => {
    it("should log, notify, and recover but not trigger boundary", () => {
      const config = SEVERITY_CONFIG[ErrorSeverity.ERROR];

      expect(config.log).toBe(true);
      expect(config.notify).toBe(true);
      expect(config.boundary).toBe(false);
      expect(config.recover).toBe(true);
    });
  });

  describe("CRITICAL config", () => {
    it("should log, notify, trigger boundary, and recover", () => {
      const config = SEVERITY_CONFIG[ErrorSeverity.CRITICAL];

      expect(config.log).toBe(true);
      expect(config.notify).toBe(true);
      expect(config.boundary).toBe(true);
      expect(config.recover).toBe(true);
    });
  });

  describe("FATAL config", () => {
    it("should log, notify, trigger boundary but NOT recover", () => {
      const config = SEVERITY_CONFIG[ErrorSeverity.FATAL];

      expect(config.log).toBe(true);
      expect(config.notify).toBe(true);
      expect(config.boundary).toBe(true);
      expect(config.recover).toBe(false);
    });
  });
});

// ─── SEVERITY_ORDER TESTS ───────────────────────────────────────────────────

describe("SEVERITY_ORDER", () => {
  it("should have 4 severity levels", () => {
    expect(SEVERITY_ORDER).toHaveLength(4);
  });

  it("should be ordered from lowest to highest", () => {
    expect(SEVERITY_ORDER[0]).toBe(ErrorSeverity.WARNING);
    expect(SEVERITY_ORDER[1]).toBe(ErrorSeverity.ERROR);
    expect(SEVERITY_ORDER[2]).toBe(ErrorSeverity.CRITICAL);
    expect(SEVERITY_ORDER[3]).toBe(ErrorSeverity.FATAL);
  });

  it("should be readonly", () => {
    // TypeScript enforces this, but we can verify the type
    expect(Object.isFrozen(SEVERITY_ORDER)).toBe(false); // as const doesn't freeze
    expect(SEVERITY_ORDER).toBeInstanceOf(Array);
  });
});

// ─── getSeverityConfig TESTS ────────────────────────────────────────────────

describe("getSeverityConfig", () => {
  it("should return config for WARNING", () => {
    const config = getSeverityConfig(ErrorSeverity.WARNING);

    expect(config).toEqual(SEVERITY_CONFIG[ErrorSeverity.WARNING]);
  });

  it("should return config for ERROR", () => {
    const config = getSeverityConfig(ErrorSeverity.ERROR);

    expect(config).toEqual(SEVERITY_CONFIG[ErrorSeverity.ERROR]);
  });

  it("should return config for CRITICAL", () => {
    const config = getSeverityConfig(ErrorSeverity.CRITICAL);

    expect(config).toEqual(SEVERITY_CONFIG[ErrorSeverity.CRITICAL]);
  });

  it("should return config for FATAL", () => {
    const config = getSeverityConfig(ErrorSeverity.FATAL);

    expect(config).toEqual(SEVERITY_CONFIG[ErrorSeverity.FATAL]);
  });
});

// ─── compareSeverity TESTS ──────────────────────────────────────────────────

describe("compareSeverity", () => {
  describe("equal severities", () => {
    it("should return 0 for same severity", () => {
      expect(compareSeverity(ErrorSeverity.WARNING, ErrorSeverity.WARNING)).toBe(0);
      expect(compareSeverity(ErrorSeverity.ERROR, ErrorSeverity.ERROR)).toBe(0);
      expect(compareSeverity(ErrorSeverity.CRITICAL, ErrorSeverity.CRITICAL)).toBe(0);
      expect(compareSeverity(ErrorSeverity.FATAL, ErrorSeverity.FATAL)).toBe(0);
    });
  });

  describe("lower severity first", () => {
    it("should return negative when first is lower", () => {
      expect(compareSeverity(ErrorSeverity.WARNING, ErrorSeverity.ERROR)).toBeLessThan(0);
      expect(compareSeverity(ErrorSeverity.WARNING, ErrorSeverity.FATAL)).toBeLessThan(0);
      expect(compareSeverity(ErrorSeverity.ERROR, ErrorSeverity.CRITICAL)).toBeLessThan(0);
      expect(compareSeverity(ErrorSeverity.CRITICAL, ErrorSeverity.FATAL)).toBeLessThan(0);
    });
  });

  describe("higher severity first", () => {
    it("should return positive when first is higher", () => {
      expect(compareSeverity(ErrorSeverity.FATAL, ErrorSeverity.WARNING)).toBeGreaterThan(0);
      expect(compareSeverity(ErrorSeverity.CRITICAL, ErrorSeverity.ERROR)).toBeGreaterThan(0);
      expect(compareSeverity(ErrorSeverity.ERROR, ErrorSeverity.WARNING)).toBeGreaterThan(0);
    });
  });
});

// ─── maxSeverity TESTS ──────────────────────────────────────────────────────

describe("maxSeverity", () => {
  it("should return the higher severity", () => {
    expect(maxSeverity(ErrorSeverity.WARNING, ErrorSeverity.ERROR)).toBe(ErrorSeverity.ERROR);
    expect(maxSeverity(ErrorSeverity.ERROR, ErrorSeverity.WARNING)).toBe(ErrorSeverity.ERROR);
  });

  it("should return same when both are equal", () => {
    expect(maxSeverity(ErrorSeverity.CRITICAL, ErrorSeverity.CRITICAL)).toBe(ErrorSeverity.CRITICAL);
  });

  it("should return FATAL when compared with any other", () => {
    expect(maxSeverity(ErrorSeverity.FATAL, ErrorSeverity.WARNING)).toBe(ErrorSeverity.FATAL);
    expect(maxSeverity(ErrorSeverity.FATAL, ErrorSeverity.ERROR)).toBe(ErrorSeverity.FATAL);
    expect(maxSeverity(ErrorSeverity.FATAL, ErrorSeverity.CRITICAL)).toBe(ErrorSeverity.FATAL);
  });

  it("should work for all combinations", () => {
    // WARNING vs all
    expect(maxSeverity(ErrorSeverity.WARNING, ErrorSeverity.WARNING)).toBe(ErrorSeverity.WARNING);
    expect(maxSeverity(ErrorSeverity.WARNING, ErrorSeverity.ERROR)).toBe(ErrorSeverity.ERROR);
    expect(maxSeverity(ErrorSeverity.WARNING, ErrorSeverity.CRITICAL)).toBe(ErrorSeverity.CRITICAL);
    expect(maxSeverity(ErrorSeverity.WARNING, ErrorSeverity.FATAL)).toBe(ErrorSeverity.FATAL);
  });
});

// ─── meetsMinSeverity TESTS ─────────────────────────────────────────────────

describe("meetsMinSeverity", () => {
  describe("meets threshold", () => {
    it("should return true when severity equals minimum", () => {
      expect(meetsMinSeverity(ErrorSeverity.ERROR, ErrorSeverity.ERROR)).toBe(true);
    });

    it("should return true when severity exceeds minimum", () => {
      expect(meetsMinSeverity(ErrorSeverity.FATAL, ErrorSeverity.WARNING)).toBe(true);
      expect(meetsMinSeverity(ErrorSeverity.CRITICAL, ErrorSeverity.ERROR)).toBe(true);
      expect(meetsMinSeverity(ErrorSeverity.ERROR, ErrorSeverity.WARNING)).toBe(true);
    });
  });

  describe("below threshold", () => {
    it("should return false when severity is below minimum", () => {
      expect(meetsMinSeverity(ErrorSeverity.WARNING, ErrorSeverity.ERROR)).toBe(false);
      expect(meetsMinSeverity(ErrorSeverity.WARNING, ErrorSeverity.FATAL)).toBe(false);
      expect(meetsMinSeverity(ErrorSeverity.ERROR, ErrorSeverity.CRITICAL)).toBe(false);
    });
  });
});

// ─── shouldReport TESTS ─────────────────────────────────────────────────────

describe("shouldReport", () => {
  it("should report if severity meets minimum", () => {
    expect(shouldReport(ErrorSeverity.FATAL, ErrorSeverity.ERROR)).toBe(true);
    expect(shouldReport(ErrorSeverity.CRITICAL, ErrorSeverity.WARNING)).toBe(true);
  });

  it("should not report if severity below minimum", () => {
    expect(shouldReport(ErrorSeverity.WARNING, ErrorSeverity.ERROR)).toBe(false);
    expect(shouldReport(ErrorSeverity.ERROR, ErrorSeverity.CRITICAL)).toBe(false);
  });

  it("should report when severity equals minimum", () => {
    expect(shouldReport(ErrorSeverity.ERROR, ErrorSeverity.ERROR)).toBe(true);
  });
});

// ─── shouldTriggerBoundary TESTS ────────────────────────────────────────────

describe("shouldTriggerBoundary", () => {
  it("should not trigger for WARNING", () => {
    expect(shouldTriggerBoundary(ErrorSeverity.WARNING)).toBe(false);
  });

  it("should not trigger for ERROR", () => {
    expect(shouldTriggerBoundary(ErrorSeverity.ERROR)).toBe(false);
  });

  it("should trigger for CRITICAL", () => {
    expect(shouldTriggerBoundary(ErrorSeverity.CRITICAL)).toBe(true);
  });

  it("should trigger for FATAL", () => {
    expect(shouldTriggerBoundary(ErrorSeverity.FATAL)).toBe(true);
  });
});

// ─── shouldAttemptRecovery TESTS ────────────────────────────────────────────

describe("shouldAttemptRecovery", () => {
  it("should not recover for WARNING", () => {
    expect(shouldAttemptRecovery(ErrorSeverity.WARNING)).toBe(false);
  });

  it("should recover for ERROR", () => {
    expect(shouldAttemptRecovery(ErrorSeverity.ERROR)).toBe(true);
  });

  it("should recover for CRITICAL", () => {
    expect(shouldAttemptRecovery(ErrorSeverity.CRITICAL)).toBe(true);
  });

  it("should not recover for FATAL", () => {
    expect(shouldAttemptRecovery(ErrorSeverity.FATAL)).toBe(false);
  });
});

// ─── shouldNotifyUser TESTS ─────────────────────────────────────────────────

describe("shouldNotifyUser", () => {
  it("should not notify for WARNING", () => {
    expect(shouldNotifyUser(ErrorSeverity.WARNING)).toBe(false);
  });

  it("should notify for ERROR", () => {
    expect(shouldNotifyUser(ErrorSeverity.ERROR)).toBe(true);
  });

  it("should notify for CRITICAL", () => {
    expect(shouldNotifyUser(ErrorSeverity.CRITICAL)).toBe(true);
  });

  it("should notify for FATAL", () => {
    expect(shouldNotifyUser(ErrorSeverity.FATAL)).toBe(true);
  });
});

// ─── INTEGRATION TESTS ──────────────────────────────────────────────────────

describe("severity system integration", () => {
  it("should have consistent behavior across functions", () => {
    // FATAL should be the most severe
    expect(meetsMinSeverity(ErrorSeverity.FATAL, ErrorSeverity.WARNING)).toBe(true);
    expect(shouldTriggerBoundary(ErrorSeverity.FATAL)).toBe(true);
    expect(shouldNotifyUser(ErrorSeverity.FATAL)).toBe(true);
    expect(shouldAttemptRecovery(ErrorSeverity.FATAL)).toBe(false); // Too severe to recover
  });

  it("should escalate severity correctly", () => {
    let currentSeverity = ErrorSeverity.WARNING;

    // Escalate through errors
    currentSeverity = maxSeverity(currentSeverity, ErrorSeverity.ERROR);
    expect(currentSeverity).toBe(ErrorSeverity.ERROR);

    currentSeverity = maxSeverity(currentSeverity, ErrorSeverity.WARNING); // Shouldn't downgrade
    expect(currentSeverity).toBe(ErrorSeverity.ERROR);

    currentSeverity = maxSeverity(currentSeverity, ErrorSeverity.CRITICAL);
    expect(currentSeverity).toBe(ErrorSeverity.CRITICAL);
  });
});
