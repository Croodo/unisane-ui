"use client";

import { ReactNode, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Badge } from "@/src/components/ui/badge";

export interface RowDetailSectionProps {
  title: string;
  icon?: ReactNode;
  badge?: ReactNode;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  children: ReactNode;
  className?: string;
}

export function RowDetailSection({
  title,
  icon,
  badge,
  badgeVariant = "secondary",
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
          <span className="text-on-surface-variant">
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
        )}
        {icon && <span className="text-on-surface-variant">{icon}</span>}
        <span className="text-label-medium text-on-surface flex-1">{title}</span>
        {badge &&
          (typeof badge === "string" ? (
            <Badge variant={badgeVariant} className="text-label-small">
              {badge}
            </Badge>
          ) : (
            badge
          ))}
      </button>
      {!isCollapsed && <div className="p-3 space-y-2">{children}</div>}
    </div>
  );
}
