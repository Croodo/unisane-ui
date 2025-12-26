"use client";

import type { ChoosingTableDef } from "@/lib/docs/types";
import { cn } from "@unisane/ui/lib/utils";

interface ChoosingTableProps {
  choosing: ChoosingTableDef;
  className?: string;
}

export function ChoosingTable({ choosing, className }: ChoosingTableProps) {
  const columns = choosing.columns || {
    emphasis: "Level of emphasis",
    component: "Component",
    rationale: "Rationale",
    examples: "Example actions",
  };

  // Check if any row has examples
  const hasExamples = choosing.rows.some((row) => row.examples);

  return (
    <div className={cn("overflow-x-auto rounded-lg border border-outline-variant/30", className)}>
      <table className="w-full text-body-medium">
        <thead>
          <tr className="bg-surface-container-low border-b border-outline-variant/30">
            <th className="px-6u py-4u text-left text-label-large font-semibold text-on-surface w-1/6">
              {columns.emphasis}
            </th>
            <th className="px-6u py-4u text-left text-label-large font-semibold text-on-surface w-1/4">
              {columns.component}
            </th>
            <th className="px-6u py-4u text-left text-label-large font-semibold text-on-surface w-1/3">
              {columns.rationale}
            </th>
            {hasExamples && (
              <th className="px-6u py-4u text-left text-label-large font-semibold text-on-surface w-1/4">
                {columns.examples}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {choosing.rows.map((row, index) => (
            <tr
              key={index}
              className="border-b border-outline-variant/15 last:border-none"
            >
              <td className="px-6u py-5u text-body-medium font-medium text-on-surface">
                {row.emphasis}
              </td>
              <td className="px-6u py-5u">{row.component}</td>
              <td className="px-6u py-5u text-body-medium text-on-surface-variant leading-relaxed">
                {row.rationale}
              </td>
              {hasExamples && (
                <td className="px-6u py-5u text-body-medium text-on-surface-variant font-medium">
                  {row.examples}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
