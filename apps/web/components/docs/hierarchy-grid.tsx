"use client";

import type { HierarchySectionDef } from "@/lib/docs/types";
import { cn } from "@unisane/ui/lib/utils";

interface HierarchyGridProps {
  hierarchy: HierarchySectionDef;
  className?: string;
}

export function HierarchyGrid({ hierarchy, className }: HierarchyGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-6",
        className
      )}
    >
      {hierarchy.items.map((item, index) => (
        <div key={index} className="flex flex-col gap-4">
          {/* Visual container */}
          <div className="bg-surface-container-low p-8 rounded-xl flex items-center justify-center min-h-60 border border-outline-variant/15">
            {item.component}
          </div>

          {/* Label */}
          <div className="px-2">
            <h4 className="text-title-small font-semibold text-on-surface">
              {item.title}
            </h4>
            {item.subtitle && (
              <p className="text-body-small text-on-surface-variant mt-1">
                {item.subtitle}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
