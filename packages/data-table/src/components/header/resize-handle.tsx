"use client";

import { useCallback, useRef, useEffect } from "react";
import { cn } from "@unisane/ui";
import { useI18n } from "../../i18n";

/** Resize step in pixels for keyboard navigation */
const RESIZE_STEP = 10;
/** Resize step when holding Shift for larger increments */
const RESIZE_STEP_LARGE = 50;

export interface ResizeHandleProps {
  columnKey: string;
  currentWidth: number;
  minWidth?: number;
  maxWidth?: number;
  onResize: (key: string, width: number) => void;
}

export function ResizeHandle({
  columnKey,
  currentWidth,
  minWidth = 50,
  maxWidth = 800,
  onResize,
}: ResizeHandleProps) {
  const { t } = useI18n();
  // Store cleanup function ref to prevent memory leaks
  const cleanupRef = useRef<(() => void) | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // If component unmounts during resize, clean up listeners
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startWidth = currentWidth;

      // Set cursor and prevent text selection during resize
      const prevCursor = document.body.style.cursor;
      const prevUserSelect = document.body.style.userSelect;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + delta));
        onResize(columnKey, newWidth);
      };

      const cleanup = () => {
        // Restore cursor and user select
        document.body.style.cursor = prevCursor;
        document.body.style.userSelect = prevUserSelect;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        cleanupRef.current = null;
      };

      const handleMouseUp = () => {
        cleanup();
      };

      // Store cleanup so it can be called on unmount
      cleanupRef.current = cleanup;

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [columnKey, currentWidth, minWidth, maxWidth, onResize]
  );

  // Keyboard support for resizing: Arrow Left/Right to adjust width
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? RESIZE_STEP_LARGE : RESIZE_STEP;

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          e.stopPropagation();
          onResize(columnKey, Math.min(maxWidth, currentWidth + step));
          break;
        case "ArrowLeft":
          e.preventDefault();
          e.stopPropagation();
          onResize(columnKey, Math.max(minWidth, currentWidth - step));
          break;
        case "Home":
          e.preventDefault();
          e.stopPropagation();
          onResize(columnKey, minWidth);
          break;
        case "End":
          e.preventDefault();
          e.stopPropagation();
          onResize(columnKey, maxWidth);
          break;
      }
    },
    [columnKey, currentWidth, minWidth, maxWidth, onResize]
  );

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={currentWidth}
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      aria-label={t("resizeColumn")}
      tabIndex={0}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "absolute right-0 top-0 bottom-0 w-2 cursor-col-resize",
        "hover:w-3 hover:bg-primary/20 active:bg-primary/40 transition-all",
        "focus:outline-none focus:w-3 focus:bg-primary/30 focus-visible:ring-2 focus-visible:ring-primary",
        "z-10"
      )}
      title={t("resizeColumn")}
    />
  );
}
