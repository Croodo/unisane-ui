import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CONFIG } from "../constants";

interface CustomScrollbarProps {
  tableContainerRef: React.RefObject<HTMLDivElement | null>;
  pinnedLeftWidth: number;
  pinnedRightWidth: number;
  dependencies?: any[];
  className?: string;
}

const MIN_THUMB_WIDTH = 30;

export const CustomScrollbar: React.FC<CustomScrollbarProps> = ({
  tableContainerRef,
  pinnedLeftWidth,
  pinnedRightWidth,
  dependencies = [],
  className = "",
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);

  // Visual state
  const [thumbWidth, setThumbWidth] = useState(0);
  const [thumbLeft, setThumbLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Drag refs (no need for React state)
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const prevUserSelectRef = useRef<string | null>(null);
  const prevCursorRef = useRef<string | null>(null);

  // Keep a ref copy of thumbWidth for drag math
  const thumbWidthRef = useRef(thumbWidth);
  useEffect(() => {
    thumbWidthRef.current = thumbWidth;
  }, [thumbWidth]);

  // --- Sync thumb with container scroll/resize ---
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const updateScrollbar = () => {
      const { scrollWidth, clientWidth, scrollLeft } = container;

      const hasOverflow = scrollWidth > clientWidth;

      // If no overflow, hide scrollbar
      if (!hasOverflow) {
        if (isVisible) setIsVisible(false);
        return;
      }

      // We have overflow but scrollbar isn't rendered yet: flip visibility,
      // then wait for the next render (where trackRef will exist) to measure.
      if (!isVisible) {
        setIsVisible(true);
        return;
      }

      // From here on, we know:
      // - There IS overflow
      // - isVisible === true, so the track/thumb are rendered
      const track = trackRef.current;
      if (!track) return;

      const trackWidth = track.clientWidth;
      if (trackWidth <= 0) return;

      const ratio = clientWidth / scrollWidth;
      const newThumbWidth = Math.max(ratio * trackWidth, MIN_THUMB_WIDTH);

      const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
      const maxThumbLeft = Math.max(0, trackWidth - newThumbWidth);

      const newThumbLeft =
        maxScrollLeft > 0 ? (scrollLeft / maxScrollLeft) * maxThumbLeft : 0;

      setThumbWidth(newThumbWidth);
      setThumbLeft(newThumbLeft);
    };

    // Initial update
    updateScrollbar();

    // Listeners
    container.addEventListener("scroll", updateScrollbar);
    window.addEventListener("resize", updateScrollbar);

    const observer = new ResizeObserver(() => {
      updateScrollbar();
    });
    observer.observe(container);

    return () => {
      container.removeEventListener("scroll", updateScrollbar);
      window.removeEventListener("resize", updateScrollbar);
      observer.disconnect();
    };
  }, [
    tableContainerRef,
    pinnedLeftWidth,
    pinnedRightWidth,
    isVisible,
    ...dependencies,
  ]);

  // --- Drag logic: move scroll based on thumb drag ---
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = tableContainerRef.current;
      const track = trackRef.current;
      if (!container || !track) return;

      const deltaX = e.clientX - startXRef.current;
      const trackWidth = track.clientWidth;
      const currentThumbWidth = thumbWidthRef.current;

      const maxThumbLeft = Math.max(0, trackWidth - currentThumbWidth);
      const maxScrollLeft = Math.max(
        0,
        container.scrollWidth - container.clientWidth
      );

      if (maxThumbLeft === 0 || maxScrollLeft === 0) return;

      const ratio = maxScrollLeft / maxThumbLeft;
      let newScrollLeft = startScrollLeftRef.current + deltaX * ratio;

      // Clamp scroll to valid range
      newScrollLeft = Math.max(0, Math.min(maxScrollLeft, newScrollLeft));

      container.scrollLeft = newScrollLeft;

      // Keep thumb visually in sync during drag
      const newThumbLeft =
        maxScrollLeft > 0 ? (newScrollLeft / maxScrollLeft) * maxThumbLeft : 0;
      setThumbLeft(newThumbLeft);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Restore original body styles
      if (prevUserSelectRef.current !== null) {
        document.body.style.userSelect = prevUserSelectRef.current;
      } else {
        document.body.style.removeProperty("user-select");
      }
      if (prevCursorRef.current !== null) {
        document.body.style.cursor = prevCursorRef.current;
      } else {
        document.body.style.removeProperty("cursor");
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, tableContainerRef]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!tableContainerRef.current) return;

    setIsDragging(true);
    startXRef.current = e.clientX;
    startScrollLeftRef.current = tableContainerRef.current.scrollLeft;

    // Store and override body styles for smoother drag
    prevUserSelectRef.current = document.body.style.userSelect || null;
    prevCursorRef.current = document.body.style.cursor || null;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "default";
  };

  // Sticky state
  const [isSticky, setIsSticky] = useState(false);
  const [stickyLeft, setStickyLeft] = useState(0);
  const [stickyWidth, setStickyWidth] = useState(0);

  // --- Sticky Logic ---
  useLayoutEffect(() => {
    const checkSticky = () => {
      const container = tableContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Check if table is tall enough to need sticky scrollbar
      // Visible top is above viewport bottom, and bottom is below viewport bottom
      // Also check if we actually have overflow
      const hasOverflow = container.scrollWidth > container.clientWidth;
      const isVisible = rect.top < windowHeight && rect.bottom > windowHeight;
      
      const shouldBeSticky = isVisible && hasOverflow;

      if (shouldBeSticky !== isSticky) {
        setIsSticky(shouldBeSticky);
      }

      if (shouldBeSticky) {
        setStickyLeft(rect.left);
        setStickyWidth(rect.width);
      }
    };

    window.addEventListener("scroll", checkSticky);
    window.addEventListener("resize", checkSticky);
    // Initial check
    checkSticky();

    return () => {
      window.removeEventListener("scroll", checkSticky);
      window.removeEventListener("resize", checkSticky);
    };
  }, [isSticky, tableContainerRef]);

  // When there's no overflow, render nothing
  if (!isVisible) return null;

  const style: React.CSSProperties = isSticky
    ? {
        position: "fixed",
        bottom: 0,
        left: stickyLeft,
        width: stickyWidth,
        height: `${CONFIG.layout.scrollbarHeight}px`,
        zIndex: 50,
      }
    : {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      };

  return (
    <div className={`w-full relative bg-background ${className}`} style={{ height: `${CONFIG.layout.scrollbarHeight}px` }}>
      <div style={style} className="bg-background">
        <div
          ref={trackRef}
          className={`absolute top-0 bottom-0 transition-colors ${
            isDragging ? "bg-muted" : "bg-transparent hover:bg-muted"
          }`}
          style={{
            left: pinnedLeftWidth,
            right: pinnedRightWidth,
          }}
        >
          <div
            ref={thumbRef}
            className={`absolute top-[1px] bottom-[1px] bg-muted hover:bg-primary active:bg-primary transition-colors ${
              isDragging ? "bg-primary" : ""
            }`}
            style={{
              width: thumbWidth,
              transform: `translateX(${thumbLeft}px)`,
              cursor: isDragging ? "grabbing" : "grab",
            }}
            onMouseDown={handleMouseDown}
          />
        </div>
      </div>
    </div>
  );
};
