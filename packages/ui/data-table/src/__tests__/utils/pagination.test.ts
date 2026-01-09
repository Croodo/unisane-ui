import { describe, it, expect } from "vitest";
import {
  getTotalPages,
  clampPage,
  getPageIndices,
  getPaginationState,
} from "../../utils/pagination";

// ─── getTotalPages TESTS ────────────────────────────────────────────────────

describe("getTotalPages", () => {
  describe("basic calculations", () => {
    it("should calculate pages for exact division", () => {
      expect(getTotalPages(100, 10)).toBe(10);
      expect(getTotalPages(50, 25)).toBe(2);
      expect(getTotalPages(30, 10)).toBe(3);
    });

    it("should round up for partial pages", () => {
      expect(getTotalPages(101, 10)).toBe(11);
      expect(getTotalPages(51, 25)).toBe(3);
      expect(getTotalPages(31, 10)).toBe(4);
    });

    it("should return 1 for single page of data", () => {
      expect(getTotalPages(5, 10)).toBe(1);
      expect(getTotalPages(10, 10)).toBe(1);
    });

    it("should return 1 for empty data", () => {
      expect(getTotalPages(0, 10)).toBe(1);
    });
  });

  describe("edge cases", () => {
    it("should handle page size of 1", () => {
      expect(getTotalPages(10, 1)).toBe(10);
      expect(getTotalPages(100, 1)).toBe(100);
    });

    it("should handle large item counts", () => {
      expect(getTotalPages(1000000, 100)).toBe(10000);
      expect(getTotalPages(999999, 100)).toBe(10000);
    });

    it("should handle page size of 0 (clamps pageSize to 1)", () => {
      // Division by zero protection - pageSize is clamped to 1
      // So 100 items / 1 per page = 100 pages
      expect(getTotalPages(100, 0)).toBe(100);
    });

    it("should handle negative page size (clamps to 1)", () => {
      // Negative pageSize is clamped to 1
      // So 100 items / 1 per page = 100 pages
      expect(getTotalPages(100, -10)).toBe(100);
    });

    it("should handle item count of 1", () => {
      expect(getTotalPages(1, 10)).toBe(1);
      expect(getTotalPages(1, 1)).toBe(1);
    });
  });

  describe("real-world scenarios", () => {
    it("should calculate pages for typical table (25 items per page)", () => {
      expect(getTotalPages(0, 25)).toBe(1);
      expect(getTotalPages(25, 25)).toBe(1);
      expect(getTotalPages(26, 25)).toBe(2);
      expect(getTotalPages(100, 25)).toBe(4);
      expect(getTotalPages(101, 25)).toBe(5);
    });

    it("should calculate pages for large page sizes", () => {
      expect(getTotalPages(50, 100)).toBe(1);
      expect(getTotalPages(100, 100)).toBe(1);
      expect(getTotalPages(150, 100)).toBe(2);
    });
  });
});

// ─── clampPage TESTS ────────────────────────────────────────────────────────

describe("clampPage", () => {
  describe("within bounds", () => {
    it("should return page unchanged when within bounds", () => {
      expect(clampPage(1, 10)).toBe(1);
      expect(clampPage(5, 10)).toBe(5);
      expect(clampPage(10, 10)).toBe(10);
    });
  });

  describe("above bounds", () => {
    it("should clamp to max page when page exceeds total", () => {
      expect(clampPage(15, 10)).toBe(10);
      expect(clampPage(100, 10)).toBe(10);
    });

    it("should handle single page total", () => {
      expect(clampPage(5, 1)).toBe(1);
    });
  });

  describe("below bounds", () => {
    it("should clamp to 1 when page is 0", () => {
      expect(clampPage(0, 10)).toBe(1);
    });

    it("should clamp to 1 when page is negative", () => {
      expect(clampPage(-1, 10)).toBe(1);
      expect(clampPage(-100, 10)).toBe(1);
    });
  });

  describe("edge cases", () => {
    it("should handle totalPages of 0 (clamps to 1)", () => {
      // Even with 0 total pages, minimum is 1
      expect(clampPage(5, 0)).toBe(1);
      expect(clampPage(0, 0)).toBe(1);
    });

    it("should handle negative totalPages", () => {
      expect(clampPage(5, -10)).toBe(1);
    });

    it("should handle boundary values", () => {
      expect(clampPage(1, 1)).toBe(1);
      expect(clampPage(2, 1)).toBe(1);
    });
  });
});

// ─── getPageIndices TESTS ───────────────────────────────────────────────────

describe("getPageIndices", () => {
  describe("first page", () => {
    it("should return correct indices for first page", () => {
      expect(getPageIndices(1, 10)).toEqual({ start: 0, end: 10 });
      expect(getPageIndices(1, 25)).toEqual({ start: 0, end: 25 });
      expect(getPageIndices(1, 100)).toEqual({ start: 0, end: 100 });
    });
  });

  describe("subsequent pages", () => {
    it("should return correct indices for page 2", () => {
      expect(getPageIndices(2, 10)).toEqual({ start: 10, end: 20 });
      expect(getPageIndices(2, 25)).toEqual({ start: 25, end: 50 });
    });

    it("should return correct indices for later pages", () => {
      expect(getPageIndices(5, 10)).toEqual({ start: 40, end: 50 });
      expect(getPageIndices(10, 10)).toEqual({ start: 90, end: 100 });
    });
  });

  describe("different page sizes", () => {
    it("should handle page size of 1", () => {
      expect(getPageIndices(1, 1)).toEqual({ start: 0, end: 1 });
      expect(getPageIndices(5, 1)).toEqual({ start: 4, end: 5 });
    });

    it("should handle large page sizes", () => {
      expect(getPageIndices(1, 1000)).toEqual({ start: 0, end: 1000 });
      expect(getPageIndices(2, 1000)).toEqual({ start: 1000, end: 2000 });
    });
  });

  describe("edge cases", () => {
    it("should handle page 0 (returns negative start)", () => {
      // This is an edge case - normally page should be >= 1
      const result = getPageIndices(0, 10);
      expect(result.start).toBe(-10);
      expect(result.end).toBe(0);
    });

    it("should handle negative page", () => {
      const result = getPageIndices(-1, 10);
      expect(result.start).toBe(-20);
      expect(result.end).toBe(-10);
    });
  });

  describe("usage with Array.slice", () => {
    it("should work correctly with Array.slice", () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

      const page1 = getPageIndices(1, 5);
      expect(data.slice(page1.start, page1.end)).toEqual([1, 2, 3, 4, 5]);

      const page2 = getPageIndices(2, 5);
      expect(data.slice(page2.start, page2.end)).toEqual([6, 7, 8, 9, 10]);

      const page3 = getPageIndices(3, 5);
      expect(data.slice(page3.start, page3.end)).toEqual([11, 12, 13, 14, 15]);
    });

    it("should handle last partial page", () => {
      const data = [1, 2, 3, 4, 5, 6, 7]; // 7 items, 5 per page

      const page2 = getPageIndices(2, 5);
      // Array.slice handles end > length gracefully
      expect(data.slice(page2.start, page2.end)).toEqual([6, 7]);
    });
  });
});

// ─── getPaginationState TESTS ───────────────────────────────────────────────

describe("getPaginationState", () => {
  describe("basic functionality", () => {
    it("should return correct state for typical case", () => {
      const result = getPaginationState(100, 5, 10);

      expect(result.safePage).toBe(5);
      expect(result.totalPages).toBe(10);
      expect(result.start).toBe(40);
      expect(result.end).toBe(50);
    });

    it("should return correct state for first page", () => {
      const result = getPaginationState(100, 1, 10);

      expect(result.safePage).toBe(1);
      expect(result.totalPages).toBe(10);
      expect(result.start).toBe(0);
      expect(result.end).toBe(10);
    });

    it("should return correct state for last page", () => {
      const result = getPaginationState(100, 10, 10);

      expect(result.safePage).toBe(10);
      expect(result.totalPages).toBe(10);
      expect(result.start).toBe(90);
      expect(result.end).toBe(100);
    });
  });

  describe("page clamping", () => {
    it("should clamp page above total", () => {
      const result = getPaginationState(100, 15, 10);

      expect(result.safePage).toBe(10);
      expect(result.totalPages).toBe(10);
    });

    it("should clamp page below 1", () => {
      const result = getPaginationState(100, 0, 10);

      expect(result.safePage).toBe(1);
      expect(result.start).toBe(0);
    });

    it("should clamp negative page", () => {
      const result = getPaginationState(100, -5, 10);

      expect(result.safePage).toBe(1);
    });
  });

  describe("empty data", () => {
    it("should handle empty data", () => {
      const result = getPaginationState(0, 1, 10);

      expect(result.safePage).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.start).toBe(0);
      expect(result.end).toBe(10);
    });
  });

  describe("partial last page", () => {
    it("should calculate for partial last page", () => {
      const result = getPaginationState(95, 10, 10);

      expect(result.safePage).toBe(10);
      expect(result.totalPages).toBe(10);
      expect(result.start).toBe(90);
      expect(result.end).toBe(100); // end can exceed itemCount
    });
  });

  describe("single page", () => {
    it("should handle single page of data", () => {
      const result = getPaginationState(5, 1, 10);

      expect(result.safePage).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.start).toBe(0);
      expect(result.end).toBe(10);
    });

    it("should clamp to single page when data is less than page size", () => {
      const result = getPaginationState(5, 5, 10);

      expect(result.safePage).toBe(1); // Clamped from 5 to 1
      expect(result.totalPages).toBe(1);
    });
  });

  describe("integration with data slicing", () => {
    it("should produce correct slice indices for data", () => {
      const data = Array.from({ length: 100 }, (_, i) => i + 1);

      // Page 3 of 10 items per page
      const { start, end } = getPaginationState(100, 3, 10);
      const pageData = data.slice(start, end);

      expect(pageData).toEqual([21, 22, 23, 24, 25, 26, 27, 28, 29, 30]);
    });

    it("should handle last partial page slicing", () => {
      const data = Array.from({ length: 95 }, (_, i) => i + 1);

      const { safePage, start, end } = getPaginationState(95, 10, 10);
      expect(safePage).toBe(10);

      const pageData = data.slice(start, end);
      expect(pageData).toEqual([91, 92, 93, 94, 95]); // Only 5 items on last page
    });
  });

  describe("dynamic page size changes", () => {
    it("should adjust page when page size increases", () => {
      // User is on page 10 of 10 items per page, showing items 91-100
      // Then increases page size to 25, now only 4 pages exist
      const result = getPaginationState(100, 10, 25);

      expect(result.safePage).toBe(4); // Clamped from 10 to 4
      expect(result.totalPages).toBe(4);
    });

    it("should adjust page when filtering reduces data", () => {
      // User is on page 5, then applies filter reducing data to 30 items
      // With 10 per page, only 3 pages exist
      const result = getPaginationState(30, 5, 10);

      expect(result.safePage).toBe(3); // Clamped from 5 to 3
      expect(result.totalPages).toBe(3);
    });
  });
});

// ─── COMBINED FUNCTION TESTS ────────────────────────────────────────────────

describe("pagination functions integration", () => {
  it("should produce consistent results when used together", () => {
    const itemCount = 95;
    const pageSize = 10;
    const requestedPage = 10;

    const totalPages = getTotalPages(itemCount, pageSize);
    const safePage = clampPage(requestedPage, totalPages);
    const { start, end } = getPageIndices(safePage, pageSize);

    const combinedResult = getPaginationState(itemCount, requestedPage, pageSize);

    expect(combinedResult.totalPages).toBe(totalPages);
    expect(combinedResult.safePage).toBe(safePage);
    expect(combinedResult.start).toBe(start);
    expect(combinedResult.end).toBe(end);
  });

  it("should handle edge case of 0 items consistently", () => {
    const itemCount = 0;
    const pageSize = 10;
    const requestedPage = 1;

    const totalPages = getTotalPages(itemCount, pageSize);
    const safePage = clampPage(requestedPage, totalPages);
    const { start, end } = getPageIndices(safePage, pageSize);

    const combinedResult = getPaginationState(itemCount, requestedPage, pageSize);

    expect(combinedResult).toEqual({
      safePage,
      totalPages,
      start,
      end,
    });
  });
});
