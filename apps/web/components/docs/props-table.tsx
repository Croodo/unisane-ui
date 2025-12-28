"use client";

import type { PropDef } from "@/lib/docs/types";
import { cn } from "@unisane/ui/lib/utils";

interface PropsTableProps {
  props: PropDef[];
  className?: string;
}

/**
 * Responsive props table that displays as:
 * - Cards on mobile (< @2xl / 672px)
 * - Traditional table on larger screens
 */
export function PropsTable({ props, className }: PropsTableProps) {
  if (!props.length) return null;

  return (
    <div className={cn("w-full", className)}>
      {/* ─── Mobile: Card Layout ─────────────────────────────────────────────── */}
      <div className="@2xl:hidden flex flex-col gap-3">
        {props.map((prop) => (
          <PropCard key={prop.name} prop={prop} />
        ))}
      </div>

      {/* ─── Desktop: Table Layout ───────────────────────────────────────────── */}
      <div className="hidden @2xl:block overflow-x-auto rounded-lg border border-outline-variant/30">
        <table className="w-full text-body-small">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant/30">
              <th className="px-4 py-3 text-left text-label-medium font-semibold text-on-surface">
                Prop
              </th>
              <th className="px-4 py-3 text-left text-label-medium font-semibold text-on-surface">
                Type
              </th>
              <th className="px-4 py-3 text-left text-label-medium font-semibold text-on-surface">
                Default
              </th>
              <th className="px-4 py-3 text-left text-label-medium font-semibold text-on-surface">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {props.map((prop) => (
              <tr
                key={prop.name}
                className="border-b border-outline-variant/15 last:border-none hover:bg-surface-container-low/50 transition-colors"
              >
                <td className="px-4 py-3 align-top">
                  <code className="text-primary font-mono text-body-small font-medium">
                    {prop.name}
                    {prop.required && <span className="text-error ml-1">*</span>}
                  </code>
                </td>
                <td className="px-4 py-3 align-top">
                  <code className="text-tertiary font-mono text-label-small bg-surface-variant/40 px-2 py-1 rounded-sm break-all">
                    {prop.type}
                  </code>
                </td>
                <td className="px-4 py-3 align-top text-on-surface-variant">
                  {prop.default ? (
                    <code className="font-mono text-label-small">{prop.default}</code>
                  ) : (
                    <span className="text-on-surface-variant/50">—</span>
                  )}
                </td>
                <td className="px-4 py-3 align-top text-on-surface-variant font-medium">
                  {prop.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Individual prop card for mobile view
 */
function PropCard({ prop }: { prop: PropDef }) {
  return (
    <div className="p-4 rounded-lg border border-outline-variant/30 bg-surface-container-lowest">
      {/* Header: Prop name */}
      <div className="flex items-center gap-2 mb-3">
        <code className="text-primary font-mono text-body-medium font-semibold">
          {prop.name}
        </code>
        {prop.required && (
          <span className="text-label-small text-error font-medium">required</span>
        )}
      </div>

      {/* Type & Default row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <code className="text-tertiary font-mono text-label-small bg-surface-variant/40 px-2 py-1 rounded-sm">
          {prop.type}
        </code>
        {prop.default && (
          <span className="text-label-small text-on-surface-variant">
            = <code className="font-mono">{prop.default}</code>
          </span>
        )}
      </div>

      {/* Description */}
      {prop.description && (
        <p className="text-body-small text-on-surface-variant leading-relaxed">
          {prop.description}
        </p>
      )}
    </div>
  );
}
