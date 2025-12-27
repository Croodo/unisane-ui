"use client";

import type { PlacementSectionDef } from "@/lib/docs/types";
import { cn } from "@unisane/ui/lib/utils";

interface PlacementExamplesProps {
  placement: PlacementSectionDef;
  className?: string;
}

export function PlacementExamples({ placement, className }: PlacementExamplesProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 @xl:grid-cols-2 gap-6u",
        className
      )}
    >
      {placement.examples.map((example, index) => (
        <div
          key={index}
          className="bg-surface-container-low rounded-xl overflow-visible border border-outline-variant/15 flex flex-col"
        >
          {/* Title */}
          <h3 className="text-title-small font-medium text-on-surface px-5u pt-5u pb-4u border-b border-outline-variant/10">
            {example.title}
          </h3>

          {/* Visual - with overflow room for dropdowns/popovers */}
          <div className="flex items-center justify-center p-5u min-h-[180px] overflow-visible">
            {example.visual}
          </div>

          {/* Caption */}
          {example.caption && (
            <p className="px-5u pb-5u text-center text-body-small text-on-surface-variant">
              {example.caption}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
