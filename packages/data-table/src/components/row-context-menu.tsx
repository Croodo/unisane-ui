"use client";

import React, { useEffect, useRef, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn, Icon } from "@unisane/ui";
import type {
  RowContextMenuItem,
  RowContextMenuSeparator,
  RowContextMenuItemOrSeparator,
  RowContextMenuRenderProps,
} from "../types/index";
import { useI18n } from "../i18n";

// ─── CONTEXT MENU STATE ──────────────────────────────────────────────────────

export interface ContextMenuState<T> {
  isOpen: boolean;
  row: T | null;
  position: { x: number; y: number };
}

// ─── HOOK: useRowContextMenu ─────────────────────────────────────────────────

export interface UseRowContextMenuOptions<T> {
  /** Items to display in the context menu */
  items?: RowContextMenuItemOrSeparator<T>[];
  /** Custom renderer for the context menu */
  renderContextMenu?: (props: RowContextMenuRenderProps<T>) => ReactNode;
  /** Callback when context menu opens */
  onOpen?: (row: T, position: { x: number; y: number }) => void;
  /** Callback when context menu closes */
  onClose?: () => void;
}

export interface UseRowContextMenuReturn<T> {
  /** Current context menu state */
  menuState: ContextMenuState<T>;
  /** Handler for row context menu event */
  handleRowContextMenu: (row: T, event: React.MouseEvent) => void;
  /** Close the context menu */
  closeMenu: () => void;
  /** Open the context menu programmatically */
  openMenu: (row: T, position: { x: number; y: number }) => void;
}

export function useRowContextMenu<T extends { id: string }>({
  onOpen,
  onClose,
}: UseRowContextMenuOptions<T> = {}): UseRowContextMenuReturn<T> {
  const [menuState, setMenuState] = React.useState<ContextMenuState<T>>({
    isOpen: false,
    row: null,
    position: { x: 0, y: 0 },
  });

  const handleRowContextMenu = useCallback(
    (row: T, event: React.MouseEvent) => {
      event.preventDefault();
      const position = { x: event.clientX, y: event.clientY };
      setMenuState({ isOpen: true, row, position });
      onOpen?.(row, position);
    },
    [onOpen]
  );

  const closeMenu = useCallback(() => {
    setMenuState((prev) => ({ ...prev, isOpen: false }));
    onClose?.();
  }, [onClose]);

  const openMenu = useCallback(
    (row: T, position: { x: number; y: number }) => {
      setMenuState({ isOpen: true, row, position });
      onOpen?.(row, position);
    },
    [onOpen]
  );

  return {
    menuState,
    handleRowContextMenu,
    closeMenu,
    openMenu,
  };
}

// ─── CONTEXT MENU COMPONENT ──────────────────────────────────────────────────

export interface RowContextMenuProps<T extends { id: string }> {
  /** Current menu state */
  state: ContextMenuState<T>;
  /** Close the menu */
  onClose: () => void;
  /** Menu items */
  items: RowContextMenuItemOrSeparator<T>[];
  /** Selected row IDs */
  selectedIds?: string[];
  /** Custom renderer (overrides items) */
  renderMenu?: (props: RowContextMenuRenderProps<T>) => ReactNode;
}

function isMenuItem<T>(
  item: RowContextMenuItemOrSeparator<T>
): item is RowContextMenuItem<T> {
  return !("type" in item && item.type === "separator");
}

export function RowContextMenu<T extends { id: string }>({
  state,
  onClose,
  items,
  selectedIds = [],
  renderMenu,
}: RowContextMenuProps<T>) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!state.isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    // Close on scroll
    const handleScroll = () => {
      onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [state.isOpen, onClose]);

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (!state.isOpen || !menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let { x, y } = state.position;

    // Adjust horizontal position
    if (x + rect.width > viewportWidth - 8) {
      x = viewportWidth - rect.width - 8;
    }

    // Adjust vertical position
    if (y + rect.height > viewportHeight - 8) {
      y = viewportHeight - rect.height - 8;
    }

    // Ensure minimum position
    x = Math.max(8, x);
    y = Math.max(8, y);

    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
  }, [state.isOpen, state.position]);

  if (!state.isOpen || !state.row) {
    return null;
  }

  const row = state.row;
  const isSelected = selectedIds.includes(row.id);

  // Use custom renderer if provided
  if (renderMenu) {
    return createPortal(
      <div
        ref={menuRef}
        className="fixed z-50"
        style={{
          left: state.position.x,
          top: state.position.y,
        }}
      >
        {renderMenu({
          row,
          position: state.position,
          onClose,
          selectedIds,
          isSelected,
        })}
      </div>,
      document.body
    );
  }

  // Filter visible items
  const visibleItems = items.filter((item) => {
    if (!isMenuItem(item)) return true;
    if (item.visible === undefined) return true;
    if (typeof item.visible === "function") return item.visible(row);
    return item.visible;
  });

  const handleItemClick = async (
    item: RowContextMenuItem<T>,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    // Check if disabled
    const isDisabled =
      typeof item.disabled === "function"
        ? item.disabled(row)
        : item.disabled;

    if (isDisabled) return;

    try {
      await item.onClick(row, event);
    } finally {
      onClose();
    }
  };

  return createPortal(
    <div
      ref={menuRef}
      className={cn(
        "fixed z-50 min-w-48 py-1",
        "bg-surface-container rounded-lg shadow-lg",
        "border border-outline-variant/30",
        "animate-in fade-in-0 zoom-in-95 duration-100"
      )}
      style={{
        left: state.position.x,
        top: state.position.y,
      }}
      role="menu"
      aria-orientation="vertical"
    >
      {visibleItems.map((item, index) => {
        // Separator
        if (!isMenuItem(item)) {
          return (
            <div
              key={item.key ?? `separator-${index}`}
              className="my-1 h-px bg-outline-variant/50"
              role="separator"
            />
          );
        }

        // Menu item
        const isDisabled =
          typeof item.disabled === "function"
            ? item.disabled(row)
            : item.disabled;

        const icon = item.icon;
        const iconElement =
          typeof icon === "string" ? (
            <Icon symbol={icon} className="w-4 h-4" />
          ) : (
            icon
          );

        return (
          <button
            key={item.key}
            type="button"
            role="menuitem"
            disabled={isDisabled}
            onClick={(e) => handleItemClick(item, e)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-left",
              "text-body-medium transition-colors duration-snappy",
              "focus:outline-none focus-visible:bg-on-surface/8",
              item.variant === "danger"
                ? "text-error hover:bg-error/8 focus-visible:bg-error/8"
                : "text-on-surface hover:bg-on-surface/8",
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {iconElement && (
              <span
                className={cn(
                  "shrink-0",
                  item.variant === "danger"
                    ? "text-error"
                    : "text-on-surface-variant"
                )}
              >
                {iconElement}
              </span>
            )}
            <span className="flex-1">{item.label}</span>
          </button>
        );
      })}
    </div>,
    document.body
  );
}

// ─── DEFAULT CONTEXT MENU ITEMS ──────────────────────────────────────────────

interface CreateDefaultContextMenuItemsOptions<T extends { id: string }> {
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDuplicate?: (row: T) => void;
  onDelete?: (row: T) => void;
  onCopyId?: (row: T) => void;
  onSelect?: (row: T) => void;
  isSelected?: (row: T) => boolean;
}

/**
 * Hook to create default context menu items with i18n support
 */
export function useDefaultContextMenuItems<T extends { id: string }>(
  options: CreateDefaultContextMenuItemsOptions<T>
): RowContextMenuItemOrSeparator<T>[] {
  const { t } = useI18n();
  // Wrap t to match the expected signature
  const translate = (key: string) => t(key as keyof import("../i18n").DataTableStrings);
  return createDefaultContextMenuItemsWithTranslator(options, translate);
}

/**
 * Creates default context menu items for common row actions
 * @deprecated Use useDefaultContextMenuItems hook for i18n support
 */
export function createDefaultContextMenuItems<T extends { id: string }>(
  options: CreateDefaultContextMenuItemsOptions<T>
): RowContextMenuItemOrSeparator<T>[] {
  // Fallback to English labels for backwards compatibility
  const fallbackT = (key: string) => {
    const labels: Record<string, string> = {
      viewDetails: "View details",
      edit: "Edit",
      duplicate: "Duplicate",
      select: "Select",
      copyId: "Copy ID",
      delete: "Delete",
    };
    return labels[key] ?? key;
  };
  return createDefaultContextMenuItemsWithTranslator(options, fallbackT);
}

/**
 * Internal function to create context menu items with a translator
 */
function createDefaultContextMenuItemsWithTranslator<T extends { id: string }>(
  options: CreateDefaultContextMenuItemsOptions<T>,
  t: (key: string) => string
): RowContextMenuItemOrSeparator<T>[] {
  const items: RowContextMenuItemOrSeparator<T>[] = [];

  if (options.onView) {
    items.push({
      key: "view",
      label: t("viewDetails"),
      icon: "visibility",
      onClick: (row) => options.onView!(row),
    });
  }

  if (options.onEdit) {
    items.push({
      key: "edit",
      label: t("edit"),
      icon: "edit",
      onClick: (row) => options.onEdit!(row),
    });
  }

  if (options.onDuplicate) {
    items.push({
      key: "duplicate",
      label: t("duplicate"),
      icon: "content_copy",
      onClick: (row) => options.onDuplicate!(row),
    });
  }

  if ((options.onView || options.onEdit || options.onDuplicate) &&
      (options.onDelete || options.onCopyId || options.onSelect)) {
    items.push({ type: "separator" });
  }

  if (options.onSelect) {
    items.push({
      key: "select",
      label: t("select"),
      icon: options.isSelected ? "check_box" : "check_box_outline_blank",
      onClick: (row) => options.onSelect!(row),
    });
  }

  if (options.onCopyId) {
    items.push({
      key: "copy-id",
      label: t("copyId"),
      icon: "content_copy",
      onClick: (row) => options.onCopyId!(row),
    });
  }

  if (options.onDelete) {
    const lastItem = items[items.length - 1];
    const lastIsSeparator = lastItem && "type" in lastItem && lastItem.type === "separator";
    if (items.length > 0 && !lastIsSeparator) {
      items.push({ type: "separator" });
    }
    items.push({
      key: "delete",
      label: t("delete"),
      icon: "delete",
      variant: "danger",
      onClick: (row) => options.onDelete!(row),
    });
  }

  return items;
}

export default RowContextMenu;
