import { describe, it, expect } from "vitest";
import { ErrorCode } from "@unisane/kernel";
import {
  SettingNotFoundError,
  SettingVersionConflictError,
  SettingAccessDeniedError,
  SettingValidationError,
  UnknownNamespaceError,
} from "../domain/errors";

describe("Settings Errors", () => {
  describe("SettingNotFoundError", () => {
    it("should create error with namespace and key", () => {
      const error = new SettingNotFoundError("app", "theme");

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.status).toBe(404);
      expect(error.message).toContain("app");
      expect(error.message).toContain("theme");
    });

    it("should have correct error properties", () => {
      const error = new SettingNotFoundError("billing", "subscription_plan");

      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.status).toBe(404);
      expect(error.retryable).toBe(false);
    });

    it("should include namespace and key in message", () => {
      const error = new SettingNotFoundError("auth", "session_timeout");

      expect(error.message).toMatch(/auth/);
      expect(error.message).toMatch(/session_timeout/);
    });
  });

  describe("SettingVersionConflictError", () => {
    it("should create error with namespace, key, and expected version", () => {
      const error = new SettingVersionConflictError("app", "theme", 5);

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.CONFLICT);
      expect(error.status).toBe(409);
      expect(error.message).toContain("app");
      expect(error.message).toContain("theme");
      expect(error.message).toContain("5");
    });

    it("should be retryable", () => {
      const error = new SettingVersionConflictError("billing", "plan", 2);

      expect(error.retryable).toBe(true);
    });

    it("should include namespace, key, and version in message", () => {
      const error = new SettingVersionConflictError("auth", "timeout", 10);

      expect(error.message).toMatch(/auth/);
      expect(error.message).toMatch(/timeout/);
      expect(error.message).toMatch(/10/);
    });

    it("should handle version 0 conflicts", () => {
      const error = new SettingVersionConflictError("flags", "new_flag", 0);

      expect(error.message).toContain("0");
      expect(error.status).toBe(409);
    });
  });

  describe("SettingAccessDeniedError", () => {
    it("should create error with namespace and key", () => {
      const error = new SettingAccessDeniedError("app", "platform_secret");

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.PERMISSION_DENIED);
      expect(error.status).toBe(403);
    });

    it("should not be retryable", () => {
      const error = new SettingAccessDeniedError("billing", "api_key");

      expect(error.retryable).toBe(false);
    });

    it("should include namespace and key in message", () => {
      const error = new SettingAccessDeniedError("flags", "internal_flag");

      expect(error.message).toMatch(/flags/);
      expect(error.message).toMatch(/internal_flag/);
    });

    it("should indicate permission denial in message", () => {
      const error = new SettingAccessDeniedError("notify", "webhook_secret");

      expect(error.message.toLowerCase()).toMatch(/permission|access|denied|admin/);
    });
  });

  describe("SettingValidationError", () => {
    it("should create error with namespace, key, and reason", () => {
      const error = new SettingValidationError(
        "app",
        "theme",
        "Invalid theme value"
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.status).toBe(400);
    });

    it("should not be retryable", () => {
      const error = new SettingValidationError(
        "billing",
        "amount",
        "Must be positive"
      );

      expect(error.retryable).toBe(false);
    });

    it("should include all context in message", () => {
      const error = new SettingValidationError(
        "auth",
        "max_sessions",
        "Must be between 1 and 10"
      );

      expect(error.message).toMatch(/auth/);
      expect(error.message).toMatch(/max_sessions/);
      expect(error.message).toMatch(/Must be between 1 and 10/);
    });

    it("should handle complex validation reasons", () => {
      const reason = "Expected object with {host, port}, got string";
      const error = new SettingValidationError("notify", "smtp_config", reason);

      expect(error.message).toContain(reason);
    });
  });

  describe("UnknownNamespaceError", () => {
    it("should create error with namespace", () => {
      const error = new UnknownNamespaceError("invalid_ns");

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.status).toBe(404);
    });

    it("should not be retryable", () => {
      const error = new UnknownNamespaceError("bad_namespace");

      expect(error.retryable).toBe(false);
    });

    it("should include namespace in message", () => {
      const error = new UnknownNamespaceError("xyz");

      expect(error.message).toMatch(/xyz/);
    });

    it("should indicate namespace is unknown", () => {
      const error = new UnknownNamespaceError("deprecated");

      expect(error.message.toLowerCase()).toMatch(/unknown|invalid|namespace/);
    });
  });

  describe("Error Type Guards", () => {
    it("should differentiate between error types", () => {
      const notFound = new SettingNotFoundError("app", "key");
      const conflict = new SettingVersionConflictError("app", "key", 2);
      const denied = new SettingAccessDeniedError("app", "key");
      const validation = new SettingValidationError("app", "key", "reason");
      const unknown = new UnknownNamespaceError("ns");

      expect(notFound.code).toBe(ErrorCode.NOT_FOUND);
      expect(conflict.code).toBe(ErrorCode.CONFLICT);
      expect(denied.code).toBe(ErrorCode.PERMISSION_DENIED);
      expect(validation.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(unknown.code).toBe(ErrorCode.NOT_FOUND);
    });

    it("should have unique status codes", () => {
      const notFound = new SettingNotFoundError("app", "key");
      const conflict = new SettingVersionConflictError("app", "key", 2);
      const denied = new SettingAccessDeniedError("app", "key");
      const validation = new SettingValidationError("app", "key", "reason");

      expect(notFound.status).toBe(404);
      expect(conflict.status).toBe(409);
      expect(denied.status).toBe(403);
      expect(validation.status).toBe(400);
    });

    it("should only mark conflicts as retryable", () => {
      const notFound = new SettingNotFoundError("app", "key");
      const conflict = new SettingVersionConflictError("app", "key", 2);
      const denied = new SettingAccessDeniedError("app", "key");
      const validation = new SettingValidationError("app", "key", "reason");

      expect(notFound.retryable).toBe(false);
      expect(conflict.retryable).toBe(true);
      expect(denied.retryable).toBe(false);
      expect(validation.retryable).toBe(false);
    });
  });
});
