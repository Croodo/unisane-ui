import { useEffect, useRef, useState, useCallback } from "react";

interface ResizeState {
  startX: number;
  startWidth: number;
  key: string;
}

export function useColumnResize(
  onResize: (key: string, width: number) => void
) {
  const [isResizing, setIsResizing] = useState(false);
  const resizingRef = useRef<ResizeState | null>(null);
  const prevCursorRef = useRef<string | null>(null);
  const prevUserSelectRef = useRef<string | null>(null);

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const { startX, startWidth, key } = resizingRef.current;
      const delta = e.clientX - startX;
      const newWidth = Math.max(startWidth + delta, 50);
      onResize(key, newWidth);
    };

    const handleMouseUp = () => {
      if (resizingRef.current) {
        resizingRef.current = null;
        setIsResizing(false);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [onResize]);

  // Cursor style during resize
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isResizing) return;

    prevCursorRef.current = document.body.style.cursor || null;
    prevUserSelectRef.current = document.body.style.userSelect || null;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      if (prevCursorRef.current !== null) {
        document.body.style.cursor = prevCursorRef.current;
      } else {
        document.body.style.removeProperty("cursor");
      }
      if (prevUserSelectRef.current !== null) {
        document.body.style.userSelect = prevUserSelectRef.current;
      } else {
        document.body.style.removeProperty("user-select");
      }
    };
  }, [isResizing]);

  const startResize = useCallback(
    (e: React.MouseEvent, key: string, currentWidth: number) => {
      e.preventDefault();
      e.stopPropagation();
      resizingRef.current = {
        startX: e.clientX,
        startWidth: currentWidth,
        key,
      };
      setIsResizing(true);
    },
    []
  );

  return { isResizing, startResize };
}
