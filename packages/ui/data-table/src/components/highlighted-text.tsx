"use client";

import React, { useMemo } from "react";
import { cn } from "@unisane/ui";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface HighlightedTextProps {
  /** The text content to display */
  text: string;
  /** The search term to highlight */
  searchTerm?: string;
  /** Whether highlighting is enabled */
  enabled?: boolean;
  /** Custom highlight class name */
  highlightClassName?: string;
  /** Whether to match case-sensitively */
  caseSensitive?: boolean;
  /** Additional class name for the container */
  className?: string;
}

export interface HighlightedSpan {
  text: string;
  isHighlighted: boolean;
}

// ─── UTILITY FUNCTIONS ───────────────────────────────────────────────────────

/**
 * Escapes special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Splits text into highlighted and non-highlighted segments.
 */
export function splitTextBySearch(
  text: string,
  searchTerm: string,
  caseSensitive = false
): HighlightedSpan[] {
  if (!searchTerm || !text) {
    return [{ text, isHighlighted: false }];
  }

  const escapedSearch = escapeRegex(searchTerm);
  const regex = new RegExp(`(${escapedSearch})`, caseSensitive ? "g" : "gi");
  const parts = text.split(regex);

  return parts
    .filter((part) => part !== "")
    .map((part) => ({
      text: part,
      isHighlighted: caseSensitive
        ? part === searchTerm
        : part.toLowerCase() === searchTerm.toLowerCase(),
    }));
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

/**
 * Component that highlights matching search terms within text.
 *
 * Uses a performant regex-based approach to split text into segments
 * and highlight matching portions.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <HighlightedText text="John Doe" searchTerm="john" />
 *
 * // With custom styling
 * <HighlightedText
 *   text="Contact email@example.com"
 *   searchTerm="email"
 *   highlightClassName="bg-yellow-200 font-bold"
 * />
 *
 * // Case-sensitive matching
 * <HighlightedText
 *   text="JavaScript and java are different"
 *   searchTerm="Java"
 *   caseSensitive
 * />
 * ```
 */
export function HighlightedText({
  text,
  searchTerm,
  enabled = true,
  highlightClassName,
  caseSensitive = false,
  className,
}: HighlightedTextProps) {
  // Memoize the split segments to avoid recalculation on every render
  const segments = useMemo(() => {
    if (!enabled || !searchTerm || searchTerm.length === 0) {
      return null;
    }
    return splitTextBySearch(text, searchTerm, caseSensitive);
  }, [text, searchTerm, enabled, caseSensitive]);

  // If not highlighting or no search term, return plain text
  if (!segments) {
    return <span className={className}>{text}</span>;
  }

  // If only one segment and not highlighted, return plain text
  if (segments.length === 1 && !segments[0]?.isHighlighted) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {segments.map((segment, index) =>
        segment.isHighlighted ? (
          <mark
            key={index}
            className={cn(
              "bg-primary/20 text-on-surface rounded-sm px-0.5",
              highlightClassName
            )}
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </span>
  );
}

export default HighlightedText;
