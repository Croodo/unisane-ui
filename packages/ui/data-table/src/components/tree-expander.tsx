"use client";

import React from "react";
import { cn, Icon } from "@unisane/ui";
import { useI18n } from "../i18n";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface TreeExpanderProps {
  /** Whether the node is expanded */
  isExpanded: boolean;
  /** Whether the node has children (can be expanded) */
  hasChildren: boolean;
  /** Whether children are currently loading */
  isLoading?: boolean;
  /** Depth level (0 = root) */
  level: number;
  /** Indent size per level in pixels */
  indentSize?: number;
  /** Toggle expand/collapse */
  onToggle: () => void;
  /** Whether to show indicator for leaf nodes */
  showLeafIndicator?: boolean;
  /** Custom class name */
  className?: string;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

/**
 * Tree expander button component for hierarchical row expansion.
 *
 * Features:
 * - Shows expand/collapse chevron for nodes with children
 * - Shows loading spinner during lazy load
 * - Applies indentation based on tree level
 * - Optional leaf node indicator
 *
 * @example
 * ```tsx
 * <TreeExpander
 *   isExpanded={node.isExpanded}
 *   hasChildren={node.hasChildren}
 *   isLoading={node.isLoading}
 *   level={node.level}
 *   onToggle={() => toggleNode(node.id)}
 * />
 * ```
 */
export function TreeExpander({
  isExpanded,
  hasChildren,
  isLoading = false,
  level,
  indentSize = 24,
  onToggle,
  showLeafIndicator = false,
  className,
}: TreeExpanderProps) {
  const { t } = useI18n();

  // Calculate indentation
  const indent = level * indentSize;

  // Don't render anything for leaf nodes without indicator
  if (!hasChildren && !showLeafIndicator) {
    return <span style={{ width: indent + 24, display: "inline-block" }} />;
  }

  return (
    <span
      className={cn("inline-flex items-center", className)}
      style={{ paddingLeft: indent }}
    >
      {hasChildren ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          disabled={isLoading}
          className={cn(
            "inline-flex items-center justify-center w-6 h-6 rounded-full",
            "text-on-surface-variant hover:bg-on-surface/8 hover:text-on-surface",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            isLoading && "opacity-50 cursor-wait"
          )}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? t("collapseRow") : t("expandRow")}
        >
          {isLoading ? (
            <Icon symbol="progress_activity" className="w-4 h-4 animate-spin text-on-surface-variant" />
          ) : (
            <Icon
              symbol={isExpanded ? "expand_more" : "chevron_right"}
              className={cn(
                "text-[18px] transition-transform duration-150",
                isExpanded && "text-primary"
              )}
            />
          )}
        </button>
      ) : showLeafIndicator ? (
        // Leaf indicator (dot or dash)
        <span className="inline-flex items-center justify-center w-6 h-6">
          <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
        </span>
      ) : null}
    </span>
  );
}

export default TreeExpander;
