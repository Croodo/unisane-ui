import { useMemo } from "react";
import type { NavigationItem, ProcessedNavigationItems } from "../types/navigation";

export function useNavigationItems(
  items: NavigationItem[]
): ProcessedNavigationItems {
  const processed = useMemo(() => {
    const flatItems: NavigationItem[] = [];
    const visitedIds = new Set<string>();

    const flatten = (items: NavigationItem[]) => {
      items.forEach((item) => {
        if (!visitedIds.has(item.id)) {
          flatItems.push(item);
          visitedIds.add(item.id);
        }
        if (item.items) {
          flatten(item.items);
        }
      });
    };
    flatten(items);

    const groupedItems = new Map<string, NavigationItem[]>();
    flatItems.forEach((item) => {
      if (item.group) {
        if (!groupedItems.has(item.group)) {
          groupedItems.set(item.group, []);
        }
        groupedItems.get(item.group)!.push(item);
      }
    });

    const findItem = (id: string): NavigationItem | undefined => {
      return flatItems.find((item) => item.id === id);
    };

    const hasChildren = (id: string): boolean => {
      const item = findItem(id);
      return !!(item?.items && item.items.length > 0);
    };

    const getChildren = (id: string): NavigationItem[] => {
      const item = findItem(id);
      return item?.items || [];
    };

    const buildAncestryChain = (targetId: string): string[] => {
      const chain: string[] = [];

      const findInTree = (
        items: NavigationItem[],
        currentChain: string[]
      ): boolean => {
        for (const item of items) {
          const newChain = [...currentChain, item.id];

          if (item.id === targetId) {
            chain.push(...newChain);
            return true;
          }

          if (item.items && findInTree(item.items, newChain)) {
            return true;
          }
        }
        return false;
      };

      findInTree(items, []);
      return chain;
    };

    return {
      flatItems,
      groupedItems,
      activeChain: [], // Will be computed when activeItem is known
      findItem,
      hasChildren,
      getChildren,
      buildAncestryChain,
    };
  }, [items]);

  return {
    ...processed,
    activeChain: [], // Can be extended with active item support
  };
}
