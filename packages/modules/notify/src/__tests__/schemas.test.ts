import { describe, it, expect } from "vitest";
import {
  ZEmailAddress,
  ZEmailEnqueue,
  ZPrefUpdate,
  ZMarkRead,
} from "../domain/schemas";

describe("Notify Schemas", () => {
  describe("ZEmailAddress", () => {
    it("should accept valid email address with name", () => {
      const result = ZEmailAddress.safeParse({
        email: "user@example.com",
        name: "John Doe",
      });

      expect(result.success).toBe(true);
    });

    it("should accept email without name", () => {
      const result = ZEmailAddress.safeParse({
        email: "user@example.com",
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const result = ZEmailAddress.safeParse({
        email: "not-an-email",
        name: "John Doe",
      });

      expect(result.success).toBe(false);
    });

    it("should accept various valid email formats", () => {
      const validEmails = [
        "simple@example.com",
        "user.name@example.com",
        "user+tag@example.co.uk",
        "first.last@subdomain.example.com",
      ];

      validEmails.forEach((email) => {
        const result = ZEmailAddress.safeParse({ email });
        expect(result.success).toBe(true);
      });
    });

    it("should require email field", () => {
      const result = ZEmailAddress.safeParse({
        name: "John Doe",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("ZEmailEnqueue", () => {
    it("should accept valid email enqueue with minimal fields", () => {
      const result = ZEmailEnqueue.safeParse({
        to: { email: "user@example.com" },
        template: "welcome-email",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.props).toEqual({});
      }
    });

    it("should accept email with recipient name", () => {
      const result = ZEmailEnqueue.safeParse({
        to: { email: "user@example.com", name: "John Doe" },
        template: "welcome-email",
      });

      expect(result.success).toBe(true);
    });

    it("should accept template props", () => {
      const result = ZEmailEnqueue.safeParse({
        to: { email: "user@example.com" },
        template: "password-reset",
        props: {
          resetLink: "https://example.com/reset/abc123",
          userName: "John",
          expiryMinutes: 30,
        },
      });

      expect(result.success).toBe(true);
    });

    it("should accept notification category", () => {
      const categories = ["billing", "alerts", "product_updates", "system"];

      categories.forEach((category) => {
        const result = ZEmailEnqueue.safeParse({
          to: { email: "user@example.com" },
          template: "test-template",
          category,
        });
        expect(result.success).toBe(true);
      });
    });

    it("should accept locale", () => {
      const result = ZEmailEnqueue.safeParse({
        to: { email: "user@example.com" },
        template: "welcome-email",
        locale: "en-US",
      });

      expect(result.success).toBe(true);
    });

    it("should accept all fields together", () => {
      const result = ZEmailEnqueue.safeParse({
        to: { email: "user@example.com", name: "John Doe" },
        template: "billing-invoice",
        props: {
          invoiceNumber: "INV-2024-001",
          amount: 99.99,
          currency: "USD",
        },
        category: "billing",
        locale: "en-US",
      });

      expect(result.success).toBe(true);
    });

    it("should default props to empty object", () => {
      const result = ZEmailEnqueue.safeParse({
        to: { email: "user@example.com" },
        template: "test-template",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.props).toEqual({});
        expect(typeof result.data.props).toBe("object");
      }
    });

    it("should reject empty template", () => {
      const result = ZEmailEnqueue.safeParse({
        to: { email: "user@example.com" },
        template: "",
      });

      expect(result.success).toBe(false);
    });

    it("should reject invalid email address", () => {
      const result = ZEmailEnqueue.safeParse({
        to: { email: "not-an-email" },
        template: "test-template",
      });

      expect(result.success).toBe(false);
    });

    it("should reject invalid category", () => {
      const result = ZEmailEnqueue.safeParse({
        to: { email: "user@example.com" },
        template: "test-template",
        category: "invalid-category",
      });

      expect(result.success).toBe(false);
    });

    it("should accept props with various value types", () => {
      const result = ZEmailEnqueue.safeParse({
        to: { email: "user@example.com" },
        template: "test-template",
        props: {
          string: "text",
          number: 42,
          boolean: true,
          null: null,
          array: [1, 2, 3],
          object: { nested: "value" },
        },
      });

      expect(result.success).toBe(true);
    });
  });

  describe("ZPrefUpdate", () => {
    it("should accept preference updates with boolean values", () => {
      const result = ZPrefUpdate.safeParse({
        categories: {
          billing: true,
          alerts: false,
          product_updates: true,
          system: true,
        },
      });

      expect(result.success).toBe(true);
    });

    it("should accept partial category updates", () => {
      const result = ZPrefUpdate.safeParse({
        categories: {
          billing: false,
          alerts: true,
        },
      });

      expect(result.success).toBe(true);
    });

    it("should accept empty categories object", () => {
      const result = ZPrefUpdate.safeParse({
        categories: {},
      });

      expect(result.success).toBe(true);
    });

    it("should reject non-boolean values", () => {
      const result = ZPrefUpdate.safeParse({
        categories: {
          billing: "yes",
          alerts: 1,
        },
      });

      expect(result.success).toBe(false);
    });

    it("should require categories field", () => {
      const result = ZPrefUpdate.safeParse({});

      expect(result.success).toBe(false);
    });

    it("should accept standard notification categories", () => {
      const standardCategories = {
        billing: true,
        alerts: true,
        product_updates: false,
        system: true,
      };

      const result = ZPrefUpdate.safeParse({
        categories: standardCategories,
      });

      expect(result.success).toBe(true);
    });

    it("should accept custom category keys", () => {
      const result = ZPrefUpdate.safeParse({
        categories: {
          "custom-notification": true,
          "another_custom": false,
        },
      });

      expect(result.success).toBe(true);
    });
  });

  describe("ZMarkRead", () => {
    it("should accept valid notification ID", () => {
      const result = ZMarkRead.safeParse({
        id: "notif123",
      });

      expect(result.success).toBe(true);
    });

    it("should accept various ID formats", () => {
      const validIds = [
        "notif123",
        "60f7b3b3c3b3c3b3c3b3c3b3",
        "notify-2024-01-15-001",
        "uuid-format-id",
        "abc-123-def-456",
      ];

      validIds.forEach((id) => {
        const result = ZMarkRead.safeParse({ id });
        expect(result.success).toBe(true);
      });
    });

    it("should reject empty ID", () => {
      const result = ZMarkRead.safeParse({
        id: "",
      });

      expect(result.success).toBe(false);
    });

    it("should require id field", () => {
      const result = ZMarkRead.safeParse({});

      expect(result.success).toBe(false);
    });

    it("should reject non-string ID", () => {
      const result = ZMarkRead.safeParse({
        id: 123,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("Schema Integration", () => {
    it("should work together for complete notification flow", () => {
      // Enqueue email
      const enqueueResult = ZEmailEnqueue.safeParse({
        to: { email: "user@example.com", name: "John Doe" },
        template: "welcome-email",
        props: { userName: "John" },
        category: "system",
        locale: "en-US",
      });
      expect(enqueueResult.success).toBe(true);

      // Update preferences
      const prefResult = ZPrefUpdate.safeParse({
        categories: {
          billing: true,
          alerts: true,
          system: false,
        },
      });
      expect(prefResult.success).toBe(true);

      // Mark as read
      const markReadResult = ZMarkRead.safeParse({
        id: "notif-123",
      });
      expect(markReadResult.success).toBe(true);
    });
  });
});
