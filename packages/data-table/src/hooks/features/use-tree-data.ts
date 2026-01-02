"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import type { TreeDataConfig, FlattenedTreeRow, TreeDataState } from "../../types";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface UseTreeDataOptions<T extends { id: string }> {
  /** Raw hierarchical data */
  data: T[];
  /** Tree configuration */
  config: TreeDataConfig<T>;
  /** Externally controlled expanded nodes */
  expandedNodes?: Set<string>;
  /** Callback when expanded nodes change */
  onExpandedChange?: (expandedNodes: Set<string>) => void;
}

export interface UseTreeDataReturn<T extends { id: string }> {
  /** Flattened rows ready for rendering */
  flattenedRows: FlattenedTreeRow<T>[];
  /** Current tree state */
  treeState: TreeDataState;
  /** Expand a specific node */
  expandNode: (nodeId: string) => void;
  /** Collapse a specific node */
  collapseNode: (nodeId: string) => void;
  /** Toggle a specific node */
  toggleNode: (nodeId: string) => void;
  /** Expand all nodes */
  expandAll: () => void;
  /** Collapse all nodes */
  collapseAll: () => void;
  /** Expand all descendants of a node */
  expandAllDescendants: (nodeId: string) => void;
  /** Collapse all descendants of a node */
  collapseAllDescendants: (nodeId: string) => void;
  /** Check if a node is expanded */
  isNodeExpanded: (nodeId: string) => boolean;
  /** Check if a node is loading */
  isNodeLoading: (nodeId: string) => boolean;
  /** Get all descendant IDs of a node */
  getDescendantIds: (nodeId: string) => string[];
  /** Get depth/level of a node */
  getNodeLevel: (nodeId: string) => number;
}

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

/**
 * Gets children of a row using config
 */
function getChildren<T>(row: T, config: TreeDataConfig<T>): T[] {
  if (config.getSubRows) {
    return config.getSubRows(row) ?? [];
  }
  if (config.childrenField) {
    const children = row[config.childrenField];
    return Array.isArray(children) ? children : [];
  }
  return [];
}

/**
 * Collects all node IDs in a tree
 */
function collectAllNodeIds<T extends { id: string }>(
  rows: T[],
  config: TreeDataConfig<T>,
  maxDepth: number = Infinity,
  currentDepth: number = 0
): string[] {
  const ids: string[] = [];

  for (const row of rows) {
    ids.push(row.id);
    if (currentDepth < maxDepth) {
      const children = getChildren(row, config);
      if (children.length > 0) {
        ids.push(...collectAllNodeIds(children, config, maxDepth, currentDepth + 1));
      }
    }
  }

  return ids;
}

/**
 * Collects all descendant IDs of a specific node
 */
function collectDescendantIds<T extends { id: string }>(
  rows: T[],
  config: TreeDataConfig<T>,
  targetId: string,
  found: boolean = false
): string[] {
  const ids: string[] = [];

  for (const row of rows) {
    const children = getChildren(row, config);

    if (row.id === targetId || found) {
      // Collect all children and their descendants
      for (const child of children) {
        ids.push(child.id);
        ids.push(...collectDescendantIds([child], config, targetId, true));
      }
      if (row.id === targetId) {
        return ids;
      }
    } else {
      // Keep searching
      const descendantIds = collectDescendantIds(children, config, targetId, false);
      if (descendantIds.length > 0) {
        return descendantIds;
      }
    }
  }

  return ids;
}

/**
 * Finds a node and returns its depth
 */
function findNodeLevel<T extends { id: string }>(
  rows: T[],
  config: TreeDataConfig<T>,
  targetId: string,
  currentLevel: number = 0
): number {
  for (const row of rows) {
    if (row.id === targetId) {
      return currentLevel;
    }
    const children = getChildren(row, config);
    if (children.length > 0) {
      const foundLevel = findNodeLevel(children, config, targetId, currentLevel + 1);
      if (foundLevel >= 0) {
        return foundLevel;
      }
    }
  }
  return -1;
}

// ─── HOOK ────────────────────────────────────────────────────────────────────

/**
 * Hook for managing tree/hierarchical data in the data table.
 *
 * Features:
 * - Flattens hierarchical data for rendering
 * - Tracks expanded/collapsed state per node
 * - Supports lazy loading of children
 * - Provides utilities for tree manipulation
 *
 * @example
 * ```tsx
 * const { flattenedRows, toggleNode, expandAll } = useTreeData({
 *   data: employees,
 *   config: {
 *     getSubRows: (row) => row.directReports,
 *     defaultExpanded: false,
 *   },
 * });
 * ```
 */
export function useTreeData<T extends { id: string }>({
  data,
  config,
  expandedNodes: externalExpanded,
  onExpandedChange,
}: UseTreeDataOptions<T>): UseTreeDataReturn<T> {
  // ─── STATE ─────────────────────────────────────────────────────────────────

  const [internalExpanded, setInternalExpanded] = useState<Set<string>>(() => {
    if (config.defaultExpanded) {
      const maxDepth = config.autoExpandDepth ?? Infinity;
      const allIds = collectAllNodeIds(data, config, maxDepth - 1);
      return new Set(allIds);
    }
    return new Set();
  });

  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const [loadedChildren, setLoadedChildren] = useState<Map<string, T[]>>(new Map());

  // Use external or internal state
  const expandedSet = externalExpanded ?? internalExpanded;
  const isControlled = externalExpanded !== undefined;

  // Cache for node lookups
  const nodeCacheRef = useRef<Map<string, { row: T; level: number }>>(new Map());

  // ─── TREE STATE ────────────────────────────────────────────────────────────

  const treeState: TreeDataState = useMemo(
    () => ({
      expandedNodes: expandedSet,
      loadingNodes,
      loadedChildren: loadedChildren as Map<string, unknown[]>,
    }),
    [expandedSet, loadingNodes, loadedChildren]
  );

  // ─── UPDATE HELPERS ────────────────────────────────────────────────────────

  const updateExpanded = useCallback(
    (updater: (prev: Set<string>) => Set<string>) => {
      if (isControlled) {
        onExpandedChange?.(updater(expandedSet));
      } else {
        setInternalExpanded(updater);
      }
    },
    [isControlled, expandedSet, onExpandedChange]
  );

  // ─── FLATTEN LOGIC ─────────────────────────────────────────────────────────

  const flattenedRows = useMemo(() => {
    const result: FlattenedTreeRow<T>[] = [];
    nodeCacheRef.current.clear();

    function flatten(
      rows: T[],
      level: number,
      parentId: string | null,
      path: string[],
      lastChildIndices: number[]
    ): void {
      rows.forEach((row, i) => {
        const isLast = i === rows.length - 1;
        const nodeId = row.id;

        // Get children (including lazy-loaded)
        let children = getChildren(row, config);
        const lazyChildren = loadedChildren.get(nodeId);
        if (lazyChildren) {
          children = [...children, ...(lazyChildren as T[])];
        }

        const hasChildren = children.length > 0 || (config.onLoadChildren !== undefined && !loadedChildren.has(nodeId));
        const isExpanded = expandedSet.has(nodeId);
        const isLoading = loadingNodes.has(nodeId);
        const currentPath = [...path, nodeId];
        const currentLastChildIndices = isLast
          ? [...lastChildIndices, level]
          : lastChildIndices;

        // Cache node info
        nodeCacheRef.current.set(nodeId, { row, level });

        // Add flattened row
        result.push({
          type: "tree-row",
          data: row,
          nodeId,
          parentId,
          level,
          path: currentPath,
          hasChildren,
          isExpanded,
          isLoading,
          isLastChild: isLast,
          lastChildIndices: currentLastChildIndices,
        });

        // Recurse into children if expanded
        if (isExpanded && children.length > 0) {
          flatten(children, level + 1, nodeId, currentPath, currentLastChildIndices);
        }
      });
    }

    flatten(data, 0, null, [], []);
    return result;
  }, [data, config, expandedSet, loadingNodes, loadedChildren]);

  // ─── NODE OPERATIONS ───────────────────────────────────────────────────────

  const expandNode = useCallback(
    async (nodeId: string) => {
      // Handle lazy loading
      if (config.onLoadChildren && !loadedChildren.has(nodeId)) {
        const cached = nodeCacheRef.current.get(nodeId);
        if (cached) {
          const existingChildren = getChildren(cached.row, config);
          if (existingChildren.length === 0) {
            // Need to lazy load
            setLoadingNodes((prev) => new Set(prev).add(nodeId));
            try {
              const children = await config.onLoadChildren(cached.row);
              setLoadedChildren((prev) => new Map(prev).set(nodeId, children));
              config.onNodeExpand?.(cached.row, [...(nodeCacheRef.current.get(nodeId)?.row ? [nodeId] : [])]);
            } catch (error) {
              console.error("Failed to load children for node:", nodeId, error);
            } finally {
              setLoadingNodes((prev) => {
                const next = new Set(prev);
                next.delete(nodeId);
                return next;
              });
            }
          }
        }
      }

      updateExpanded((prev) => {
        const next = new Set(prev);
        next.add(nodeId);
        return next;
      });

      // Fire callback
      const cached = nodeCacheRef.current.get(nodeId);
      if (cached) {
        const path = flattenedRows.find((r) => r.nodeId === nodeId)?.path ?? [nodeId];
        config.onNodeExpand?.(cached.row, path);
      }
    },
    [config, loadedChildren, updateExpanded, flattenedRows]
  );

  const collapseNode = useCallback(
    (nodeId: string) => {
      updateExpanded((prev) => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });

      // Fire callback
      const cached = nodeCacheRef.current.get(nodeId);
      if (cached) {
        const path = flattenedRows.find((r) => r.nodeId === nodeId)?.path ?? [nodeId];
        config.onNodeCollapse?.(cached.row, path);
      }
    },
    [config, updateExpanded, flattenedRows]
  );

  const toggleNode = useCallback(
    (nodeId: string) => {
      if (expandedSet.has(nodeId)) {
        collapseNode(nodeId);
      } else {
        expandNode(nodeId);
      }
    },
    [expandedSet, expandNode, collapseNode]
  );

  const expandAll = useCallback(() => {
    const allIds = collectAllNodeIds(data, config);
    updateExpanded(() => new Set(allIds));
  }, [data, config, updateExpanded]);

  const collapseAll = useCallback(() => {
    updateExpanded(() => new Set());
  }, [updateExpanded]);

  const expandAllDescendants = useCallback(
    (nodeId: string) => {
      const descendantIds = collectDescendantIds(data, config, nodeId);
      updateExpanded((prev) => {
        const next = new Set(prev);
        next.add(nodeId);
        for (const id of descendantIds) {
          next.add(id);
        }
        return next;
      });
    },
    [data, config, updateExpanded]
  );

  const collapseAllDescendants = useCallback(
    (nodeId: string) => {
      const descendantIds = collectDescendantIds(data, config, nodeId);
      updateExpanded((prev) => {
        const next = new Set(prev);
        for (const id of descendantIds) {
          next.delete(id);
        }
        return next;
      });
    },
    [data, config, updateExpanded]
  );

  // ─── UTILITY FUNCTIONS ─────────────────────────────────────────────────────

  const isNodeExpanded = useCallback(
    (nodeId: string) => expandedSet.has(nodeId),
    [expandedSet]
  );

  const isNodeLoading = useCallback(
    (nodeId: string) => loadingNodes.has(nodeId),
    [loadingNodes]
  );

  const getDescendantIds = useCallback(
    (nodeId: string) => collectDescendantIds(data, config, nodeId),
    [data, config]
  );

  const getNodeLevel = useCallback(
    (nodeId: string) => {
      const cached = nodeCacheRef.current.get(nodeId);
      if (cached) return cached.level;
      return findNodeLevel(data, config, nodeId);
    },
    [data, config]
  );

  // ─── RETURN ────────────────────────────────────────────────────────────────

  return {
    flattenedRows,
    treeState,
    expandNode,
    collapseNode,
    toggleNode,
    expandAll,
    collapseAll,
    expandAllDescendants,
    collapseAllDescendants,
    isNodeExpanded,
    isNodeLoading,
    getDescendantIds,
    getNodeLevel,
  };
}

export default useTreeData;
