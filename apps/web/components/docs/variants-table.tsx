"use client";

import type { VariantDef } from "@/lib/docs/types";
import { cn } from "@unisane/ui/lib/utils";

interface VariantsTableProps {
  variants: VariantDef[];
  className?: string;
}

export function VariantsTable({ variants, className }: VariantsTableProps) {
  if (!variants.length) return null;

  return (
    <div className={cn("space-y-8", className)}>
      {variants.map((variant) => (
        <div key={variant.name} className="space-y-4">
          <div className="flex items-center gap-3">
            <code className="text-primary font-mono text-title-small font-semibold">
              {variant.name}
            </code>
            <code className="text-on-surface-variant font-mono text-body-small bg-surface-variant/40 px-2 py-0_5 rounded-xs">
              {variant.type}
            </code>
            <span className="text-body-small text-on-surface-variant">
              Default: <code className="font-mono">{variant.default}</code>
            </span>
          </div>

          <div className="grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 gap-4">
            {variant.options.map((option) => (
              <div
                key={option.value}
                className="p-4 rounded-md bg-surface-container-low border border-outline-variant/15"
              >
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-primary font-mono text-label-large font-medium">
                    {option.value}
                  </code>
                  <span className="text-label-medium text-on-surface">
                    {option.label}
                  </span>
                </div>
                {option.description && (
                  <p className="text-body-small text-on-surface-variant">
                    {option.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
