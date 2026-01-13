import { describe, it, expect } from "vitest";
import {
  PDF_EVENTS,
  PDF_DEFAULTS,
  PDF_COLLECTIONS,
} from "../domain/constants";

describe("PDF Constants", () => {
  describe("PDF_EVENTS", () => {
    it("should have GENERATED event", () => {
      expect(PDF_EVENTS.GENERATED).toBe("pdf.generated");
      expect(typeof PDF_EVENTS.GENERATED).toBe("string");
    });

    it("should have FAILED event", () => {
      expect(PDF_EVENTS.FAILED).toBe("pdf.failed");
      expect(typeof PDF_EVENTS.FAILED).toBe("string");
    });

    it("should have events with pdf prefix", () => {
      expect(PDF_EVENTS.GENERATED).toMatch(/^pdf\./);
      expect(PDF_EVENTS.FAILED).toMatch(/^pdf\./);
    });

    it("should have exactly 2 event types", () => {
      expect(Object.keys(PDF_EVENTS)).toHaveLength(2);
    });
  });

  describe("PDF_DEFAULTS", () => {
    it("should have DEFAULT_PAGE_SIZE set to A4", () => {
      expect(PDF_DEFAULTS.DEFAULT_PAGE_SIZE).toBe("A4");
      expect(typeof PDF_DEFAULTS.DEFAULT_PAGE_SIZE).toBe("string");
    });

    it("should have DEFAULT_MARGIN set to 20", () => {
      expect(PDF_DEFAULTS.DEFAULT_MARGIN).toBe(20);
      expect(typeof PDF_DEFAULTS.DEFAULT_MARGIN).toBe("number");
    });

    it("should have MAX_TEMPLATE_SIZE set to 1MB", () => {
      expect(PDF_DEFAULTS.MAX_TEMPLATE_SIZE).toBe(1024 * 1024);
      expect(typeof PDF_DEFAULTS.MAX_TEMPLATE_SIZE).toBe("number");
    });

    it("should have positive margin value", () => {
      expect(PDF_DEFAULTS.DEFAULT_MARGIN).toBeGreaterThan(0);
    });

    it("should have positive template size limit", () => {
      expect(PDF_DEFAULTS.MAX_TEMPLATE_SIZE).toBeGreaterThan(0);
    });
  });

  describe("PDF_COLLECTIONS", () => {
    it("should have TEMPLATES collection name", () => {
      expect(PDF_COLLECTIONS.TEMPLATES).toBe("pdf_templates");
      expect(typeof PDF_COLLECTIONS.TEMPLATES).toBe("string");
    });

    it("should use lowercase with underscores", () => {
      expect(PDF_COLLECTIONS.TEMPLATES).toMatch(/^[a-z_]+$/);
    });

    it("should have exactly 1 collection", () => {
      expect(Object.keys(PDF_COLLECTIONS)).toHaveLength(1);
    });
  });

  describe("Constants Type Safety", () => {
    it("should have readonly event names", () => {
      const events = PDF_EVENTS;
      expect(events.GENERATED).toBe("pdf.generated");
    });

    it("should have readonly defaults", () => {
      const defaults = PDF_DEFAULTS;
      expect(defaults.DEFAULT_PAGE_SIZE).toBe("A4");
    });

    it("should have readonly collection names", () => {
      const collections = PDF_COLLECTIONS;
      expect(collections.TEMPLATES).toBe("pdf_templates");
    });
  });
});
