"use client";

import type { PropDef } from "@/lib/docs/types";
import { cn } from "@unisane/ui/lib/utils";

interface PropsTableProps {
  props: PropDef[];
  className?: string;
}

export function PropsTable({ props, className }: PropsTableProps) {
  if (!props.length) return null;

  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-lg border border-outline-variant/30",
        className
      )}
    >
      <table className="w-full min-w-[600px] text-body-small">
        <thead>
          <tr className="bg-surface-container-low border-b border-outline-variant/30">
            <th className="px-6u py-4u text-left text-label-medium font-semibold text-on-surface">
              Prop
            </th>
            <th className="px-6u py-4u text-left text-label-medium font-semibold text-on-surface">
              Type
            </th>
            <th className="px-6u py-4u text-left text-label-medium font-semibold text-on-surface">
              Default
            </th>
            <th className="px-6u py-4u text-left text-label-medium font-semibold text-on-surface">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr
              key={prop.name}
              className={cn(
                "border-b border-outline-variant/15 last:border-none",
                "hover:bg-surface-container-low/50 transition-colors"
              )}
            >
              <td className="px-6u py-4u align-top">
                <code className="text-primary font-mono text-body-small font-medium">
                  {prop.name}
                  {prop.required && (
                    <span className="text-error ml-1u">*</span>
                  )}
                </code>
              </td>
              <td className="px-6u py-4u align-top">
                <code className="text-tertiary font-mono text-label-small bg-surface-variant/40 px-2u py-1u rounded-sm">
                  {prop.type}
                </code>
              </td>
              <td className="px-6u py-4u align-top text-on-surface-variant">
                {prop.default ? (
                  <code className="font-mono text-label-small">{prop.default}</code>
                ) : (
                  <span className="text-on-surface-variant/50">—</span>
                )}
              </td>
              <td className="px-6u py-4u align-top text-on-surface-variant font-medium">
                {prop.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
