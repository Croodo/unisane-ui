"use client";

import { useCallback, useRef, useId } from "react";

/**
 * Priority level for announcements
 * - polite: Will wait for other speech to finish (default)
 * - assertive: Will interrupt current speech immediately
 */
export type AnnouncementPriority = "polite" | "assertive";

export interface UseAnnouncerReturn {
  /** Announce a message to screen readers */
  announce: (message: string, priority?: AnnouncementPriority) => void;
  /** ID for the polite live region element */
  politeRegionId: string;
  /** ID for the assertive live region element */
  assertiveRegionId: string;
  /** Get props for rendering the live regions */
  getLiveRegionProps: () => {
    polite: React.HTMLAttributes<HTMLDivElement>;
    assertive: React.HTMLAttributes<HTMLDivElement>;
  };
}

/**
 * Hook for managing screen reader announcements via ARIA live regions.
 *
 * Usage:
 * 1. Call the hook to get the announce function and region IDs
 * 2. Render the live regions using getLiveRegionProps()
 * 3. Call announce() with messages to speak to screen readers
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { announce, getLiveRegionProps } = useAnnouncer();
 *   const regionProps = getLiveRegionProps();
 *
 *   const handleSort = () => {
 *     announce("Sorted by name, ascending");
 *   };
 *
 *   return (
 *     <>
 *       <div {...regionProps.polite} />
 *       <div {...regionProps.assertive} />
 *       <button onClick={handleSort}>Sort</button>
 *     </>
 *   );
 * }
 * ```
 */
export function useAnnouncer(): UseAnnouncerReturn {
  const id = useId();
  const politeRegionId = `${id}-announcer-polite`;
  const assertiveRegionId = `${id}-announcer-assertive`;

  // Track the last message to avoid duplicate announcements
  const lastMessageRef = useRef<string>("");
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback(
    (message: string, priority: AnnouncementPriority = "polite") => {
      // Skip empty messages
      if (!message.trim()) return;

      // Get the appropriate live region
      const regionId = priority === "assertive" ? assertiveRegionId : politeRegionId;
      const region = document.getElementById(regionId);

      if (!region) {
        // Fallback: log warning in development
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `[useAnnouncer] Live region with id "${regionId}" not found. ` +
            "Make sure to render the live region elements."
          );
        }
        return;
      }

      // Clear any pending clear timeout
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }

      // For repeated messages, add a non-breaking space to force re-announcement
      const finalMessage = message === lastMessageRef.current
        ? `${message}\u00A0` // Non-breaking space
        : message;

      lastMessageRef.current = message;

      // Update the live region content
      region.textContent = finalMessage;

      // Clear after a delay to allow for repeated announcements
      clearTimeoutRef.current = setTimeout(() => {
        region.textContent = "";
        lastMessageRef.current = "";
      }, 1000);
    },
    [politeRegionId, assertiveRegionId]
  );

  const getLiveRegionProps = useCallback(
    () => ({
      polite: {
        id: politeRegionId,
        role: "status" as const,
        "aria-live": "polite" as const,
        "aria-atomic": true,
        className: "sr-only",
        style: {
          position: "absolute" as const,
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden" as const,
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap" as const,
          border: 0,
        },
      },
      assertive: {
        id: assertiveRegionId,
        role: "alert" as const,
        "aria-live": "assertive" as const,
        "aria-atomic": true,
        className: "sr-only",
        style: {
          position: "absolute" as const,
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden" as const,
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap" as const,
          border: 0,
        },
      },
    }),
    [politeRegionId, assertiveRegionId]
  );

  return {
    announce,
    politeRegionId,
    assertiveRegionId,
    getLiveRegionProps,
  };
}
