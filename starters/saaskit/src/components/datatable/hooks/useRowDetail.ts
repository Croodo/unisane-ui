import { useState, useCallback, useMemo } from "react";

/**
 * Generic hook for managing row detail sheet state in DataTable.
 *
 * @example
 * ```tsx
 * const { selectedRow, isOpen, open, close, toggle, navigateRow, setData } = useRowDetail<User>();
 *
 * <DataTable
 *   data={users}
 *   onRowClick={(row) => open(row)}
 *   activeRowId={selectedRow?.id}
 * />
 *
 * <RowDetailSheet
 *   open={isOpen}
 *   onOpenChange={(open) => !open && close()}
 *   row={selectedRow}
 *   onNavigate={navigateRow}
 * >
 *   {(user) => <UserDetailContent user={user} />}
 * </RowDetailSheet>
 * ```
 */
export function useRowDetail<T extends { id: string }>(
  initialData?: T[],
  options?: {
    onOpen?: (row: T) => void;
    onClose?: () => void;
    onNavigate?: (row: T, direction: "prev" | "next") => void;
  }
) {
  const [selectedRow, setSelectedRow] = useState<T | null>(null);
  const [data, setData] = useState<T[]>(initialData ?? []);

  const isOpen = selectedRow !== null;

  const open = useCallback(
    (row: T) => {
      setSelectedRow(row);
      options?.onOpen?.(row);
    },
    [options]
  );

  const close = useCallback(() => {
    setSelectedRow(null);
    options?.onClose?.();
  }, [options]);

  const toggle = useCallback(
    (row: T) => {
      if (selectedRow?.id === row.id) {
        close();
      } else {
        open(row);
      }
    },
    [selectedRow, open, close]
  );

  const currentIndex = useMemo(() => {
    if (!selectedRow) return -1;
    return data.findIndex((item) => item.id === selectedRow.id);
  }, [data, selectedRow]);

  const canNavigatePrev = currentIndex > 0;
  const canNavigateNext = currentIndex >= 0 && currentIndex < data.length - 1;

  const navigateRow = useCallback(
    (direction: "prev" | "next") => {
      if (!selectedRow || data.length === 0) return;

      const newIndex =
        direction === "prev" ? currentIndex - 1 : currentIndex + 1;

      if (newIndex >= 0 && newIndex < data.length) {
        const newRow = data[newIndex]!;
        setSelectedRow(newRow);
        options?.onNavigate?.(newRow, direction);
      }
    },
    [data, currentIndex, selectedRow, options]
  );

  const navigatePrev = useCallback(() => navigateRow("prev"), [navigateRow]);

  const navigateNext = useCallback(() => navigateRow("next"), [navigateRow]);

  // Update data when external data changes
  const updateData = useCallback(
    (newData: T[]) => {
      setData(newData);
      // If selected row is no longer in data, close the sheet
      if (selectedRow && !newData.find((item) => item.id === selectedRow.id)) {
        setSelectedRow(null);
      }
    },
    [selectedRow]
  );

  // Find and open a row by ID
  const openById = useCallback(
    (id: string) => {
      const row = data.find((item) => item.id === id);
      if (row) {
        open(row);
      }
    },
    [data, open]
  );

  return {
    // State
    selectedRow,
    isOpen,
    currentIndex,
    totalCount: data.length,

    // Actions
    open,
    close,
    toggle,
    openById,
    setSelectedRow,

    // Navigation
    navigateRow,
    navigatePrev,
    navigateNext,
    canNavigatePrev,
    canNavigateNext,

    // Data management
    data,
    setData: updateData,

    // Helper for DataTable props
    dataTableProps: {
      onRowClick: open,
      activeRowId: selectedRow?.id,
    },
  };
}

export type UseRowDetailReturn<T extends { id: string }> = ReturnType<
  typeof useRowDetail<T>
>;
