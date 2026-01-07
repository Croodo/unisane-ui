import type { CSSProperties } from "react";
import type { PinPosition } from "../types";
import { COLUMN_WIDTHS, Z_INDEX } from "../constants";

interface ColumnMeta {
  width: number;
  left?: number;
  right?: number;
}

interface PinnedStylesResult {
  className: string;
  style: CSSProperties;
}

/**
 * Computes sticky positioning classes and styles for pinned columns
 */
export function getPinnedStyles(
  pinState: PinPosition,
  meta: ColumnMeta,
  options: {
    isHeader?: boolean;
    showBorders?: boolean;
  } = {}
): PinnedStylesResult {
  const { isHeader = false, showBorders = true } = options;
  const zIndex = isHeader ? Z_INDEX.headerPinned : Z_INDEX.bodyPinned;

  const style: CSSProperties = {
    width: meta.width,
    minWidth: meta.width,
    maxWidth: meta.width,
  };

  if (pinState === "left") {
    style.left = meta.left;
    const borderClass = showBorders ? "border-r border-border" : "";
    return {
      className: `md:sticky z-${zIndex} ${borderClass} md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] clip-right`,
      style,
    };
  }

  if (pinState === "right") {
    style.right = meta.right;
    const borderClass = showBorders ? "border-l border-border" : "";
    return {
      className: `md:sticky z-${zIndex} ${borderClass} md:shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] clip-left`,
      style,
    };
  }

  return { className: "", style };
}

/**
 * Gets styles for fixed-width columns (checkbox, expander)
 */
export function getFixedColumnStyles(
  type: "checkbox" | "expander",
  options: {
    isHeader?: boolean;
    hasCheckbox?: boolean;
    showBorders?: boolean;
  } = {}
): { className: string; style: CSSProperties } {
  const { isHeader = false, hasCheckbox = true, showBorders = true } = options;
  const zIndex = isHeader ? Z_INDEX.headerPinned : Z_INDEX.bodyPinned;
  const borderClass = showBorders ? "border-r border-border" : "";

  if (type === "checkbox") {
    return {
      className: `md:sticky left-0 z-${zIndex} ${borderClass}`,
      style: {
        width: COLUMN_WIDTHS.checkbox,
        minWidth: COLUMN_WIDTHS.checkbox,
        maxWidth: COLUMN_WIDTHS.checkbox,
      },
    };
  }

  // Expander
  return {
    className: `md:sticky z-${zIndex} ${borderClass}`,
    style: {
      left: hasCheckbox ? COLUMN_WIDTHS.checkbox : 0,
      width: COLUMN_WIDTHS.expander,
      minWidth: COLUMN_WIDTHS.expander,
      maxWidth: COLUMN_WIDTHS.expander,
    },
  };
}
