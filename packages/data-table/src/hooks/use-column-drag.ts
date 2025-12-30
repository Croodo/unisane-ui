"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface DragState {
  /** Currently dragging column key */
  draggingKey: string | null;
  /** Column key being dragged over */
  dragOverKey: string | null;
  /** Drop position relative to drag over element */
  dropPosition: "before" | "after" | null;
}

export interface UseColumnDragOptions {
  /** Whether drag-to-reorder is enabled */
  enabled: boolean;
  /** Callback when column is reordered */
  onReorder: (fromKey: string, toKey: string) => void;
}

export interface UseColumnDragReturn {
  /** Current drag state */
  dragState: DragState;
  /** Get drag props for a column header */
  getDragProps: (columnKey: string) => {
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
  /** Whether a column is being dragged */
  isDragging: boolean;
  /** Whether a specific column is being dragged */
  isDraggingColumn: (key: string) => boolean;
  /** Whether a specific column is the drop target */
  isDropTarget: (key: string) => boolean;
  /** Get the drop position for a column */
  getDropPosition: (key: string) => "before" | "after" | null;
}

const DRAG_DATA_TYPE = "text/x-datatable-column";

/**
 * Hook for column drag-to-reorder functionality
 */
export function useColumnDrag({
  enabled,
  onReorder,
}: UseColumnDragOptions): UseColumnDragReturn {
  const [dragState, setDragState] = useState<DragState>({
    draggingKey: null,
    dragOverKey: null,
    dropPosition: null,
  });

  // Track the drag image element
  const dragImageRef = useRef<HTMLDivElement | null>(null);

  // Cleanup drag image on unmount
  useEffect(() => {
    return () => {
      if (dragImageRef.current) {
        document.body.removeChild(dragImageRef.current);
        dragImageRef.current = null;
      }
    };
  }, []);

  const handleDragStart = useCallback(
    (columnKey: string) => (e: React.DragEvent) => {
      if (!enabled) {
        e.preventDefault();
        return;
      }

      // Set drag data
      e.dataTransfer.setData(DRAG_DATA_TYPE, columnKey);
      e.dataTransfer.effectAllowed = "move";

      // Get the column header text (clean up any extra content like sort icons)
      const headerElement = e.currentTarget as HTMLElement;
      const headerText = headerElement.querySelector("span.truncate")?.textContent
        || headerElement.textContent?.trim().split("\n")[0]?.trim()
        || columnKey;

      // Create custom drag image with icon and styled container
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

      // Add drag indicator icon (using CSS for simple grip lines)
      const iconSpan = document.createElement("span");
      iconSpan.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 2px;
        opacity: 0.6;
      `;
      // Create 3 horizontal grip lines
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

      // Add the column name text
      const textSpan = document.createElement("span");
      textSpan.textContent = headerText;

      dragImage.appendChild(iconSpan);
      dragImage.appendChild(textSpan);
      document.body.appendChild(dragImage);
      dragImageRef.current = dragImage;

      e.dataTransfer.setDragImage(dragImage, 0, 0);

      // Update state after a tick to allow browser to capture drag image
      requestAnimationFrame(() => {
        setDragState((prev) => ({ ...prev, draggingKey: columnKey }));
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

    setDragState({
      draggingKey: null,
      dragOverKey: null,
      dropPosition: null,
    });
  }, []);

  const handleDragOver = useCallback(
    (columnKey: string) => (e: React.DragEvent) => {
      if (!enabled || !dragState.draggingKey) return;
      if (dragState.draggingKey === columnKey) return;

      // Check if this is a valid column drag
      if (!e.dataTransfer.types.includes(DRAG_DATA_TYPE)) return;

      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      // Calculate drop position based on mouse position
      const rect = e.currentTarget.getBoundingClientRect();
      const midpoint = rect.left + rect.width / 2;
      const dropPosition: "before" | "after" = e.clientX < midpoint ? "before" : "after";

      setDragState((prev) => ({
        ...prev,
        dragOverKey: columnKey,
        dropPosition,
      }));
    },
    [enabled, dragState.draggingKey]
  );

  const handleDragEnter = useCallback(
    (columnKey: string) => (e: React.DragEvent) => {
      if (!enabled || !dragState.draggingKey) return;
      if (dragState.draggingKey === columnKey) return;

      // Check if this is a valid column drag
      if (!e.dataTransfer.types.includes(DRAG_DATA_TYPE)) return;

      e.preventDefault();
    },
    [enabled, dragState.draggingKey]
  );

  const handleDragLeave = useCallback(
    (columnKey: string) => (e: React.DragEvent) => {
      // Only clear if we're leaving the target (not entering a child)
      const relatedTarget = e.relatedTarget as Node | null;
      const currentTarget = e.currentTarget as Node;

      if (relatedTarget && currentTarget.contains(relatedTarget)) {
        return;
      }

      if (dragState.dragOverKey === columnKey) {
        setDragState((prev) => ({
          ...prev,
          dragOverKey: null,
          dropPosition: null,
        }));
      }
    },
    [dragState.dragOverKey]
  );

  const handleDrop = useCallback(
    (columnKey: string) => (e: React.DragEvent) => {
      e.preventDefault();

      const fromKey = e.dataTransfer.getData(DRAG_DATA_TYPE);
      if (!fromKey || fromKey === columnKey) {
        handleDragEnd();
        return;
      }

      // Perform the reorder
      onReorder(fromKey, columnKey);
      handleDragEnd();
    },
    [onReorder, handleDragEnd]
  );

  const getDragProps = useCallback(
    (columnKey: string) => ({
      // draggable is set here but HeaderCell handles hydration-safe rendering
      draggable: enabled,
      onDragStart: handleDragStart(columnKey),
      onDragEnd: handleDragEnd,
      onDragOver: handleDragOver(columnKey),
      onDragEnter: handleDragEnter(columnKey),
      onDragLeave: handleDragLeave(columnKey),
      onDrop: handleDrop(columnKey),
    }),
    [enabled, handleDragStart, handleDragEnd, handleDragOver, handleDragEnter, handleDragLeave, handleDrop]
  );

  const isDraggingColumn = useCallback(
    (key: string) => dragState.draggingKey === key,
    [dragState.draggingKey]
  );

  const isDropTarget = useCallback(
    (key: string) => dragState.dragOverKey === key,
    [dragState.dragOverKey]
  );

  const getDropPosition = useCallback(
    (key: string) => (dragState.dragOverKey === key ? dragState.dropPosition : null),
    [dragState.dragOverKey, dragState.dropPosition]
  );

  return {
    dragState,
    getDragProps,
    isDragging: dragState.draggingKey !== null,
    isDraggingColumn,
    isDropTarget,
    getDropPosition,
  };
}
