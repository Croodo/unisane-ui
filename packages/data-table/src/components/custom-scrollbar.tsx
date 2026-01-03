"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@unisane/ui";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const SCROLLBAR_HEIGHT = 10;
const MIN_THUMB_WIDTH = 30;

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface CustomScrollbarProps {
  /** Ref to the table container element */
  tableContainerRef: React.RefObject<HTMLDivElement | null>;
  /** Width of left-pinned columns (scrollbar track starts after this) */
  pinnedLeftWidth: number;
  /** Width of right-pinned columns (scrollbar track ends before this) */
  pinnedRightWidth: number;
  /** Dependencies that should trigger scrollbar recalculation */
  dependencies?: unknown[];
  /** Additional class names */
  className?: string;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export const CustomScrollbar: React.FC<CustomScrollbarProps> = ({
  tableContainerRef,
  pinnedLeftWidth,
  pinnedRightWidth,
  dependencies = [],
  className = "",
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);

  // State
  const [thumbWidth, setThumbWidth] = useState(0);
  const [thumbLeft, setThumbLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  // Drag refs
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const thumbWidthRef = useRef(thumbWidth);

  useEffect(() => {
    thumbWidthRef.current = thumbWidth;
  }, [thumbWidth]);

  // Update scrollbar dimensions
  const updateScrollbar = useCallback(() => {
    const container = tableContainerRef.current;
    const track = trackRef.current;

    if (!container) return;

    const { scrollWidth, clientWidth, scrollLeft } = container;
    const overflow = scrollWidth > clientWidth;

    setHasOverflow(overflow);

    if (!overflow || !track) return;

    const trackWidth = track.clientWidth;
    if (trackWidth <= 0) return;

    const ratio = clientWidth / scrollWidth;
    const newThumbWidth = Math.max(ratio * trackWidth, MIN_THUMB_WIDTH);
    const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
    const maxThumbLeft = Math.max(0, trackWidth - newThumbWidth);
    const newThumbLeft = maxScrollLeft > 0 ? (scrollLeft / maxScrollLeft) * maxThumbLeft : 0;

    setThumbWidth(newThumbWidth);
    setThumbLeft(newThumbLeft);
  }, [tableContainerRef]);

  // Setup listeners
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    // Initial update after a frame to ensure DOM is ready
    requestAnimationFrame(updateScrollbar);

    container.addEventListener("scroll", updateScrollbar);
    window.addEventListener("resize", updateScrollbar);

    const observer = new ResizeObserver(updateScrollbar);
    observer.observe(container);

    return () => {
      container.removeEventListener("scroll", updateScrollbar);
      window.removeEventListener("resize", updateScrollbar);
      observer.disconnect();
    };
  }, [tableContainerRef, updateScrollbar]);

  // Re-run when dependencies change
  useEffect(() => {
    requestAnimationFrame(updateScrollbar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinnedLeftWidth, pinnedRightWidth, ...dependencies]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const container = tableContainerRef.current;
    if (!container) return;

    setIsDragging(true);
    startXRef.current = e.clientX;
    startScrollLeftRef.current = container.scrollLeft;

    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
  }, [tableContainerRef]);

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
      const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);

      if (maxThumbLeft === 0 || maxScrollLeft === 0) return;

      const ratio = maxScrollLeft / maxThumbLeft;
      const newScrollLeft = Math.max(0, Math.min(maxScrollLeft, startScrollLeftRef.current + deltaX * ratio));

      container.scrollLeft = newScrollLeft;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.removeProperty("user-select");
      document.body.style.removeProperty("cursor");
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, tableContainerRef]);

  // Track click handler
  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    const container = tableContainerRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!container || !track || !thumb) return;

    // Don't handle if clicking on thumb
    if (e.target === thumb) return;

    const trackRect = track.getBoundingClientRect();
    const clickX = e.clientX - trackRect.left;
    const trackWidth = track.clientWidth;
    const currentThumbWidth = thumbWidthRef.current;
    const maxThumbLeft = Math.max(0, trackWidth - currentThumbWidth);
    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);

    // Center the thumb on the click position
    const targetThumbLeft = Math.max(0, Math.min(maxThumbLeft, clickX - currentThumbWidth / 2));

    if (maxThumbLeft > 0) {
      const newScrollLeft = (targetThumbLeft / maxThumbLeft) * maxScrollLeft;
      container.scrollTo({ left: newScrollLeft, behavior: "smooth" });
    }
  }, [tableContainerRef]);

  // Render scrollbar container - hidden on mobile where native touch scrollbar is used
  return (
    <div
      className={cn(
        "w-full relative bg-surface border-t border-outline-variant/50",
        // Hide on mobile (< @md) - native scrollbar used for touch usability
        "hidden @md:block",
        className
      )}
      style={{ height: `${SCROLLBAR_HEIGHT}px` }}
    >
      {/* Track - only show contents when there's overflow */}
      <div
        ref={trackRef}
        onClick={hasOverflow ? handleTrackClick : undefined}
        className={cn(
          "absolute top-0 bottom-0 transition-colors",
          hasOverflow && "cursor-pointer",
          hasOverflow && (isDragging ? "bg-on-surface/8" : "bg-transparent hover:bg-on-surface/5")
        )}
        style={{
          left: pinnedLeftWidth,
          right: pinnedRightWidth,
        }}
      >
        {/* Thumb - only render when there's overflow */}
        {hasOverflow && thumbWidth > 0 && (
          <div
            ref={thumbRef}
            className={cn(
              "absolute top-0 bottom-0 transition-colors",
              isDragging
                ? "bg-primary"
                : "bg-outline-variant/70 hover:bg-outline-variant"
            )}
            style={{
              width: thumbWidth,
              transform: `translateX(${thumbLeft}px)`,
              cursor: isDragging ? "grabbing" : "grab",
            }}
            onMouseDown={handleMouseDown}
          />
        )}
      </div>
    </div>
  );
};

CustomScrollbar.displayName = "CustomScrollbar";
