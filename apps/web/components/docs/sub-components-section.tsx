"use client";

import type { PropDef } from "@/lib/docs/types";
import { cn } from "@unisane/ui/lib/utils";

interface SubComponent {
  name: string;
  description: string;
  props?: PropDef[];
}

interface SubComponentsSectionProps {
  subComponents: SubComponent[];
  className?: string;
}

export function SubComponentsSection({
  subComponents,
  className,
}: SubComponentsSectionProps) {
  if (!subComponents.length) return null;

  return (
    <div className={cn("space-y-8u", className)}>
      {subComponents.map((sub) => (
        <div
          key={sub.name}
          className="rounded-large bg-surface-container-low border border-outline-variant/15 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6u py-5u bg-surface-container-low/50">
            <code className="text-title-medium font-semibold text-primary">
              {"<"}{sub.name.replace("Card.", "Card")} {"/>"}
            </code>
            <span className="text-body-medium text-on-surface-variant italic">
              {sub.description}
            </span>
          </div>

          {/* Props Table */}
          {sub.props?.length && (
            <div className="border-t border-outline-variant/15">
              <table className="w-full text-body-medium">
                <thead>
                  <tr className="border-b border-outline-variant/15 bg-surface">
                    <th className="px-6u py-4u text-left text-label-large font-semibold text-on-surface w-1/4">
                      Prop
                    </th>
                    <th className="px-6u py-4u text-left text-label-large font-semibold text-on-surface w-1/4">
                      Type
                    </th>
                    <th className="px-6u py-4u text-left text-label-large font-semibold text-on-surface w-1/6">
                      Default
                    </th>
                    <th className="px-6u py-4u text-left text-label-large font-semibold text-on-surface">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sub.props.map((prop, index) => (
                    <tr
                      key={prop.name}
                      className={cn(
                        "border-b border-outline-variant/10 last:border-none",
                        index % 2 === 0 ? "bg-surface" : "bg-surface-container-lowest"
                      )}
                    >
                      <td className="px-6u py-4u">
                        <code className="text-primary font-medium">
                          {prop.name}
                        </code>
                      </td>
                      <td className="px-6u py-4u">
                        <code className="text-body-small bg-surface-container px-2u py-1u rounded-small text-on-surface-variant border border-outline-variant/20">
                          {prop.type}
                        </code>
                      </td>
                      <td className="px-6u py-4u text-on-surface-variant font-mono text-body-small">
                        {prop.default || "–"}
                      </td>
                      <td className="px-6u py-4u text-on-surface-variant">
                        {prop.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
