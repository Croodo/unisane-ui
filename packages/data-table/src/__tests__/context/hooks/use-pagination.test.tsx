import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { DataTableProvider } from "../../../context/provider";
import { usePagination } from "../../../context/hooks/use-pagination";
import type { Column } from "../../../types";

interface TestRow {
  id: string;
  name: string;
}

const testColumns: Column<TestRow>[] = [
  { key: "name", header: "Name" },
];

function createWrapper(props: { initialPageSize?: number; onPaginationChange?: (page: number, pageSize: number) => void } = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <DataTableProvider
        columns={testColumns}
        initialPageSize={props.initialPageSize ?? 10}
        onPaginationChange={props.onPaginationChange}
      >
        {children}
      </DataTableProvider>
    );
  };
}

describe("usePagination", () => {
  describe("basic functionality", () => {
    it("should return initial page as 1", () => {
      const { result } = renderHook(() => usePagination(), {
        wrapper: createWrapper(),
      });

      expect(result.current.page).toBe(1);
    });

    it("should use initialPageSize", () => {
      const { result } = renderHook(() => usePagination(), {
        wrapper: createWrapper({ initialPageSize: 25 }),
      });

      expect(result.current.pageSize).toBe(25);
    });
  });

  describe("setPage", () => {
    it("should update page", () => {
      const { result } = renderHook(() => usePagination(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setPage(3);
      });

      expect(result.current.page).toBe(3);
    });

    it("should call onPaginationChange when page changes", () => {
      const mockOnPaginationChange = vi.fn();
      const { result } = renderHook(() => usePagination(), {
        wrapper: createWrapper({ onPaginationChange: mockOnPaginationChange }),
      });

      act(() => {
        result.current.setPage(2);
      });

      expect(mockOnPaginationChange).toHaveBeenCalledWith(2, 10);
    });
  });

  describe("setPageSize", () => {
    it("should update page size", () => {
      const { result } = renderHook(() => usePagination(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setPageSize(50);
      });

      expect(result.current.pageSize).toBe(50);
    });

    it("should reset page to 1 when page size changes", () => {
      const mockOnPaginationChange = vi.fn();
      const { result } = renderHook(() => usePagination(), {
        wrapper: createWrapper({ onPaginationChange: mockOnPaginationChange }),
      });

      // First go to page 3
      act(() => {
        result.current.setPage(3);
      });

      expect(result.current.page).toBe(3);

      // Then change page size - should reset to page 1
      act(() => {
        result.current.setPageSize(50);
      });

      // onPaginationChange should be called with page 1
      expect(mockOnPaginationChange).toHaveBeenLastCalledWith(1, 50);
    });
  });

  describe("navigation", () => {
    it("should go to next page", () => {
      const { result } = renderHook(() => usePagination(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.page).toBe(2);
    });

    it("should go to previous page", () => {
      const { result } = renderHook(() => usePagination(), {
        wrapper: createWrapper(),
      });

      // Go to page 3 first
      act(() => {
        result.current.setPage(3);
      });

      act(() => {
        result.current.prevPage();
      });

      expect(result.current.page).toBe(2);
    });

    it("should not go below page 1", () => {
      const { result } = renderHook(() => usePagination(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.prevPage();
      });

      // Page should still be 1 (reducer handles minimum)
      expect(result.current.page).toBeGreaterThanOrEqual(1);
    });
  });

  describe("resetPage", () => {
    it("should reset to page 1", () => {
      const { result } = renderHook(() => usePagination(), {
        wrapper: createWrapper(),
      });

      // Go to page 5
      act(() => {
        result.current.setPage(5);
      });

      expect(result.current.page).toBe(5);

      // Reset
      act(() => {
        result.current.resetPage();
      });

      expect(result.current.page).toBe(1);
    });
  });
});
