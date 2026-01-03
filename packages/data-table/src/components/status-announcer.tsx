"use client";

import React from "react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface StatusAnnouncerProps {
  /**
   * Status message for the polite status region.
   * Announces loading state, row counts, and selection info.
   */
  statusMessage: string;
  /**
   * ID for the assertive announcer region.
   * Used to announce state changes like sort and filter updates.
   */
  announcerRegionId: string;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

/**
 * StatusAnnouncer - Screen reader status and announcement regions.
 *
 * Provides two ARIA live regions:
 * 1. Polite status (role="status") - Announces current table state
 * 2. Assertive announcer (role="log") - Announces state changes
 *
 * This component is extracted from DataTableInner for maintainability.
 * It should be rendered at the top of the table container.
 *
 * @example
 * ```tsx
 * <StatusAnnouncer
 *   statusMessage="Showing 1-25 of 100 items"
 *   announcerRegionId="table-announcer"
 * />
 * ```
 */
export function StatusAnnouncer({
  statusMessage,
  announcerRegionId,
}: StatusAnnouncerProps) {
  return (
    <>
      {/* Screen reader status (polite) */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>
      {/* Screen reader announcements for state changes (assertive) */}
      <div
        id={announcerRegionId}
        role="log"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
}

export default StatusAnnouncer;
