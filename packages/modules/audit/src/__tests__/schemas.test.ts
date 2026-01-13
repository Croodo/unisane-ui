import { describe, it, expect } from "vitest";
import { ZAuditLogView } from "../domain/schemas";

describe("Audit Schemas", () => {
  describe("ZAuditLogView", () => {
    it("should accept valid audit log with all fields", () => {
      const result = ZAuditLogView.safeParse({
        id: "log123",
        action: "user.created",
        resourceType: "user",
        resourceId: "user456",
        actorId: "admin789",
        requestId: "req-abc-123",
        ip: "192.168.1.1",
        ua: "Mozilla/5.0",
        createdAt: "2024-01-15T10:30:00Z",
      });

      expect(result.success).toBe(true);
    });

    it("should accept audit log with minimal required fields", () => {
      const result = ZAuditLogView.safeParse({
        id: "log123",
        action: "user.login",
        resourceType: "auth",
      });

      expect(result.success).toBe(true);
    });

    it("should accept null values for optional fields", () => {
      const result = ZAuditLogView.safeParse({
        id: "log123",
        action: "system.startup",
        resourceType: "system",
        resourceId: null,
        actorId: null,
        requestId: null,
        ip: null,
        ua: null,
      });

      expect(result.success).toBe(true);
    });

    it("should accept audit log without optional fields", () => {
      const result = ZAuditLogView.safeParse({
        id: "log456",
        action: "data.export",
        resourceType: "report",
      });

      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = ZAuditLogView.safeParse({
        action: "user.deleted",
        resourceType: "user",
      });

      expect(result.success).toBe(false);
    });

    it("should reject missing action", () => {
      const result = ZAuditLogView.safeParse({
        id: "log123",
        resourceType: "user",
      });

      expect(result.success).toBe(false);
    });

    it("should reject missing resourceType", () => {
      const result = ZAuditLogView.safeParse({
        id: "log123",
        action: "user.created",
      });

      expect(result.success).toBe(false);
    });

    it("should accept empty strings for optional string fields", () => {
      const result = ZAuditLogView.safeParse({
        id: "log123",
        action: "test.action",
        resourceType: "test",
        actorId: "",
        ip: "",
      });

      expect(result.success).toBe(true);
    });

    it("should accept ISO 8601 date strings", () => {
      const result = ZAuditLogView.safeParse({
        id: "log123",
        action: "user.updated",
        resourceType: "user",
        createdAt: "2024-01-15T10:30:00.000Z",
      });

      expect(result.success).toBe(true);
    });

    it("should accept audit log with IP address", () => {
      const result = ZAuditLogView.safeParse({
        id: "log123",
        action: "user.login",
        resourceType: "auth",
        ip: "203.0.113.42",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ip).toBe("203.0.113.42");
      }
    });

    it("should accept audit log with user agent", () => {
      const result = ZAuditLogView.safeParse({
        id: "log123",
        action: "api.call",
        resourceType: "endpoint",
        ua: "curl/7.68.0",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ua).toBe("curl/7.68.0");
      }
    });

    it("should accept audit log with request tracking", () => {
      const result = ZAuditLogView.safeParse({
        id: "log123",
        action: "payment.processed",
        resourceType: "transaction",
        requestId: "req-payment-xyz789",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.requestId).toBe("req-payment-xyz789");
      }
    });

    it("should handle various action naming conventions", () => {
      const actions = [
        "user.created",
        "USER_DELETED",
        "api-call",
        "system:restart",
        "data_export",
      ];

      actions.forEach((action) => {
        const result = ZAuditLogView.safeParse({
          id: "log123",
          action,
          resourceType: "test",
        });
        expect(result.success).toBe(true);
      });
    });

    it("should handle various resource types", () => {
      const resourceTypes = [
        "user",
        "organization",
        "billing",
        "settings",
        "file",
      ];

      resourceTypes.forEach((resourceType) => {
        const result = ZAuditLogView.safeParse({
          id: "log123",
          action: "test.action",
          resourceType,
        });
        expect(result.success).toBe(true);
      });
    });

    it("should accept IPv6 addresses", () => {
      const result = ZAuditLogView.safeParse({
        id: "log123",
        action: "user.login",
        resourceType: "auth",
        ip: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
      });

      expect(result.success).toBe(true);
    });

    it("should accept complex user agent strings", () => {
      const result = ZAuditLogView.safeParse({
        id: "log123",
        action: "page.view",
        resourceType: "analytics",
        ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      });

      expect(result.success).toBe(true);
    });
  });
});
