import { describe, it, expect } from "vitest";
import { ErrorCode } from "@unisane/kernel";
import {
  NotificationNotFoundError,
  NotificationDeliveryError,
  InvalidChannelError,
  TemplateNotFoundError,
} from "../domain/errors";

describe("Notify Errors", () => {
  describe("NotificationNotFoundError", () => {
    it("should create error with notification ID", () => {
      const error = new NotificationNotFoundError("notif123");

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.status).toBe(404);
      expect(error.message).toContain("notif123");
      expect(error.message).toContain("not found");
      expect(error.name).toBe("NotificationNotFoundError");
    });

    it("should include notification ID in message", () => {
      const error = new NotificationNotFoundError("notif-xyz-789");

      expect(error.message).toMatch(/notif-xyz-789/);
    });

    it("should not be retryable", () => {
      const error = new NotificationNotFoundError("notif456");

      expect(error.retryable).toBe(false);
    });

    it("should handle various notification ID formats", () => {
      const notifIds = [
        "notif123",
        "60f7b3b3c3b3c3b3c3b3c3b3",
        "notify-2024-01-15-001",
        "uuid-format-id",
      ];

      notifIds.forEach((notifId) => {
        const error = new NotificationNotFoundError(notifId);
        expect(error.message).toContain(notifId);
      });
    });
  });

  describe("NotificationDeliveryError", () => {
    it("should create error with channel and reason", () => {
      const error = new NotificationDeliveryError("email", "SMTP timeout");

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.NOTIFICATION_FAILED);
      expect(error.status).toBe(502);
      expect(error.message).toContain("email");
      expect(error.message).toContain("SMTP timeout");
      expect(error.name).toBe("NotificationDeliveryError");
    });

    it("should be retryable", () => {
      const error = new NotificationDeliveryError("sms", "Carrier unavailable");

      expect(error.retryable).toBe(true);
    });

    it("should handle different channel types", () => {
      const channels = [
        { channel: "email", reason: "SMTP error" },
        { channel: "sms", reason: "Carrier down" },
        { channel: "push", reason: "FCM timeout" },
        { channel: "in_app", reason: "WebSocket closed" },
        { channel: "slack", reason: "API rate limit" },
      ];

      channels.forEach(({ channel, reason }) => {
        const error = new NotificationDeliveryError(channel, reason);
        expect(error.message).toContain(channel);
        expect(error.message).toContain(reason);
      });
    });
  });

  describe("InvalidChannelError", () => {
    it("should create error with channel name", () => {
      const error = new InvalidChannelError("telegram");

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.status).toBe(400);
      expect(error.message).toContain("telegram");
      expect(error.message).toContain("Invalid");
      expect(error.name).toBe("InvalidChannelError");
    });

    it("should not be retryable", () => {
      const error = new InvalidChannelError("whatsapp");

      expect(error.retryable).toBe(false);
    });

    it("should handle various invalid channel names", () => {
      const invalidChannels = [
        "telegram",
        "whatsapp",
        "discord",
        "invalid-channel",
      ];

      invalidChannels.forEach((channel) => {
        const error = new InvalidChannelError(channel);
        expect(error.message).toContain(channel);
      });
    });
  });

  describe("TemplateNotFoundError", () => {
    it("should create error with template ID", () => {
      const error = new TemplateNotFoundError("welcome-email");

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.TEMPLATE_NOT_FOUND);
      expect(error.status).toBe(404);
      expect(error.message).toContain("welcome-email");
      expect(error.message).toContain("not found");
      expect(error.name).toBe("TemplateNotFoundError");
    });

    it("should not be retryable", () => {
      const error = new TemplateNotFoundError("password-reset");

      expect(error.retryable).toBe(false);
    });

    it("should handle various template ID formats", () => {
      const templateIds = [
        "welcome-email",
        "password-reset",
        "billing-invoice",
        "account-verification",
      ];

      templateIds.forEach((templateId) => {
        const error = new TemplateNotFoundError(templateId);
        expect(error.message).toContain(templateId);
      });
    });
  });

  describe("Error Type Guards", () => {
    it("should differentiate between error types", () => {
      const notFound = new NotificationNotFoundError("notif1");
      const delivery = new NotificationDeliveryError("email", "timeout");
      const invalidChannel = new InvalidChannelError("telegram");
      const template = new TemplateNotFoundError("template1");

      expect(notFound.code).toBe(ErrorCode.NOT_FOUND);
      expect(delivery.code).toBe(ErrorCode.NOTIFICATION_FAILED);
      expect(invalidChannel.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(template.code).toBe(ErrorCode.TEMPLATE_NOT_FOUND);
    });

    it("should have correct status codes", () => {
      const notFound = new NotificationNotFoundError("notif1");
      const delivery = new NotificationDeliveryError("email", "timeout");
      const invalidChannel = new InvalidChannelError("telegram");
      const template = new TemplateNotFoundError("template1");

      expect(notFound.status).toBe(404);
      expect(delivery.status).toBe(502);
      expect(invalidChannel.status).toBe(400);
      expect(template.status).toBe(404);
    });

    it("should only mark delivery error as retryable", () => {
      const notFound = new NotificationNotFoundError("notif1");
      const delivery = new NotificationDeliveryError("email", "timeout");
      const invalidChannel = new InvalidChannelError("telegram");
      const template = new TemplateNotFoundError("template1");

      expect(notFound.retryable).toBe(false);
      expect(delivery.retryable).toBe(true);
      expect(invalidChannel.retryable).toBe(false);
      expect(template.retryable).toBe(false);
    });

    it("should extend DomainError", () => {
      const notFound = new NotificationNotFoundError("notif1");
      const delivery = new NotificationDeliveryError("email", "timeout");
      const invalidChannel = new InvalidChannelError("telegram");
      const template = new TemplateNotFoundError("template1");

      expect(notFound).toBeInstanceOf(Error);
      expect(delivery).toBeInstanceOf(Error);
      expect(invalidChannel).toBeInstanceOf(Error);
      expect(template).toBeInstanceOf(Error);
    });
  });
});
