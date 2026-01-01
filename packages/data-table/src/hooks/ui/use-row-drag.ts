"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface RowDragState {
  /** Row ID currently being dragged */
  draggingId: string | null;
  /** Index of the row being dragged */
  draggingIndex: number | null;
  /** Row ID being dragged over */
  dragOverId: string | null;
  /** Drop position relative to the drag-over row */
  dropPosition: "before" | "after" | null;
}

export interface UseRowDragOptions<T extends { id: string }> {
  /** Whether row drag-to-reorder is enabled */
  enabled: boolean;
  /** Current data array */
  data: T[];
  /** Callback when row is reordered */
  onReorder: (fromIndex: number, toIndex: number, newOrder: string[]) => void;
}

export interface RowDragProps {
  /** Whether the row is draggable */
  draggable: boolean;
  /** Drag start handler */
  onDragStart: (e: React.DragEvent) => void;
  /** Drag end handler */
  onDragEnd: (e: React.DragEvent) => void;
  /** Drag over handler */
  onDragOver: (e: React.DragEvent) => void;
  /** Drag enter handler */
  onDragEnter: (e: React.DragEvent) => void;
  /** Drag leave handler */
  onDragLeave: (e: React.DragEvent) => void;
  /** Drop handler */
  onDrop: (e: React.DragEvent) => void;
}

export interface UseRowDragReturn {
  /** Current drag state */
  dragState: RowDragState;
  /** Get drag props for a row */
  getRowDragProps: (rowId: string, rowIndex: number) => RowDragProps;
  /** Get drag handle props (for the drag handle element only) */
  getDragHandleProps: (rowId: string, rowIndex: number) => {
    onMouseDown: (e: React.MouseEvent) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    tabIndex: number;
    role: string;
    "aria-label": string;
    "aria-grabbed": boolean | undefined;
  };
  /** Whether any row is being dragged */
  isDragging: boolean;
  /** Whether a specific row is being dragged */
  isDraggingRow: (id: string) => boolean;
  /** Whether a specific row is the drop target */
  isDropTarget: (id: string) => boolean;
  /** Get the drop position for a row */
  getDropPosition: (id: string) => "before" | "after" | null;
  /** Move row up via keyboard */
  moveRowUp: (rowId: string) => void;
  /** Move row down via keyboard */
  moveRowDown: (rowId: string) => void;
}

const DRAG_DATA_TYPE = "text/x-datatable-row";

// ─── HOOK ────────────────────────────────────────────────────────────────────

/**
 * Hook for row drag-to-reorder functionality.
 *
 * Provides both drag-and-drop and keyboard-based reordering.
 *
 * @example
 * ```tsx
 * const { getRowDragProps, getDragHandleProps, isDraggingRow } = useRowDrag({
 *   enabled: true,
 *   data: rows,
 *   onReorder: (from, to, newOrder) => setRows(reorder(rows, from, to)),
 * });
 *
 * // In row component:
 * <tr {...getRowDragProps(row.id, index)}>
 *   <td>
 *     <DragHandle {...getDragHandleProps(row.id, index)} />
 *   </td>
 * </tr>
 * ```
 */
export function useRowDrag<T extends { id: string }>({
  enabled,
  data,
  onReorder,
}: UseRowDragOptions<T>): UseRowDragReturn {
  const [dragState, setDragState] = useState<RowDragState>({
    draggingId: null,
    draggingIndex: null,
    dragOverId: null,
    dropPosition: null,
  });

  // Track the drag image element
  const dragImageRef = useRef<HTMLDivElement | null>(null);

  // Track if drag started from handle
  const dragFromHandleRef = useRef(false);

  // Cleanup drag image on unmount
  useEffect(() => {
    return () => {
      if (dragImageRef.current) {
        document.body.removeChild(dragImageRef.current);
        dragImageRef.current = null;
      }
    };
  }, []);

  // ─── REORDER HELPER ──────────────────────────────────────────────────────────

  const reorderRows = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      if (fromIndex < 0 || toIndex < 0) return;
      if (fromIndex >= data.length || toIndex >= data.length) return;

      // Calculate new order
      const newOrder = data.map((row) => row.id);
      const [movedId] = newOrder.splice(fromIndex, 1);
      if (movedId) {
        newOrder.splice(toIndex, 0, movedId);
      }

      onReorder(fromIndex, toIndex, newOrder);
    },
    [data, onReorder]
  );

  // ─── DRAG HANDLERS ───────────────────────────────────────────────────────────

  const handleDragStart = useCallback(
    (rowId: string, rowIndex: number) => (e: React.DragEvent) => {
      if (!enabled) {
        e.preventDefault();
        return;
      }

      // Only allow drag if started from handle
      if (!dragFromHandleRef.current) {
        e.preventDefault();
        return;
      }

      // Set drag data
      e.dataTransfer.setData(DRAG_DATA_TYPE, JSON.stringify({ id: rowId, index: rowIndex }));
      e.dataTransfer.effectAllowed = "move";

      // Create custom drag image
      const dragImage = document.createElement("div");
      dragImage.style.cssText = `
        position: fixed;
        left: -9999px;
        top: -9999px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background: var(--md-sys-color-surface-container-high, #e6e0e9);
        color: var(--md-sys-color-on-surface, #1d1b20);
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        font-family: inherit;
        font-size: 14px;
        font-weight: 500;
        z-index: 9999;
        pointer-events: none;
        white-space: nowrap;
      `;

      // Add drag indicator icon (grip lines)
      const iconSpan = document.createElement("span");
      iconSpan.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 2px;
        opacity: 0.6;
      `;
      for (let i = 0; i < 3; i++) {
        const line = document.createElement("span");
        line.style.cssText = `
          width: 12px;
          height: 2px;
          background: currentColor;
          border-radius: 1px;
        `;
        iconSpan.appendChild(line);
      }

      // Add row indicator text
      const textSpan = document.createElement("span");
      textSpan.textContent = `Row ${rowIndex + 1}`;

      dragImage.appendChild(iconSpan);
      dragImage.appendChild(textSpan);
      document.body.appendChild(dragImage);
      dragImageRef.current = dragImage;

      e.dataTransfer.setDragImage(dragImage, 0, 0);

      // Update state after a tick to allow browser to capture drag image
      requestAnimationFrame(() => {
        setDragState({
          draggingId: rowId,
          draggingIndex: rowIndex,
          dragOverId: null,
          dropPosition: null,
        });
      });
    },
    [enabled]
  );

  const handleDragEnd = useCallback(() => {
    // Cleanup drag image
    if (dragImageRef.current) {
      document.body.removeChild(dragImageRef.current);
      dragImageRef.current = null;
    }

    dragFromHandleRef.current = false;

    setDragState({
      draggingId: null,
      draggingIndex: null,
      dragOverId: null,
      dropPosition: null,
    });
  }, []);

  const handleDragOver = useCallback(
    (rowId: string) => (e: React.DragEvent) => {
      if (!enabled || !dragState.draggingId) return;
      if (dragState.draggingId === rowId) return;

      // Check if this is a valid row drag
      if (!e.dataTransfer.types.includes(DRAG_DATA_TYPE)) return;

      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      // Calculate drop position based on mouse position
      const rect = e.currentTarget.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const dropPosition: "before" | "after" = e.clientY < midpoint ? "before" : "after";

      setDragState((prev) => ({
        ...prev,
        dragOverId: rowId,
        dropPosition,
      }));
    },
    [enabled, dragState.draggingId]
  );

  const handleDragEnter = useCallback(
    (rowId: string) => (e: React.DragEvent) => {
      if (!enabled || !dragState.draggingId) return;
      if (dragState.draggingId === rowId) return;

      if (!e.dataTransfer.types.includes(DRAG_DATA_TYPE)) return;

      e.preventDefault();
    },
    [enabled, dragState.draggingId]
  );

  const handleDragLeave = useCallback(
    (rowId: string) => (e: React.DragEvent) => {
      const relatedTarget = e.relatedTarget as Node | null;
      const currentTarget = e.currentTarget as Node;

      if (relatedTarget && currentTarget.contains(relatedTarget)) {
        return;
      }

      if (dragState.dragOverId === rowId) {
        setDragState((prev) => ({
          ...prev,
          dragOverId: null,
          dropPosition: null,
        }));
      }
    },
    [dragState.dragOverId]
  );

  const handleDrop = useCallback(
    (rowId: string, rowIndex: number) => (e: React.DragEvent) => {
      e.preventDefault();

      try {
        const dragData = JSON.parse(e.dataTransfer.getData(DRAG_DATA_TYPE));
        const fromIndex = dragData.index;
        const fromId = dragData.id;

        if (fromId === rowId) {
          handleDragEnd();
          return;
        }

        // Calculate target index based on drop position
        let toIndex = rowIndex;
        if (dragState.dropPosition === "after") {
          toIndex = rowIndex + 1;
        }

        // Adjust if moving down
        if (fromIndex < toIndex) {
          toIndex -= 1;
        }

        reorderRows(fromIndex, toIndex);
      } catch {
        // Invalid drag data
      }

      handleDragEnd();
    },
    [dragState.dropPosition, reorderRows, handleDragEnd]
  );

  // ─── KEYBOARD HANDLERS ───────────────────────────────────────────────────────

  const moveRowUp = useCallback(
    (rowId: string) => {
      const currentIndex = data.findIndex((row) => row.id === rowId);
      if (currentIndex > 0) {
        reorderRows(currentIndex, currentIndex - 1);
      }
    },
    [data, reorderRows]
  );

  const moveRowDown = useCallback(
    (rowId: string) => {
      const currentIndex = data.findIndex((row) => row.id === rowId);
      if (currentIndex < data.length - 1) {
        reorderRows(currentIndex, currentIndex + 1);
      }
    },
    [data, reorderRows]
  );

  // ─── PROP GETTERS ────────────────────────────────────────────────────────────

  const getRowDragProps = useCallback(
    (rowId: string, rowIndex: number): RowDragProps => ({
      draggable: enabled,
      onDragStart: handleDragStart(rowId, rowIndex),
      onDragEnd: handleDragEnd,
      onDragOver: handleDragOver(rowId),
      onDragEnter: handleDragEnter(rowId),
      onDragLeave: handleDragLeave(rowId),
      onDrop: handleDrop(rowId, rowIndex),
    }),
    [enabled, handleDragStart, handleDragEnd, handleDragOver, handleDragEnter, handleDragLeave, handleDrop]
  );

  const getDragHandleProps = useCallback(
    (rowId: string, rowIndex: number) => ({
      onMouseDown: (e: React.MouseEvent) => {
        // Mark that drag should be allowed from handle
        dragFromHandleRef.current = true;
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        if (!enabled) return;

        // Alt+ArrowUp/Down for keyboard reordering
        if (e.altKey && e.key === "ArrowUp") {
          e.preventDefault();
          moveRowUp(rowId);
        } else if (e.altKey && e.key === "ArrowDown") {
          e.preventDefault();
          moveRowDown(rowId);
        }
      },
      tabIndex: enabled ? 0 : -1,
      role: "button",
      "aria-label": `Drag to reorder row ${rowIndex + 1}. Use Alt+Arrow keys to move.`,
      "aria-grabbed": dragState.draggingId === rowId ? true : undefined,
    }),
    [enabled, dragState.draggingId, moveRowUp, moveRowDown]
  );

  // ─── STATE HELPERS ───────────────────────────────────────────────────────────

  const isDraggingRow = useCallback(
    (id: string) => dragState.draggingId === id,
    [dragState.draggingId]
  );

  const isDropTarget = useCallback(
    (id: string) => dragState.dragOverId === id,
    [dragState.dragOverId]
  );

  const getDropPosition = useCallback(
    (id: string) => (dragState.dragOverId === id ? dragState.dropPosition : null),
    [dragState.dragOverId, dragState.dropPosition]
  );

  return {
    dragState,
    getRowDragProps,
    getDragHandleProps,
    isDragging: dragState.draggingId !== null,
    isDraggingRow,
    isDropTarget,
    getDropPosition,
    moveRowUp,
    moveRowDown,
  };
}
