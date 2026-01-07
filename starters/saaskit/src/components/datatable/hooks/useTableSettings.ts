import { useEffect, useMemo, useState } from "react";
import { DEFAULT_PAGE_SIZE } from "../constants";
import type { DensityState } from "../constants";

export interface TableSettings {
  hiddenColumns: Set<string>;
  density: DensityState;
  columnWidths: Record<string, number>;
  pageSize: number;
}

const loadSettings = (
  tableId?: string,
  defaultPageSize?: number,
  defaultDensity: DensityState = "standard"
): TableSettings => {
  if (!tableId || typeof window === "undefined") {
    return {
      hiddenColumns: new Set<string>(),
      density: defaultDensity,
      columnWidths: {},
      pageSize: defaultPageSize ?? DEFAULT_PAGE_SIZE,
    };
  }

  try {
    const raw = window.localStorage.getItem(`datatable_settings_${tableId}`);
    if (!raw) {
      return {
        hiddenColumns: new Set<string>(),
        density: defaultDensity,
        columnWidths: {},
        pageSize: defaultPageSize ?? DEFAULT_PAGE_SIZE,
      };
    }
    const parsed = JSON.parse(raw) as Partial<TableSettings> & {
      hiddenColumns?: string[];
    };
    return {
      hiddenColumns: new Set(parsed.hiddenColumns ?? []),
      density: parsed.density ?? defaultDensity,
      columnWidths: parsed.columnWidths ?? {},
      pageSize: parsed.pageSize ?? defaultPageSize ?? DEFAULT_PAGE_SIZE,
    };
  } catch {
    return {
      hiddenColumns: new Set<string>(),
      density: defaultDensity,
      columnWidths: {},
      pageSize: defaultPageSize ?? DEFAULT_PAGE_SIZE,
    };
  }
};

export const useTableSettings = (
  tableId: string | undefined,
  defaultPageSize?: number,
  defaultDensity: DensityState = "standard"
) => {
  const initial = useMemo(
    () => loadSettings(tableId, defaultPageSize, defaultDensity),
    [tableId, defaultPageSize, defaultDensity]
  );

  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(initial.hiddenColumns);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(initial.columnWidths);
  const [density, setDensity] = useState<DensityState>(initial.density);
  const [pageSize, setPageSize] = useState<number>(initial.pageSize);

  useEffect(() => {
    if (!tableId || typeof window === "undefined") return;
    const settings = {
      hiddenColumns: Array.from(hiddenColumns),
      density,
      columnWidths,
      pageSize,
    };
    window.localStorage.setItem(`datatable_settings_${tableId}`, JSON.stringify(settings));
  }, [tableId, hiddenColumns, density, columnWidths, pageSize]);

  return {
    hiddenColumns,
    setHiddenColumns,
    columnWidths,
    setColumnWidths,
    density,
    setDensity,
    pageSize,
    setPageSize,
  };
};
