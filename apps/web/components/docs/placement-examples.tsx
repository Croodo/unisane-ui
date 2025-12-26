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
        "grid grid-cols-1 @xl:grid-cols-2 gap-8u",
        className
      )}
    >
      {placement.examples.map((example, index) => (
        <div
          key={index}
          className="bg-surface-container-low rounded-extra-large p-8u border border-outline-variant/15"
        >
          {/* Title */}
          <h3 className="text-title-medium font-medium text-on-surface mb-6u">
            {example.title}
          </h3>

          {/* Visual */}
          <div className="flex items-center justify-center">
            {example.visual}
          </div>

          {/* Caption */}
          {example.caption && (
            <p className="mt-8u text-center text-body-medium text-on-surface-variant font-medium">
              {example.caption}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
