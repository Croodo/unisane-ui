import { describe, it, expect } from "vitest";
import {
  STORAGE_EVENTS,
  STORAGE_CLEANUP,
  STORAGE_PAGINATION,
  STORAGE_COLLECTIONS,
} from "../domain/constants";

describe("Storage Constants", () => {
  describe("STORAGE_EVENTS", () => {
    it("should have UPLOAD_REQUESTED event", () => {
      expect(STORAGE_EVENTS.UPLOAD_REQUESTED).toBe(
        "storage.upload.requested"
      );
      expect(typeof STORAGE_EVENTS.UPLOAD_REQUESTED).toBe("string");
    });

    it("should have UPLOAD_CONFIRMED event", () => {
      expect(STORAGE_EVENTS.UPLOAD_CONFIRMED).toBe(
        "storage.upload.confirmed"
      );
      expect(typeof STORAGE_EVENTS.UPLOAD_CONFIRMED).toBe("string");
    });

    it("should have FILE_DELETED event", () => {
      expect(STORAGE_EVENTS.FILE_DELETED).toBe("storage.file.deleted");
      expect(typeof STORAGE_EVENTS.FILE_DELETED).toBe("string");
    });

    it("should have FILE_PURGED event", () => {
      expect(STORAGE_EVENTS.FILE_PURGED).toBe("storage.file.purged");
      expect(typeof STORAGE_EVENTS.FILE_PURGED).toBe("string");
    });

    it("should have CLEANUP_ORPHANED event", () => {
      expect(STORAGE_EVENTS.CLEANUP_ORPHANED).toBe(
        "storage.cleanup.orphaned"
      );
      expect(typeof STORAGE_EVENTS.CLEANUP_ORPHANED).toBe("string");
    });

    it("should have CLEANUP_DELETED event", () => {
      expect(STORAGE_EVENTS.CLEANUP_DELETED).toBe("storage.cleanup.deleted");
      expect(typeof STORAGE_EVENTS.CLEANUP_DELETED).toBe("string");
    });

    it("should have all events with storage prefix", () => {
      const events = Object.values(STORAGE_EVENTS);
      events.forEach((event) => {
        expect(event).toMatch(/^storage\./);
      });
    });

    it("should have unique event names", () => {
      const events = Object.values(STORAGE_EVENTS);
      const uniqueEvents = new Set(events);
      expect(uniqueEvents.size).toBe(events.length);
    });

    it("should have exactly 6 event types", () => {
      expect(Object.keys(STORAGE_EVENTS)).toHaveLength(6);
    });
  });

  describe("STORAGE_CLEANUP", () => {
    it("should have ORPHAN_THRESHOLD_MS set to 24 hours", () => {
      expect(STORAGE_CLEANUP.ORPHAN_THRESHOLD_MS).toBe(24 * 60 * 60 * 1000);
      expect(typeof STORAGE_CLEANUP.ORPHAN_THRESHOLD_MS).toBe("number");
    });

    it("should have DELETED_THRESHOLD_MS set to 7 days", () => {
      expect(STORAGE_CLEANUP.DELETED_THRESHOLD_MS).toBe(
        7 * 24 * 60 * 60 * 1000
      );
      expect(typeof STORAGE_CLEANUP.DELETED_THRESHOLD_MS).toBe("number");
    });

    it("should have BATCH_SIZE set to 100", () => {
      expect(STORAGE_CLEANUP.BATCH_SIZE).toBe(100);
      expect(typeof STORAGE_CLEANUP.BATCH_SIZE).toBe("number");
    });

    it("should have positive threshold values", () => {
      expect(STORAGE_CLEANUP.ORPHAN_THRESHOLD_MS).toBeGreaterThan(0);
      expect(STORAGE_CLEANUP.DELETED_THRESHOLD_MS).toBeGreaterThan(0);
    });

    it("should have deleted threshold greater than orphan threshold", () => {
      expect(STORAGE_CLEANUP.DELETED_THRESHOLD_MS).toBeGreaterThan(
        STORAGE_CLEANUP.ORPHAN_THRESHOLD_MS
      );
    });

    it("should have reasonable batch size", () => {
      expect(STORAGE_CLEANUP.BATCH_SIZE).toBeGreaterThan(0);
      expect(STORAGE_CLEANUP.BATCH_SIZE).toBeLessThanOrEqual(1000);
    });

    it("should have orphan threshold of 86400000 ms (24h)", () => {
      expect(STORAGE_CLEANUP.ORPHAN_THRESHOLD_MS).toBe(86400000);
    });

    it("should have deleted threshold of 604800000 ms (7d)", () => {
      expect(STORAGE_CLEANUP.DELETED_THRESHOLD_MS).toBe(604800000);
    });
  });

  describe("STORAGE_PAGINATION", () => {
    it("should have DEFAULT_PAGE_SIZE set to 20", () => {
      expect(STORAGE_PAGINATION.DEFAULT_PAGE_SIZE).toBe(20);
      expect(typeof STORAGE_PAGINATION.DEFAULT_PAGE_SIZE).toBe("number");
    });

    it("should have MAX_PAGE_SIZE set to 100", () => {
      expect(STORAGE_PAGINATION.MAX_PAGE_SIZE).toBe(100);
      expect(typeof STORAGE_PAGINATION.MAX_PAGE_SIZE).toBe("number");
    });

    it("should have default page size less than max", () => {
      expect(STORAGE_PAGINATION.DEFAULT_PAGE_SIZE).toBeLessThan(
        STORAGE_PAGINATION.MAX_PAGE_SIZE
      );
    });

    it("should have positive page size values", () => {
      expect(STORAGE_PAGINATION.DEFAULT_PAGE_SIZE).toBeGreaterThan(0);
      expect(STORAGE_PAGINATION.MAX_PAGE_SIZE).toBeGreaterThan(0);
    });

    it("should have reasonable default page size", () => {
      expect(STORAGE_PAGINATION.DEFAULT_PAGE_SIZE).toBeGreaterThanOrEqual(10);
      expect(STORAGE_PAGINATION.DEFAULT_PAGE_SIZE).toBeLessThanOrEqual(50);
    });

    it("should have reasonable max page size", () => {
      expect(STORAGE_PAGINATION.MAX_PAGE_SIZE).toBeGreaterThanOrEqual(50);
      expect(STORAGE_PAGINATION.MAX_PAGE_SIZE).toBeLessThanOrEqual(500);
    });
  });

  describe("STORAGE_COLLECTIONS", () => {
    it("should have FILES collection name", () => {
      expect(STORAGE_COLLECTIONS.FILES).toBe("files");
      expect(typeof STORAGE_COLLECTIONS.FILES).toBe("string");
    });

    it("should have non-empty collection names", () => {
      const collections = Object.values(STORAGE_COLLECTIONS);
      collections.forEach((name) => {
        expect(name.length).toBeGreaterThan(0);
      });
    });

    it("should have exactly 1 collection", () => {
      expect(Object.keys(STORAGE_COLLECTIONS)).toHaveLength(1);
    });

    it("should use lowercase collection names", () => {
      const collections = Object.values(STORAGE_COLLECTIONS);
      collections.forEach((name) => {
        expect(name).toBe(name.toLowerCase());
      });
    });
  });

  describe("Constants Relationships", () => {
    it("should have cleanup thresholds in milliseconds", () => {
      // Verify values are in milliseconds by checking they represent reasonable time periods
      const oneDayMs = 24 * 60 * 60 * 1000;
      const sevenDaysMs = 7 * oneDayMs;

      expect(STORAGE_CLEANUP.ORPHAN_THRESHOLD_MS).toBe(oneDayMs);
      expect(STORAGE_CLEANUP.DELETED_THRESHOLD_MS).toBe(sevenDaysMs);
    });

    it("should have batch size suitable for pagination", () => {
      // Batch size should be >= max page size for efficient cleanup
      expect(STORAGE_CLEANUP.BATCH_SIZE).toBeGreaterThanOrEqual(
        STORAGE_PAGINATION.MAX_PAGE_SIZE
      );
    });

    it("should have all numeric constants as positive integers", () => {
      expect(Number.isInteger(STORAGE_CLEANUP.ORPHAN_THRESHOLD_MS)).toBe(true);
      expect(Number.isInteger(STORAGE_CLEANUP.DELETED_THRESHOLD_MS)).toBe(
        true
      );
      expect(Number.isInteger(STORAGE_CLEANUP.BATCH_SIZE)).toBe(true);
      expect(Number.isInteger(STORAGE_PAGINATION.DEFAULT_PAGE_SIZE)).toBe(
        true
      );
      expect(Number.isInteger(STORAGE_PAGINATION.MAX_PAGE_SIZE)).toBe(true);
    });
  });

  describe("Constants Type Safety", () => {
    it("should have readonly event names at compile time", () => {
      // TypeScript enforces immutability at compile time with 'as const'
      // Runtime immutability is not enforced in JavaScript
      const events = STORAGE_EVENTS;
      expect(events.UPLOAD_REQUESTED).toBe("storage.upload.requested");
    });

    it("should have readonly cleanup config at compile time", () => {
      const cleanup = STORAGE_CLEANUP;
      expect(cleanup.BATCH_SIZE).toBe(100);
    });

    it("should have readonly pagination config at compile time", () => {
      const pagination = STORAGE_PAGINATION;
      expect(pagination.DEFAULT_PAGE_SIZE).toBe(20);
    });

    it("should have readonly collection names at compile time", () => {
      const collections = STORAGE_COLLECTIONS;
      expect(collections.FILES).toBe("files");
    });
  });
});
