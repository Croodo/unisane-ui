import { useMemo } from "react";

type RowStylesOptions = {
  isSelected: boolean;
  isActive: boolean;
  isZebra: boolean;
  isOddRow: boolean;
  isClickable: boolean;
  customClassName?: string | undefined;
};

/**
 * Computes row className based on selection, active, zebra states
 */
export function getRowClassName({
  isSelected,
  isActive,
  isZebra,
  isOddRow,
  isClickable,
  customClassName = "",
}: RowStylesOptions): string {
  const base = "group transition-colors";

  const bgClass = isActive
    ? "bg-primary/5 ring-1 ring-inset ring-primary/20"
    : isSelected
      ? "bg-primary/10 hover:bg-primary/10"
      : isZebra && isOddRow
        ? "bg-muted/30 hover:bg-accent"
        : "hover:bg-accent";

  const cursorClass = isClickable ? "cursor-pointer" : "";

  return [base, bgClass, cursorClass, customClassName]
    .filter(Boolean)
    .join(" ");
}

/**
 * Computes cell background class for sticky columns
 */
export function getCellBgClass(
  isSelected: boolean,
  isZebra: boolean,
  isOddRow: boolean
): string {
  if (isSelected) return "bg-primary/10";
  if (isZebra && isOddRow) return "bg-muted/30";
  return "bg-background";
}

/**
 * Hook version for memoized row styles
 */
export function useRowStyles(
  rowId: string,
  selectedRows: Set<string>,
  activeRowId: string | undefined,
  rowIndex: number,
  zebra: boolean,
  hasClickHandler: boolean,
  customClassName?: string
) {
  return useMemo(() => {
    const isSelected = selectedRows.has(rowId);
    const isActive = activeRowId === rowId;
    const isOddRow = rowIndex % 2 === 1;

    return {
      className: getRowClassName({
        isSelected,
        isActive,
        isZebra: zebra,
        isOddRow,
        isClickable: hasClickHandler,
        customClassName,
      }),
      cellBgClass: getCellBgClass(isSelected, zebra, isOddRow),
      isSelected,
      isActive,
    };
  }, [
    rowId,
    selectedRows,
    activeRowId,
    rowIndex,
    zebra,
    hasClickHandler,
    customClassName,
  ]);
}
