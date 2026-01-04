"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useI18n } from "../../i18n";
import { useSafeRAF } from "../use-safe-raf";
import { useFeedback } from "../../feedback";

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

export interface DragHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  tabIndex: number;
  role: string;
  "aria-label": string;
  "aria-grabbed": boolean | undefined;
}

export interface UseRowDragReturn {
  /** Current drag state */
  dragState: RowDragState;
  /** Get drag props for a row */
  getRowDragProps: (rowId: string, rowIndex: number) => RowDragProps;
  /** Get drag handle props (for the drag handle element only) */
  getDragHandleProps: (rowId: string, rowIndex: number) => DragHandleProps;
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

// ─── DRAG IMAGE STYLES ───────────────────────────────────────────────────────
// CSS class name for the drag image element - extracted from inline styles (3.0.6)
const DRAG_IMAGE_CLASS = "unisane-dt-drag-image";

/**
 * Injects CSS styles for the drag image once per page load.
 * Uses design system CSS variables for theming support.
 */
const injectDragImageStyles = (() => {
  let injected = false;
  return () => {
    if (injected || typeof document === "undefined") return;
    injected = true;

    const styleId = "unisane-dt-drag-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .${DRAG_IMAGE_CLASS} {
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
      }
      .${DRAG_IMAGE_CLASS}__icon {
        display: flex;
        flex-direction: column;
        gap: 2px;
        opacity: 0.6;
      }
      .${DRAG_IMAGE_CLASS}__line {
        width: 12px;
        height: 2px;
        background: currentColor;
        border-radius: 1px;
      }
    `;
    document.head.appendChild(style);
  };
})();

/**
 * Creates a drag image element with proper styling.
 * Uses CSS classes instead of inline styles for better maintainability.
 */
function createDragImage(rowIndex: number): HTMLDivElement {
  injectDragImageStyles();

  const dragImage = document.createElement("div");
  dragImage.className = DRAG_IMAGE_CLASS;

  // Add drag indicator icon (grip lines)
  const iconSpan = document.createElement("span");
  iconSpan.className = `${DRAG_IMAGE_CLASS}__icon`;
  for (let i = 0; i < 3; i++) {
    const line = document.createElement("span");
    line.className = `${DRAG_IMAGE_CLASS}__line`;
    iconSpan.appendChild(line);
  }

  // Add row indicator text
  const textSpan = document.createElement("span");
  textSpan.textContent = `Row ${rowIndex + 1}`;

  dragImage.appendChild(iconSpan);
  dragImage.appendChild(textSpan);

  return dragImage;
}

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
  const { t } = useI18n();
  const { feedback } = useFeedback();
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

  // Safe RAF for drag state updates
  const { requestFrame } = useSafeRAF();

  // ─── HANDLER CACHING (3.0.5) ─────────────────────────────────────────────────
  // Cache row drag props to avoid creating new handler functions on each call
  const rowDragPropsCache = useRef(new Map<string, RowDragProps>());
  const cacheVersionRef = useRef(0);

  // Helper to safely remove drag image from DOM
  const removeDragImage = useCallback(() => {
    if (dragImageRef.current) {
      // Check if element is still in the DOM and has a parent
      if (dragImageRef.current.parentNode) {
        dragImageRef.current.parentNode.removeChild(dragImageRef.current);
      }
      dragImageRef.current = null;
    }
  }, []);

  // Cleanup drag image on unmount
  useEffect(() => {
    return () => {
      removeDragImage();
    };
  }, [removeDragImage]);

  // Invalidate cache when key dependencies change
  useEffect(() => {
    cacheVersionRef.current += 1;
    rowDragPropsCache.current.clear();
  }, [enabled, data.length]);

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

  // ─── STABLE HANDLER REFS ─────────────────────────────────────────────────────
  // Store handlers in refs to avoid recreating closures on each render
  // while still accessing the latest state/props

  const stateRef = useRef(dragState);
  stateRef.current = dragState;

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const reorderRowsRef = useRef(reorderRows);
  reorderRowsRef.current = reorderRows;

  const handleDragEnd = useCallback(() => {
    removeDragImage();
    dragFromHandleRef.current = false;
    setDragState({
      draggingId: null,
      draggingIndex: null,
      dragOverId: null,
      dropPosition: null,
    });
  }, [removeDragImage]);

  const handleDragEndRef = useRef(handleDragEnd);
  handleDragEndRef.current = handleDragEnd;

  // ─── KEYBOARD HANDLERS ───────────────────────────────────────────────────────

  const moveRowUp = useCallback(
    (rowId: string) => {
      const currentIndex = data.findIndex((row) => row.id === rowId);
      if (currentIndex > 0) {
        const toIndex = currentIndex - 1;
        reorderRows(currentIndex, toIndex);
        // Announce the move for screen readers (1-indexed for user-facing message)
        feedback("rowMoved", { from: currentIndex + 1, to: toIndex + 1 });
      }
    },
    [data, reorderRows, feedback]
  );

  const moveRowDown = useCallback(
    (rowId: string) => {
      const currentIndex = data.findIndex((row) => row.id === rowId);
      if (currentIndex < data.length - 1) {
        const toIndex = currentIndex + 1;
        reorderRows(currentIndex, toIndex);
        // Announce the move for screen readers (1-indexed for user-facing message)
        feedback("rowMoved", { from: currentIndex + 1, to: toIndex + 1 });
      }
    },
    [data, reorderRows, feedback]
  );

  const moveRowUpRef = useRef(moveRowUp);
  moveRowUpRef.current = moveRowUp;

  const moveRowDownRef = useRef(moveRowDown);
  moveRowDownRef.current = moveRowDown;

  // ─── PROP GETTERS WITH STABLE HANDLERS ───────────────────────────────────────

  const getRowDragProps = useCallback(
    (rowId: string, rowIndex: number): RowDragProps => {
      const cacheKey = `${rowId}-${rowIndex}-${cacheVersionRef.current}`;
      const cached = rowDragPropsCache.current.get(cacheKey);
      if (cached) return cached;

      const props: RowDragProps = {
        draggable: enabled,
        onDragStart: (e: React.DragEvent) => {
          if (!enabledRef.current) {
            e.preventDefault();
            return;
          }

          if (!dragFromHandleRef.current) {
            e.preventDefault();
            return;
          }

          e.dataTransfer.setData(DRAG_DATA_TYPE, JSON.stringify({ id: rowId, index: rowIndex }));
          e.dataTransfer.effectAllowed = "move";

          // Create custom drag image using CSS classes (3.0.6)
          const dragImage = createDragImage(rowIndex);
          document.body.appendChild(dragImage);
          dragImageRef.current = dragImage;
          e.dataTransfer.setDragImage(dragImage, 0, 0);

          requestFrame(() => {
            setDragState({
              draggingId: rowId,
              draggingIndex: rowIndex,
              dragOverId: null,
              dropPosition: null,
            });
          });
        },
        onDragEnd: () => handleDragEndRef.current(),
        onDragOver: (e: React.DragEvent) => {
          const state = stateRef.current;
          if (!enabledRef.current || !state.draggingId) return;
          if (state.draggingId === rowId) return;
          if (!e.dataTransfer.types.includes(DRAG_DATA_TYPE)) return;

          e.preventDefault();
          e.dataTransfer.dropEffect = "move";

          const rect = e.currentTarget.getBoundingClientRect();
          const midpoint = rect.top + rect.height / 2;
          const dropPosition: "before" | "after" = e.clientY < midpoint ? "before" : "after";

          setDragState((prev) => ({
            ...prev,
            dragOverId: rowId,
            dropPosition,
          }));
        },
        onDragEnter: (e: React.DragEvent) => {
          const state = stateRef.current;
          if (!enabledRef.current || !state.draggingId) return;
          if (state.draggingId === rowId) return;
          if (!e.dataTransfer.types.includes(DRAG_DATA_TYPE)) return;
          e.preventDefault();
        },
        onDragLeave: (e: React.DragEvent) => {
          const relatedTarget = e.relatedTarget as Node | null;
          const currentTarget = e.currentTarget as Node;

          if (relatedTarget && currentTarget.contains(relatedTarget)) {
            return;
          }

          if (stateRef.current.dragOverId === rowId) {
            setDragState((prev) => ({
              ...prev,
              dragOverId: null,
              dropPosition: null,
            }));
          }
        },
        onDrop: (e: React.DragEvent) => {
          e.preventDefault();

          try {
            const dragData = JSON.parse(e.dataTransfer.getData(DRAG_DATA_TYPE));
            const fromIndex = dragData.index;
            const fromId = dragData.id;

            if (fromId === rowId) {
              handleDragEndRef.current();
              return;
            }

            let toIndex = rowIndex;
            if (stateRef.current.dropPosition === "after") {
              toIndex = rowIndex + 1;
            }

            if (fromIndex < toIndex) {
              toIndex -= 1;
            }

            reorderRowsRef.current(fromIndex, toIndex);
          } catch {
            // Invalid drag data
          }

          handleDragEndRef.current();
        },
      };

      rowDragPropsCache.current.set(cacheKey, props);
      return props;
    },
    [enabled, requestFrame]
  );

  const getDragHandleProps = useCallback(
    (rowId: string, rowIndex: number): DragHandleProps => ({
      onMouseDown: () => {
        dragFromHandleRef.current = true;
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        if (!enabledRef.current) return;

        if (e.altKey && e.key === "ArrowUp") {
          e.preventDefault();
          moveRowUpRef.current(rowId);
        } else if (e.altKey && e.key === "ArrowDown") {
          e.preventDefault();
          moveRowDownRef.current(rowId);
        }
      },
      tabIndex: enabled ? 0 : -1,
      role: "button",
      "aria-label": t("dragRowHandleLabel", { index: rowIndex + 1 }),
      "aria-grabbed": dragState.draggingId === rowId ? true : undefined,
    }),
    [enabled, dragState.draggingId, t]
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
