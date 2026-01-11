"use client";

import Link from "next/link";
import { cn } from "@unisane/ui/lib/utils";
import { Icon } from "@unisane/ui/primitives/icon";
import { useBreadcrumbs, type Breadcrumb } from "@/src/context/usePageLayout";

// ============================================================================
// Types
// ============================================================================

export type BreadcrumbsProps = {
  /** Override breadcrumbs from store */
  items?: Breadcrumb[];
  /** Custom separator icon */
  separator?: string;
  /** Additional class names */
  className?: string;
  /** Maximum items to show before collapsing */
  maxItems?: number;
  /** Show home icon for first item */
  showHomeIcon?: boolean;
};

// ============================================================================
// Component
// ============================================================================

/**
 * Breadcrumb navigation component.
 *
 * By default, reads breadcrumbs from the usePageLayout store.
 * Can also accept items directly via props.
 *
 * @example
 * ```tsx
 * // Using store (set via PageLayout component)
 * <Breadcrumbs />
 *
 * // With direct items
 * <Breadcrumbs
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Settings', href: '/settings' },
 *     { label: 'Profile' },
 *   ]}
 * />
 * ```
 */
export function Breadcrumbs({
  items: itemsProp,
  separator = "chevron_right",
  className,
  maxItems = 4,
  showHomeIcon = false,
}: BreadcrumbsProps) {
  const storeItems = useBreadcrumbs();
  const items = itemsProp ?? storeItems;

  // Don't render if no items or only one item
  if (!items || items.length <= 1) {
    return null;
  }

  // Handle collapsed breadcrumbs if too many items
  const shouldCollapse = items.length > maxItems;
  type CollapsibleBreadcrumb = Breadcrumb & { collapsed?: boolean };
  const collapsedItem: CollapsibleBreadcrumb = { label: "...", collapsed: true };
  const visibleItems: CollapsibleBreadcrumb[] = shouldCollapse
    ? [
        items[0] as CollapsibleBreadcrumb,
        collapsedItem,
        ...(items.slice(-2) as CollapsibleBreadcrumb[]),
      ]
    : (items as CollapsibleBreadcrumb[]);

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
      <ol className="flex items-center gap-1 text-sm">
        {visibleItems.map((item, index) => {
          if (!item) return null;
          const isLast = index === visibleItems.length - 1;
          const isFirst = index === 0;
          const isCollapsed = item.collapsed;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {/* Separator (except for first item) */}
              {index > 0 && (
                <Icon
                  symbol={separator}
                  size="xs"
                  className="text-on-surface-variant/50 shrink-0"
                  aria-hidden="true"
                />
              )}

              {/* Breadcrumb item */}
              {isCollapsed ? (
                <span className="text-on-surface-variant px-1">...</span>
              ) : isLast ? (
                // Last item - no link, current page
                <span
                  className="text-on-surface font-medium truncate max-w-[200px]"
                  aria-current="page"
                >
                  {item.icon && (
                    <Icon
                      symbol={item.icon}
                      size="xs"
                      className="inline-block mr-1 align-middle"
                    />
                  )}
                  {item.label}
                </span>
              ) : item.href ? (
                // Item with link
                <Link
                  href={item.href}
                  className={cn(
                    "text-on-surface-variant hover:text-on-surface transition-colors truncate max-w-[150px]",
                    "hover:underline underline-offset-2"
                  )}
                >
                  {isFirst && showHomeIcon ? (
                    <Icon
                      symbol="home"
                      size="xs"
                      className="align-middle"
                      aria-label={item.label}
                    />
                  ) : (
                    <>
                      {item.icon && (
                        <Icon
                          symbol={item.icon}
                          size="xs"
                          className="inline-block mr-1 align-middle"
                        />
                      )}
                      {item.label}
                    </>
                  )}
                </Link>
              ) : (
                // Item without link
                <span className="text-on-surface-variant truncate max-w-[150px]">
                  {item.icon && (
                    <Icon
                      symbol={item.icon}
                      size="xs"
                      className="inline-block mr-1 align-middle"
                    />
                  )}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ============================================================================
// Breadcrumb Item Component (for custom rendering)
// ============================================================================

export type BreadcrumbItemProps = {
  item: Breadcrumb;
  isLast?: boolean;
  isFirst?: boolean;
  showHomeIcon?: boolean;
  separator?: string;
  showSeparator?: boolean;
};

export function BreadcrumbItem({
  item,
  isLast = false,
  isFirst = false,
  showHomeIcon = false,
  separator = "chevron_right",
  showSeparator = true,
}: BreadcrumbItemProps) {
  return (
    <li className="flex items-center gap-1">
      {showSeparator && (
        <Icon
          symbol={separator}
          size="xs"
          className="text-on-surface-variant/50 shrink-0"
          aria-hidden="true"
        />
      )}

      {isLast ? (
        <span
          className="text-on-surface font-medium truncate max-w-[200px]"
          aria-current="page"
        >
          {item.icon && (
            <Icon
              symbol={item.icon}
              size="xs"
              className="inline-block mr-1 align-middle"
            />
          )}
          {item.label}
        </span>
      ) : item.href ? (
        <Link
          href={item.href}
          className="text-on-surface-variant hover:text-on-surface transition-colors truncate max-w-[150px] hover:underline underline-offset-2"
        >
          {isFirst && showHomeIcon ? (
            <Icon
              symbol="home"
              size="xs"
              className="align-middle"
              aria-label={item.label}
            />
          ) : (
            <>
              {item.icon && (
                <Icon
                  symbol={item.icon}
                  size="xs"
                  className="inline-block mr-1 align-middle"
                />
              )}
              {item.label}
            </>
          )}
        </Link>
      ) : (
        <span className="text-on-surface-variant truncate max-w-[150px]">
          {item.icon && (
            <Icon
              symbol={item.icon}
              size="xs"
              className="inline-block mr-1 align-middle"
            />
          )}
          {item.label}
        </span>
      )}
    </li>
  );
}
