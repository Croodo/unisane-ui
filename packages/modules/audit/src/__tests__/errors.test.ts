import { describe, it, expect } from "vitest";
import { ErrorCode } from "@unisane/kernel";
import {
  AuditLogNotFoundError,
  AuditLogImmutableError,
} from "../domain/errors";

describe("Audit Errors", () => {
  describe("AuditLogNotFoundError", () => {
    it("should create error with log ID", () => {
      const error = new AuditLogNotFoundError("log123");

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.status).toBe(404);
      expect(error.message).toContain("log123");
      expect(error.message).toContain("not found");
      expect(error.name).toBe("AuditLogNotFoundError");
    });

    it("should include log ID in message", () => {
      const error = new AuditLogNotFoundError("audit-log-xyz-789");

      expect(error.message).toMatch(/audit-log-xyz-789/);
    });

    it("should not be retryable", () => {
      const error = new AuditLogNotFoundError("log456");

      expect(error.retryable).toBe(false);
    });

    it("should handle various log ID formats", () => {
      const logIds = [
        "log123",
        "60f7b3b3c3b3c3b3c3b3c3b3",
        "audit-2024-01-15-001",
        "uuid-format-id",
      ];

      logIds.forEach((logId) => {
        const error = new AuditLogNotFoundError(logId);
        expect(error.message).toContain(logId);
      });
    });
  });

  describe("AuditLogImmutableError", () => {
    it("should create error without parameters", () => {
      const error = new AuditLogImmutableError();

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.FORBIDDEN);
      expect(error.status).toBe(403);
      expect(error.message).toContain("immutable");
      expect(error.message).toContain("cannot be modified");
      expect(error.name).toBe("AuditLogImmutableError");
    });

    it("should not be retryable", () => {
      const error = new AuditLogImmutableError();

      expect(error.retryable).toBe(false);
    });

    it("should have clear message about immutability", () => {
      const error = new AuditLogImmutableError();

      expect(error.message.toLowerCase()).toMatch(/immutable/);
    });
  });

  describe("Error Type Guards", () => {
    it("should differentiate between error types", () => {
      const notFound = new AuditLogNotFoundError("log1");
      const immutable = new AuditLogImmutableError();

      expect(notFound.code).toBe(ErrorCode.NOT_FOUND);
      expect(immutable.code).toBe(ErrorCode.FORBIDDEN);
    });

    it("should have correct status codes", () => {
      const notFound = new AuditLogNotFoundError("log1");
      const immutable = new AuditLogImmutableError();

      expect(notFound.status).toBe(404);
      expect(immutable.status).toBe(403);
    });

    it("should both be non-retryable", () => {
      const notFound = new AuditLogNotFoundError("log1");
      const immutable = new AuditLogImmutableError();

      expect(notFound.retryable).toBe(false);
      expect(immutable.retryable).toBe(false);
    });

    it("should extend DomainError", () => {
      const notFound = new AuditLogNotFoundError("log1");
      const immutable = new AuditLogImmutableError();

      expect(notFound).toBeInstanceOf(Error);
      expect(immutable).toBeInstanceOf(Error);
    });
  });
});
