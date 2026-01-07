import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createLogger,
  logger,
  devWarn,
  logAndThrow,
  logRecoverable,
  withErrorLogging,
  withErrorLoggingSync,
  type LogLevel,
  type LogContext,
} from "../../utils/logger";
import { DataTableError, DataTableErrorCode } from "../../errors/base";

// ─── TEST HELPERS ────────────────────────────────────────────────────────────

let consoleDebug: ReturnType<typeof vi.spyOn>;
let consoleInfo: ReturnType<typeof vi.spyOn>;
let consoleWarn: ReturnType<typeof vi.spyOn>;
let consoleError: ReturnType<typeof vi.spyOn>;
let originalEnv: string | undefined;

beforeEach(() => {
  consoleDebug = vi.spyOn(console, "debug").mockImplementation(() => {});
  consoleInfo = vi.spyOn(console, "info").mockImplementation(() => {});
  consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  originalEnv = process.env.NODE_ENV;
});

afterEach(() => {
  consoleDebug.mockRestore();
  consoleInfo.mockRestore();
  consoleWarn.mockRestore();
  consoleError.mockRestore();
  process.env.NODE_ENV = originalEnv;
});

// ─── createLogger TESTS ──────────────────────────────────────────────────────

describe("createLogger", () => {
  it("should create a logger instance", () => {
    const log = createLogger();
    expect(log).toBeDefined();
    expect(typeof log.debug).toBe("function");
    expect(typeof log.info).toBe("function");
    expect(typeof log.warn).toBe("function");
    expect(typeof log.error).toBe("function");
  });

  it("should create logger with custom options", () => {
    const customHandler = vi.fn();
    const log = createLogger({
      minLevel: "warn",
      handler: customHandler,
      prefix: "CustomPrefix",
    });

    log.warn("Test message");
    expect(customHandler).toHaveBeenCalledWith("warn", "Test message", undefined);
  });

  it("should respect minLevel option", () => {
    const customHandler = vi.fn();
    const log = createLogger({
      minLevel: "warn",
      handler: customHandler,
    });

    log.debug("Debug message");
    log.info("Info message");
    log.warn("Warn message");
    log.error("Error message");

    expect(customHandler).toHaveBeenCalledTimes(2);
    expect(customHandler).toHaveBeenCalledWith("warn", "Warn message", undefined);
    expect(customHandler).toHaveBeenCalledWith("error", "Error message", undefined);
  });
});

// ─── Logger.debug TESTS ──────────────────────────────────────────────────────

describe("Logger.debug", () => {
  it("should log debug messages when minLevel is debug", () => {
    process.env.NODE_ENV = "development";
    const log = createLogger({ minLevel: "debug" });
    log.debug("Debug message");
    expect(consoleDebug).toHaveBeenCalled();
  });

  it("should include data in debug message", () => {
    process.env.NODE_ENV = "development";
    const log = createLogger({ minLevel: "debug" });
    log.debug("Debug message", { key: "value" });
    expect(consoleDebug).toHaveBeenCalled();
    const message = consoleDebug.mock.calls[0]![0] as string;
    expect(message).toContain("Debug message");
  });

  it("should not log debug when minLevel is higher", () => {
    const log = createLogger({ minLevel: "warn" });
    log.debug("Debug message");
    expect(consoleDebug).not.toHaveBeenCalled();
  });
});

// ─── Logger.info TESTS ───────────────────────────────────────────────────────

describe("Logger.info", () => {
  it("should log info messages when minLevel allows", () => {
    const log = createLogger({ minLevel: "info" });
    log.info("Info message");
    expect(consoleInfo).toHaveBeenCalled();
  });

  it("should include data in info message", () => {
    const log = createLogger({ minLevel: "info" });
    log.info("Info message", { count: 42 });
    expect(consoleInfo).toHaveBeenCalled();
  });

  it("should not log info when minLevel is higher", () => {
    const log = createLogger({ minLevel: "error" });
    log.info("Info message");
    expect(consoleInfo).not.toHaveBeenCalled();
  });
});

// ─── Logger.warn TESTS ───────────────────────────────────────────────────────

describe("Logger.warn", () => {
  it("should log warning messages", () => {
    const log = createLogger({ minLevel: "warn" });
    log.warn("Warning message");
    expect(consoleWarn).toHaveBeenCalled();
  });

  it("should include context in warning", () => {
    const log = createLogger({ minLevel: "warn" });
    log.warn("Warning message", { code: DataTableErrorCode.FILTER_ERROR });
    expect(consoleWarn).toHaveBeenCalled();
    const message = consoleWarn.mock.calls[0]![0] as string;
    expect(message).toContain("Warning message");
  });

  it("should not log warning when minLevel is error", () => {
    const log = createLogger({ minLevel: "error" });
    log.warn("Warning message");
    expect(consoleWarn).not.toHaveBeenCalled();
  });
});

// ─── Logger.error TESTS ──────────────────────────────────────────────────────

describe("Logger.error", () => {
  it("should log error messages", () => {
    const log = createLogger({ minLevel: "error" });
    log.error("Error message");
    expect(consoleError).toHaveBeenCalled();
  });

  it("should include context in error", () => {
    const log = createLogger({ minLevel: "error" });
    log.error("Error message", {
      code: DataTableErrorCode.FILTER_ERROR,
      data: { column: "name" },
    });
    expect(consoleError).toHaveBeenCalled();
  });

  it("should always log errors regardless of minLevel", () => {
    const log = createLogger({ minLevel: "error" });
    log.error("Error message");
    expect(consoleError).toHaveBeenCalled();
  });
});

// ─── Logger.logError TESTS ───────────────────────────────────────────────────

describe("Logger.logError", () => {
  it("should log a DataTableError", () => {
    const log = createLogger({ minLevel: "error" });
    const error = new DataTableError("Test error", DataTableErrorCode.FILTER_ERROR);

    log.logError(error);

    expect(consoleError).toHaveBeenCalled();
    const message = consoleError.mock.calls[0]![0] as string;
    expect(message).toContain("Test error");
  });

  it("should include error code in log", () => {
    const log = createLogger({ minLevel: "error" });
    const error = new DataTableError("Test error", DataTableErrorCode.FILTER_ERROR, {
      context: { column: "name" },
    });

    log.logError(error);

    expect(consoleError).toHaveBeenCalled();
    const message = consoleError.mock.calls[0]![0] as string;
    expect(message).toContain(DataTableErrorCode.FILTER_ERROR);
  });
});

// ─── Logger.child TESTS ──────────────────────────────────────────────────────

describe("Logger.child", () => {
  it("should create a child logger with source", () => {
    const log = createLogger({ minLevel: "info" });
    const childLog = log.child("TestComponent");

    expect(childLog).toBeDefined();
    expect(typeof childLog.debug).toBe("function");
    expect(typeof childLog.info).toBe("function");
    expect(typeof childLog.warn).toBe("function");
    expect(typeof childLog.error).toBe("function");
  });

  it("should include source in child logger messages", () => {
    const log = createLogger({ minLevel: "info" });
    const childLog = log.child("TestComponent");

    childLog.info("Test message");

    expect(consoleInfo).toHaveBeenCalled();
    const message = consoleInfo.mock.calls[0]![0] as string;
    expect(message).toContain("TestComponent");
  });

  it("should pass warnings through parent", () => {
    const log = createLogger({ minLevel: "warn" });
    const childLog = log.child("ChildSource");

    childLog.warn("Child warning");

    expect(consoleWarn).toHaveBeenCalled();
    const message = consoleWarn.mock.calls[0]![0] as string;
    expect(message).toContain("Child warning");
  });

  it("should pass errors through parent", () => {
    const log = createLogger({ minLevel: "error" });
    const childLog = log.child("ChildSource");

    childLog.error("Child error");

    expect(consoleError).toHaveBeenCalled();
  });
});

// ─── devWarn TESTS ───────────────────────────────────────────────────────────

describe("devWarn", () => {
  it("should warn in development mode", () => {
    process.env.NODE_ENV = "development";
    devWarn("Development warning");
    expect(consoleWarn).toHaveBeenCalled();
  });

  it("should not warn in production mode", () => {
    process.env.NODE_ENV = "production";
    devWarn("Development warning");
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it("should include context in warning", () => {
    process.env.NODE_ENV = "development";
    devWarn("Development warning", { source: "TestModule" });
    expect(consoleWarn).toHaveBeenCalled();
  });
});

// ─── logAndThrow TESTS ───────────────────────────────────────────────────────

describe("logAndThrow", () => {
  it("should log error and throw DataTableError", () => {
    expect(() => {
      logAndThrow("Error message", DataTableErrorCode.FILTER_ERROR);
    }).toThrow(DataTableError);

    expect(consoleError).toHaveBeenCalled();
  });

  it("should include error code in thrown error", () => {
    try {
      logAndThrow("Error message", DataTableErrorCode.SORT_ERROR);
    } catch (error) {
      expect(error).toBeInstanceOf(DataTableError);
      expect((error as DataTableError).code).toBe(DataTableErrorCode.SORT_ERROR);
    }
  });

  it("should include context in thrown error", () => {
    try {
      logAndThrow("Error message", DataTableErrorCode.EXPORT_ERROR, { format: "PDF" });
    } catch (error) {
      expect((error as DataTableError).context).toEqual({ format: "PDF" });
    }
  });
});

// ─── logRecoverable TESTS ────────────────────────────────────────────────────

describe("logRecoverable", () => {
  it("should log error without throwing", () => {
    expect(() => {
      logRecoverable("Recoverable error", DataTableErrorCode.FILTER_ERROR);
    }).not.toThrow();

    expect(consoleError).toHaveBeenCalled();
  });

  it("should include code in log", () => {
    logRecoverable("Recoverable error", DataTableErrorCode.FILTER_ERROR);

    expect(consoleError).toHaveBeenCalled();
    const message = consoleError.mock.calls[0]![0] as string;
    expect(message).toContain(DataTableErrorCode.FILTER_ERROR);
  });

  it("should include context in log", () => {
    logRecoverable("Recoverable error", DataTableErrorCode.FILTER_ERROR, { column: "name" });
    expect(consoleError).toHaveBeenCalled();
  });
});

// ─── withErrorLogging TESTS ──────────────────────────────────────────────────

describe("withErrorLogging", () => {
  it("should return result on success", async () => {
    const result = await withErrorLogging(
      async () => "success",
      "Operation failed"
    );

    expect(result).toBe("success");
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("should log and rethrow on error", async () => {
    const operation = async () => {
      throw new Error("Original error");
    };

    await expect(
      withErrorLogging(operation, "Operation failed", DataTableErrorCode.DATA_FETCH_FAILED)
    ).rejects.toThrow(DataTableError);

    expect(consoleError).toHaveBeenCalled();
  });

  it("should wrap original error", async () => {
    const originalError = new Error("Original");
    const operation = async () => {
      throw originalError;
    };

    try {
      await withErrorLogging(operation, "Wrapped error");
    } catch (error) {
      expect(error).toBeInstanceOf(DataTableError);
      expect((error as DataTableError).cause).toBe(originalError);
    }
  });

  it("should handle non-Error throws", async () => {
    const operation = async () => {
      throw "string error";
    };

    try {
      await withErrorLogging(operation, "Wrapped error");
    } catch (error) {
      expect(error).toBeInstanceOf(DataTableError);
      expect((error as DataTableError).context?.originalError).toBe("string error");
    }
  });
});

// ─── withErrorLoggingSync TESTS ──────────────────────────────────────────────

describe("withErrorLoggingSync", () => {
  it("should return result on success", () => {
    const result = withErrorLoggingSync(() => "success", "Operation failed");

    expect(result).toBe("success");
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("should log and rethrow on error", () => {
    const operation = () => {
      throw new Error("Original error");
    };

    expect(() =>
      withErrorLoggingSync(operation, "Operation failed", DataTableErrorCode.RENDER_ERROR)
    ).toThrow(DataTableError);

    expect(consoleError).toHaveBeenCalled();
  });

  it("should wrap original error", () => {
    const originalError = new Error("Original");
    const operation = () => {
      throw originalError;
    };

    try {
      withErrorLoggingSync(operation, "Wrapped error");
    } catch (error) {
      expect(error).toBeInstanceOf(DataTableError);
      expect((error as DataTableError).cause).toBe(originalError);
    }
  });

  it("should handle non-Error throws", () => {
    const operation = () => {
      throw { custom: "error" };
    };

    try {
      withErrorLoggingSync(operation, "Wrapped error");
    } catch (error) {
      expect(error).toBeInstanceOf(DataTableError);
      expect((error as DataTableError).context?.originalError).toContain("object");
    }
  });
});

// ─── Default logger TESTS ────────────────────────────────────────────────────

describe("default logger", () => {
  it("should be a logger instance", () => {
    expect(logger).toBeDefined();
    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
  });

  it("should use DataTable prefix", () => {
    logger.error("Test error");
    expect(consoleError).toHaveBeenCalled();
    const message = consoleError.mock.calls[0]![0] as string;
    expect(message).toContain("[DataTable]");
  });
});

// ─── Message formatting TESTS ────────────────────────────────────────────────

describe("message formatting", () => {
  it("should format message with prefix", () => {
    const log = createLogger({ prefix: "TestPrefix", minLevel: "warn" });
    log.warn("Test message");

    expect(consoleWarn).toHaveBeenCalled();
    const message = consoleWarn.mock.calls[0]![0] as string;
    expect(message).toContain("[TestPrefix]");
  });

  it("should format message with source using child logger", () => {
    const log = createLogger({ minLevel: "warn" });
    const childLog = log.child("TestSource");
    childLog.warn("Test message");

    expect(consoleWarn).toHaveBeenCalled();
    const message = consoleWarn.mock.calls[0]![0] as string;
    expect(message).toContain("TestSource");
  });

  it("should format message with error code", () => {
    const log = createLogger({ minLevel: "warn" });
    log.warn("Test message", { code: DataTableErrorCode.FILTER_ERROR });

    expect(consoleWarn).toHaveBeenCalled();
    const message = consoleWarn.mock.calls[0]![0] as string;
    expect(message).toContain(DataTableErrorCode.FILTER_ERROR);
  });

  it("should include data in development mode", () => {
    process.env.NODE_ENV = "development";
    const log = createLogger({ minLevel: "warn" });
    log.warn("Test message", { data: { key: "value" } });

    expect(consoleWarn).toHaveBeenCalled();
  });
});

// ─── Log level priority TESTS ────────────────────────────────────────────────

describe("log level priority", () => {
  it("should respect debug < info < warn < error priority", () => {
    const customHandler = vi.fn();
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];

    levels.forEach((minLevel) => {
      customHandler.mockClear();
      const log = createLogger({ minLevel, handler: customHandler });

      log.debug("debug");
      log.info("info");
      log.warn("warn");
      log.error("error");

      const expectedCalls = 4 - levels.indexOf(minLevel);
      expect(customHandler).toHaveBeenCalledTimes(expectedCalls);
    });
  });
});
