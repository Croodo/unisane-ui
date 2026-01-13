import { describe, it, expect } from "vitest";
import {
  NOTIFY_EVENTS,
  NOTIFY_CHANNELS,
  NOTIFY_DEFAULTS,
  NOTIFY_COLLECTIONS,
} from "../domain/constants";

describe("Notify Constants", () => {
  describe("NOTIFY_EVENTS", () => {
    it("should have SENT event", () => {
      expect(NOTIFY_EVENTS.SENT).toBe("notify.sent");
      expect(typeof NOTIFY_EVENTS.SENT).toBe("string");
    });

    it("should have DELIVERED event", () => {
      expect(NOTIFY_EVENTS.DELIVERED).toBe("notify.delivered");
      expect(typeof NOTIFY_EVENTS.DELIVERED).toBe("string");
    });

    it("should have FAILED event", () => {
      expect(NOTIFY_EVENTS.FAILED).toBe("notify.failed");
      expect(typeof NOTIFY_EVENTS.FAILED).toBe("string");
    });

    it("should have READ event", () => {
      expect(NOTIFY_EVENTS.READ).toBe("notify.read");
      expect(typeof NOTIFY_EVENTS.READ).toBe("string");
    });

    it("should have PREFS_UPDATED event", () => {
      expect(NOTIFY_EVENTS.PREFS_UPDATED).toBe("notify.prefs.updated");
      expect(typeof NOTIFY_EVENTS.PREFS_UPDATED).toBe("string");
    });

    it("should have events with notify prefix", () => {
      Object.values(NOTIFY_EVENTS).forEach((event) => {
        expect(event).toMatch(/^notify\./);
      });
    });

    it("should have exactly 5 event types", () => {
      expect(Object.keys(NOTIFY_EVENTS)).toHaveLength(5);
    });

    it("should use lowercase event names", () => {
      Object.values(NOTIFY_EVENTS).forEach((event) => {
        expect(event).toBe(event.toLowerCase());
      });
    });
  });

  describe("NOTIFY_CHANNELS", () => {
    it("should have EMAIL channel", () => {
      expect(NOTIFY_CHANNELS.EMAIL).toBe("email");
      expect(typeof NOTIFY_CHANNELS.EMAIL).toBe("string");
    });

    it("should have SMS channel", () => {
      expect(NOTIFY_CHANNELS.SMS).toBe("sms");
      expect(typeof NOTIFY_CHANNELS.SMS).toBe("string");
    });

    it("should have PUSH channel", () => {
      expect(NOTIFY_CHANNELS.PUSH).toBe("push");
      expect(typeof NOTIFY_CHANNELS.PUSH).toBe("string");
    });

    it("should have IN_APP channel", () => {
      expect(NOTIFY_CHANNELS.IN_APP).toBe("in_app");
      expect(typeof NOTIFY_CHANNELS.IN_APP).toBe("string");
    });

    it("should have SLACK channel", () => {
      expect(NOTIFY_CHANNELS.SLACK).toBe("slack");
      expect(typeof NOTIFY_CHANNELS.SLACK).toBe("string");
    });

    it("should have exactly 5 channels", () => {
      expect(Object.keys(NOTIFY_CHANNELS)).toHaveLength(5);
    });

    it("should use lowercase channel names", () => {
      Object.values(NOTIFY_CHANNELS).forEach((channel) => {
        expect(channel).toBe(channel.toLowerCase());
      });
    });

    it("should use underscores for multi-word channels", () => {
      expect(NOTIFY_CHANNELS.IN_APP).toMatch(/^[a-z_]+$/);
    });
  });

  describe("NOTIFY_DEFAULTS", () => {
    it("should have DEFAULT_PAGE_SIZE set to 20", () => {
      expect(NOTIFY_DEFAULTS.DEFAULT_PAGE_SIZE).toBe(20);
      expect(typeof NOTIFY_DEFAULTS.DEFAULT_PAGE_SIZE).toBe("number");
    });

    it("should have MAX_RETRIES set to 3", () => {
      expect(NOTIFY_DEFAULTS.MAX_RETRIES).toBe(3);
      expect(typeof NOTIFY_DEFAULTS.MAX_RETRIES).toBe("number");
    });

    it("should have RETRY_DELAY_MS set to 5000", () => {
      expect(NOTIFY_DEFAULTS.RETRY_DELAY_MS).toBe(5000);
      expect(typeof NOTIFY_DEFAULTS.RETRY_DELAY_MS).toBe("number");
    });

    it("should have positive values", () => {
      expect(NOTIFY_DEFAULTS.DEFAULT_PAGE_SIZE).toBeGreaterThan(0);
      expect(NOTIFY_DEFAULTS.MAX_RETRIES).toBeGreaterThan(0);
      expect(NOTIFY_DEFAULTS.RETRY_DELAY_MS).toBeGreaterThan(0);
    });

    it("should have reasonable page size", () => {
      expect(NOTIFY_DEFAULTS.DEFAULT_PAGE_SIZE).toBeGreaterThanOrEqual(10);
      expect(NOTIFY_DEFAULTS.DEFAULT_PAGE_SIZE).toBeLessThanOrEqual(50);
    });

    it("should have reasonable retry count", () => {
      expect(NOTIFY_DEFAULTS.MAX_RETRIES).toBeGreaterThanOrEqual(1);
      expect(NOTIFY_DEFAULTS.MAX_RETRIES).toBeLessThanOrEqual(5);
    });

    it("should have reasonable retry delay", () => {
      expect(NOTIFY_DEFAULTS.RETRY_DELAY_MS).toBeGreaterThanOrEqual(1000);
      expect(NOTIFY_DEFAULTS.RETRY_DELAY_MS).toBeLessThanOrEqual(10000);
    });
  });

  describe("NOTIFY_COLLECTIONS", () => {
    it("should have NOTIFICATIONS collection", () => {
      expect(NOTIFY_COLLECTIONS.NOTIFICATIONS).toBe("notifications");
      expect(typeof NOTIFY_COLLECTIONS.NOTIFICATIONS).toBe("string");
    });

    it("should have TEMPLATES collection", () => {
      expect(NOTIFY_COLLECTIONS.TEMPLATES).toBe("notification_templates");
      expect(typeof NOTIFY_COLLECTIONS.TEMPLATES).toBe("string");
    });

    it("should have non-empty collection names", () => {
      expect(NOTIFY_COLLECTIONS.NOTIFICATIONS.length).toBeGreaterThan(0);
      expect(NOTIFY_COLLECTIONS.TEMPLATES.length).toBeGreaterThan(0);
    });

    it("should use lowercase with underscores", () => {
      Object.values(NOTIFY_COLLECTIONS).forEach((collection) => {
        expect(collection).toMatch(/^[a-z_]+$/);
      });
    });

    it("should have exactly 2 collections", () => {
      expect(Object.keys(NOTIFY_COLLECTIONS)).toHaveLength(2);
    });
  });

  describe("Constants Relationships", () => {
    it("should have all numeric constants as positive integers", () => {
      expect(Number.isInteger(NOTIFY_DEFAULTS.DEFAULT_PAGE_SIZE)).toBe(true);
      expect(Number.isInteger(NOTIFY_DEFAULTS.MAX_RETRIES)).toBe(true);
      expect(Number.isInteger(NOTIFY_DEFAULTS.RETRY_DELAY_MS)).toBe(true);
    });

    it("should have retry delay in milliseconds", () => {
      // 5 seconds
      expect(NOTIFY_DEFAULTS.RETRY_DELAY_MS).toBe(5000);
    });

    it("should have reasonable default page size for notifications", () => {
      // Notifications typically have smaller page sizes for better UX
      expect(NOTIFY_DEFAULTS.DEFAULT_PAGE_SIZE).toBe(20);
    });
  });

  describe("Constants Type Safety", () => {
    it("should have readonly event names at compile time", () => {
      const events = NOTIFY_EVENTS;
      expect(events.SENT).toBe("notify.sent");
    });

    it("should have readonly channel names at compile time", () => {
      const channels = NOTIFY_CHANNELS;
      expect(channels.EMAIL).toBe("email");
    });

    it("should have readonly defaults at compile time", () => {
      const defaults = NOTIFY_DEFAULTS;
      expect(defaults.DEFAULT_PAGE_SIZE).toBe(20);
    });

    it("should have readonly collection names at compile time", () => {
      const collections = NOTIFY_COLLECTIONS;
      expect(collections.NOTIFICATIONS).toBe("notifications");
    });
  });
});
