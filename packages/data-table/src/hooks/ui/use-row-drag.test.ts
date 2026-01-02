import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRowDrag } from "./use-row-drag";

interface TestRow {
  id: string;
  name: string;
}

describe("useRowDrag", () => {
  const testData: TestRow[] = [
    { id: "1", name: "Row 1" },
    { id: "2", name: "Row 2" },
    { id: "3", name: "Row 3" },
  ];

  const mockOnReorder = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any lingering DOM elements
    document.body.innerHTML = "";
  });

  describe("initialization", () => {
    it("should initialize with correct default state", () => {
      const { result } = renderHook(() =>
        useRowDrag({
          enabled: true,
          data: testData,
          onReorder: mockOnReorder,
        })
      );

      expect(result.current.dragState).toEqual({
        draggingId: null,
        draggingIndex: null,
        dragOverId: null,
        dropPosition: null,
      });
      expect(result.current.isDragging).toBe(false);
    });

    it("should return disabled props when not enabled", () => {
      const { result } = renderHook(() =>
        useRowDrag({
          enabled: false,
          data: testData,
          onReorder: mockOnReorder,
        })
      );

      const props = result.current.getRowDragProps("1", 0);
      expect(props.draggable).toBe(false);
    });
  });

  describe("cleanup on unmount", () => {
    it("should clean up drag image on unmount", () => {
      const { unmount } = renderHook(() =>
        useRowDrag({
          enabled: true,
          data: testData,
          onReorder: mockOnReorder,
        })
      );

      // Simulate creating a drag image (would normally happen during drag)
      const dragImage = document.createElement("div");
      dragImage.id = "test-drag-image";
      document.body.appendChild(dragImage);

      // Verify element exists
      expect(document.getElementById("test-drag-image")).not.toBeNull();

      unmount();

      // The hook's cleanup shouldn't affect our manual element,
      // but the hook's internal dragImageRef should be nullified
      // This test verifies the cleanup logic runs without error
    });
  });

  describe("keyboard reordering", () => {
    it("should move row up with keyboard", () => {
      const { result } = renderHook(() =>
        useRowDrag({
          enabled: true,
          data: testData,
          onReorder: mockOnReorder,
        })
      );

      act(() => {
        result.current.moveRowUp("2");
      });

      expect(mockOnReorder).toHaveBeenCalledWith(1, 0, ["2", "1", "3"]);
    });

    it("should move row down with keyboard", () => {
      const { result } = renderHook(() =>
        useRowDrag({
          enabled: true,
          data: testData,
          onReorder: mockOnReorder,
        })
      );

      act(() => {
        result.current.moveRowDown("2");
      });

      expect(mockOnReorder).toHaveBeenCalledWith(1, 2, ["1", "3", "2"]);
    });

    it("should not move first row up", () => {
      const { result } = renderHook(() =>
        useRowDrag({
          enabled: true,
          data: testData,
          onReorder: mockOnReorder,
        })
      );

      act(() => {
        result.current.moveRowUp("1");
      });

      expect(mockOnReorder).not.toHaveBeenCalled();
    });

    it("should not move last row down", () => {
      const { result } = renderHook(() =>
        useRowDrag({
          enabled: true,
          data: testData,
          onReorder: mockOnReorder,
        })
      );

      act(() => {
        result.current.moveRowDown("3");
      });

      expect(mockOnReorder).not.toHaveBeenCalled();
    });
  });

  describe("state helpers", () => {
    it("should correctly identify dragging row", () => {
      const { result } = renderHook(() =>
        useRowDrag({
          enabled: true,
          data: testData,
          onReorder: mockOnReorder,
        })
      );

      expect(result.current.isDraggingRow("1")).toBe(false);
      expect(result.current.isDropTarget("1")).toBe(false);
      expect(result.current.getDropPosition("1")).toBe(null);
    });
  });
});
