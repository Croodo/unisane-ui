"use client";

import { useCallback, useRef, useEffect } from "react";
import { cn } from "@unisane/ui";

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

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "absolute right-0 top-0 bottom-0 w-2 cursor-col-resize",
        "hover:w-3 hover:bg-primary/20 active:bg-primary/40 transition-all",
        "z-10"
      )}
      title="Drag to resize column"
      aria-hidden="true"
    />
  );
}
