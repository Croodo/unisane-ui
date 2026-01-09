"use client";

import { ReactNode, useState } from "react";
import { cn } from "@unisane/ui/lib/utils";
import { Badge } from "@unisane/ui/components/badge";
import { Text } from "@unisane/ui/primitives/text";
import { Icon } from "@unisane/ui/primitives/icon";

export interface RowDetailSectionProps {
  title: string;
  /** Material Symbol icon name */
  icon?: string;
  badge?: ReactNode;
  badgeVariant?: "filled" | "tonal" | "outlined";
  badgeClassName?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  children: ReactNode;
  className?: string;
}

export function RowDetailSection({
  title,
  icon,
  badge,
  badgeVariant = "tonal",
  badgeClassName,
  collapsible = false,
  defaultCollapsed = false,
  children,
  className,
}: RowDetailSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const isCollapsed = collapsible && collapsed;

  return (
    <div className={cn("border border-outline-variant rounded-lg overflow-hidden", className)}>
      <button
        type="button"
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 bg-surface-container-low text-left",
          collapsible && "hover:bg-surface-container cursor-pointer transition-colors"
        )}
        onClick={() => collapsible && setCollapsed((prev) => !prev)}
        disabled={!collapsible}
      >
        {collapsible && (
          <Icon
            symbol={isCollapsed ? "chevron_right" : "expand_more"}
            size="sm"
            className="text-on-surface-variant"
          />
        )}
        {icon && (
          <Icon symbol={icon} size="sm" className="text-on-surface-variant" />
        )}
        <Text variant="labelMedium" color="onSurface" className="flex-1">
          {title}
        </Text>
        {badge &&
          (typeof badge === "string" ? (
            <Badge variant={badgeVariant} className={badgeClassName}>
              <Text variant="labelSmall">{badge}</Text>
            </Badge>
          ) : (
            badge
          ))}
      </button>
      {!isCollapsed && <div className="p-3 space-y-2">{children}</div>}
    </div>
  );
}
