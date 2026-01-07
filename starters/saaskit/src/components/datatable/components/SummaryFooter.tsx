import React from "react";
import type { CSSProperties } from "react";
import type { Column, PinPosition } from "../types";
import { COLUMN_WIDTHS } from "../constants";

type ColumnMeta = Record<
  string,
  { width: number; left?: number; right?: number }
>;

interface SummaryFooterProps<T> {
  visibleColumns: Column<T>[];
  columnMeta: ColumnMeta;
  summaryRow: React.ReactNode[] | null;
  renderSubComponent?: ((row: T) => React.ReactNode) | undefined;
  density: { px: string; py: string };
  getEffectivePinState: (col: Column<T>) => PinPosition;
  selectable: boolean;
}

export function SummaryFooter<T>({
  visibleColumns,
  columnMeta,
  summaryRow,
  renderSubComponent,
  density,
  getEffectivePinState,
  selectable,
}: SummaryFooterProps<T>) {
  if (!summaryRow) return null;

  return (
    <tfoot className="sticky bottom-0 z-30 bg-accent border-t border-border">
      <tr>
        {selectable && (
          <td
            className="md:sticky left-0 z-30 bg-accent border-t border-r border-border"
            style={{
              minWidth: COLUMN_WIDTHS.checkbox,
              maxWidth: COLUMN_WIDTHS.checkbox,
            }}
          />
        )}
        {renderSubComponent && (
          <td
            className="md:sticky z-30 bg-accent border-t border-r border-border"
            style={{
              left: selectable ? COLUMN_WIDTHS.checkbox : 0,
              minWidth: COLUMN_WIDTHS.expander,
              maxWidth: COLUMN_WIDTHS.expander,
            }}
          />
        )}
        {visibleColumns.map((col, index) => {
          const colKey = String(col.key);
          const meta = columnMeta[colKey] ?? { width: 150 };
          const effectivePin = getEffectivePinState(col);
          const isPinnedLeft = effectivePin === "left";
          const isPinnedRight = effectivePin === "right";

          let stickyClass = "";
          const stickyStyle: CSSProperties = {
            width: meta.width,
            minWidth: meta.width,
            maxWidth: meta.width,
          };

          if (isPinnedLeft) {
            stickyClass =
              "md:sticky z-30 border-r border-border bg-accent md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] clip-right";
            stickyStyle.left = meta.left;
          } else if (isPinnedRight) {
            stickyClass =
              "md:sticky z-30 border-l border-border bg-accent md:shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] clip-left";
            stickyStyle.right = meta.right;
          }

          return (
            <td
              key={`summary-${colKey}`}
              className={`${density.px} py-2 text-xs bg-accent text-muted-foreground whitespace-nowrap border-t  border-r border-border last:border-r-0 ${stickyClass} ${
                col.align === "right"
                  ? "text-right"
                  : col.align === "center"
                    ? "text-center"
                    : "text-left"
              }`}
              style={stickyStyle}
            >
              {summaryRow[index]}
            </td>
          );
        })}
      </tr>
    </tfoot>
  );
}
