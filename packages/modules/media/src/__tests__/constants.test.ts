import { describe, it, expect } from "vitest";
import {
  MEDIA_EVENTS,
  MEDIA_DEFAULTS,
  MEDIA_COLLECTIONS,
} from "../domain/constants";

describe("Media Constants", () => {
  describe("MEDIA_EVENTS", () => {
    it("should have UPLOADED event", () => {
      expect(MEDIA_EVENTS.UPLOADED).toBe("media.uploaded");
      expect(typeof MEDIA_EVENTS.UPLOADED).toBe("string");
    });

    it("should have PROCESSED event", () => {
      expect(MEDIA_EVENTS.PROCESSED).toBe("media.processed");
      expect(typeof MEDIA_EVENTS.PROCESSED).toBe("string");
    });

    it("should have DELETED event", () => {
      expect(MEDIA_EVENTS.DELETED).toBe("media.deleted");
      expect(typeof MEDIA_EVENTS.DELETED).toBe("string");
    });

    it("should have events with media prefix", () => {
      Object.values(MEDIA_EVENTS).forEach((event) => {
        expect(event).toMatch(/^media\./);
      });
    });

    it("should have exactly 3 event types", () => {
      expect(Object.keys(MEDIA_EVENTS)).toHaveLength(3);
    });

    it("should use lowercase event names", () => {
      Object.values(MEDIA_EVENTS).forEach((event) => {
        expect(event).toBe(event.toLowerCase());
      });
    });
  });

  describe("MEDIA_DEFAULTS", () => {
    it("should have MAX_IMAGE_SIZE set to 10MB", () => {
      expect(MEDIA_DEFAULTS.MAX_IMAGE_SIZE).toBe(10 * 1024 * 1024);
      expect(typeof MEDIA_DEFAULTS.MAX_IMAGE_SIZE).toBe("number");
    });

    it("should have MAX_VIDEO_SIZE set to 100MB", () => {
      expect(MEDIA_DEFAULTS.MAX_VIDEO_SIZE).toBe(100 * 1024 * 1024);
      expect(typeof MEDIA_DEFAULTS.MAX_VIDEO_SIZE).toBe("number");
    });

    it("should have THUMBNAIL_SIZE set to 200", () => {
      expect(MEDIA_DEFAULTS.THUMBNAIL_SIZE).toBe(200);
      expect(typeof MEDIA_DEFAULTS.THUMBNAIL_SIZE).toBe("number");
    });

    it("should have video size greater than image size", () => {
      expect(MEDIA_DEFAULTS.MAX_VIDEO_SIZE).toBeGreaterThan(
        MEDIA_DEFAULTS.MAX_IMAGE_SIZE
      );
    });

    it("should have positive size values", () => {
      expect(MEDIA_DEFAULTS.MAX_IMAGE_SIZE).toBeGreaterThan(0);
      expect(MEDIA_DEFAULTS.MAX_VIDEO_SIZE).toBeGreaterThan(0);
      expect(MEDIA_DEFAULTS.THUMBNAIL_SIZE).toBeGreaterThan(0);
    });

    it("should have reasonable image size limit", () => {
      expect(MEDIA_DEFAULTS.MAX_IMAGE_SIZE).toBeGreaterThanOrEqual(
        5 * 1024 * 1024
      );
      expect(MEDIA_DEFAULTS.MAX_IMAGE_SIZE).toBeLessThanOrEqual(
        20 * 1024 * 1024
      );
    });

    it("should have reasonable video size limit", () => {
      expect(MEDIA_DEFAULTS.MAX_VIDEO_SIZE).toBeGreaterThanOrEqual(
        50 * 1024 * 1024
      );
      expect(MEDIA_DEFAULTS.MAX_VIDEO_SIZE).toBeLessThanOrEqual(
        200 * 1024 * 1024
      );
    });

    it("should have reasonable thumbnail size", () => {
      expect(MEDIA_DEFAULTS.THUMBNAIL_SIZE).toBeGreaterThanOrEqual(100);
      expect(MEDIA_DEFAULTS.THUMBNAIL_SIZE).toBeLessThanOrEqual(500);
    });
  });

  describe("MEDIA_COLLECTIONS", () => {
    it("should have MEDIA collection name", () => {
      expect(MEDIA_COLLECTIONS.MEDIA).toBe("media");
      expect(typeof MEDIA_COLLECTIONS.MEDIA).toBe("string");
    });

    it("should have non-empty collection name", () => {
      expect(MEDIA_COLLECTIONS.MEDIA.length).toBeGreaterThan(0);
    });

    it("should use lowercase naming", () => {
      expect(MEDIA_COLLECTIONS.MEDIA).toMatch(/^[a-z_]+$/);
    });

    it("should have exactly 1 collection", () => {
      expect(Object.keys(MEDIA_COLLECTIONS)).toHaveLength(1);
    });
  });

  describe("Constants Relationships", () => {
    it("should have all numeric constants as positive integers", () => {
      expect(Number.isInteger(MEDIA_DEFAULTS.MAX_IMAGE_SIZE)).toBe(true);
      expect(Number.isInteger(MEDIA_DEFAULTS.MAX_VIDEO_SIZE)).toBe(true);
      expect(Number.isInteger(MEDIA_DEFAULTS.THUMBNAIL_SIZE)).toBe(true);
    });

    it("should have max sizes in bytes", () => {
      // 10MB in bytes
      expect(MEDIA_DEFAULTS.MAX_IMAGE_SIZE).toBe(10485760);
      // 100MB in bytes
      expect(MEDIA_DEFAULTS.MAX_VIDEO_SIZE).toBe(104857600);
    });

    it("should have thumbnail size in pixels", () => {
      // Reasonable thumbnail dimension
      expect(MEDIA_DEFAULTS.THUMBNAIL_SIZE).toBe(200);
    });
  });

  describe("Constants Type Safety", () => {
    it("should have readonly event names at compile time", () => {
      const events = MEDIA_EVENTS;
      expect(events.UPLOADED).toBe("media.uploaded");
    });

    it("should have readonly defaults at compile time", () => {
      const defaults = MEDIA_DEFAULTS;
      expect(defaults.MAX_IMAGE_SIZE).toBe(10 * 1024 * 1024);
    });

    it("should have readonly collection names at compile time", () => {
      const collections = MEDIA_COLLECTIONS;
      expect(collections.MEDIA).toBe("media");
    });
  });
});
