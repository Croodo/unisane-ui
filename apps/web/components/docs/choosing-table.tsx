"use client";

import type { ChoosingTableDef } from "@/lib/docs/types";
import { cn } from "@unisane/ui/lib/utils";

interface ChoosingTableProps {
  choosing: ChoosingTableDef;
  className?: string;
}

interface ChoosingRow {
  emphasis: string;
  component: React.ReactNode;
  rationale: string;
  examples?: string;
}

interface ColumnLabels {
  emphasis: string;
  component: string;
  rationale: string;
  examples: string;
}

/**
 * Responsive choosing table that displays as:
 * - Cards on mobile (< @2xl / 672px)
 * - Traditional table on larger screens
 */
export function ChoosingTable({ choosing, className }: ChoosingTableProps) {
  const columns: ColumnLabels = {
    emphasis: choosing.columns?.emphasis || "Level of emphasis",
    component: choosing.columns?.component || "Component",
    rationale: choosing.columns?.rationale || "Rationale",
    examples: choosing.columns?.examples || "Example actions",
  };

  const hasExamples = choosing.rows.some((row) => row.examples);

  return (
    <div className={cn("w-full", className)}>
      {/* ─── Mobile: Card Layout ─────────────────────────────────────────────── */}
      <div className="@2xl:hidden flex flex-col gap-3">
        {choosing.rows.map((row, index) => (
          <ChoosingCard
            key={index}
            row={row}
            columns={columns}
            hasExamples={hasExamples}
          />
        ))}
      </div>

      {/* ─── Desktop: Table Layout ───────────────────────────────────────────── */}
      <div className="hidden @2xl:block overflow-x-auto rounded-lg border border-outline-variant/30">
        <table className="w-full text-body-medium">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant/30">
              <th className="px-4 py-3 text-left text-label-medium font-semibold text-on-surface">
                {columns.emphasis}
              </th>
              <th className="px-4 py-3 text-left text-label-medium font-semibold text-on-surface">
                {columns.component}
              </th>
              <th className="px-4 py-3 text-left text-label-medium font-semibold text-on-surface">
                {columns.rationale}
              </th>
              {hasExamples && (
                <th className="px-4 py-3 text-left text-label-medium font-semibold text-on-surface">
                  {columns.examples}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {choosing.rows.map((row, index) => (
              <tr
                key={index}
                className="border-b border-outline-variant/15 last:border-none hover:bg-surface-container-low/50 transition-colors"
              >
                <td className="px-4 py-4 text-body-medium font-medium text-on-surface">
                  {row.emphasis}
                </td>
                <td className="px-4 py-4">{row.component}</td>
                <td className="px-4 py-4 text-body-small text-on-surface-variant leading-relaxed">
                  {row.rationale}
                </td>
                {hasExamples && (
                  <td className="px-4 py-4 text-body-small text-on-surface-variant font-medium">
                    {row.examples}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Individual choosing card for mobile view
 */
function ChoosingCard({
  row,
  columns,
  hasExamples,
}: {
  row: ChoosingRow;
  columns: ColumnLabels;
  hasExamples: boolean;
}) {
  return (
    <div className="p-4 rounded-lg border border-outline-variant/30 bg-surface-container-lowest">
      {/* Header: Emphasis level */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-primary font-semibold text-body-medium">
          {row.emphasis}
        </span>
      </div>

      {/* Component */}
      <div className="mb-3">
        <span className="text-label-small text-on-surface-variant block mb-1">
          {columns.component}
        </span>
        <div className="text-body-medium text-on-surface">{row.component}</div>
      </div>

      {/* Rationale */}
      <div className={hasExamples && row.examples ? "mb-3" : ""}>
        <span className="text-label-small text-on-surface-variant block mb-1">
          {columns.rationale}
        </span>
        <p className="text-body-small text-on-surface-variant leading-relaxed">
          {row.rationale}
        </p>
      </div>

      {/* Examples (if present) */}
      {hasExamples && row.examples && (
        <div>
          <span className="text-label-small text-on-surface-variant block mb-1">
            {columns.examples}
          </span>
          <p className="text-body-small text-on-surface-variant font-medium">
            {row.examples}
          </p>
        </div>
      )}
    </div>
  );
}
