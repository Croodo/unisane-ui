import type { ExcelExportOptions, ExportResult } from "./types";
import { prepareExportData, getCellValue, generateFilename } from "./utils";

// ─── LAZY EXCEL EXPORT ─────────────────────────────────────────────────────
// This module uses dynamic imports to load xlsx only when needed,
// reducing initial bundle size.

// Type for the dynamically imported xlsx module
type XLSXModule = typeof import("xlsx");

// Cached module reference
let xlsxModule: XLSXModule | null = null;

/**
 * Lazily loads the xlsx library.
 * Caches the module after first load for subsequent calls.
 */
async function loadXLSX(): Promise<XLSXModule> {
  if (xlsxModule) {
    return xlsxModule;
  }
  xlsxModule = await import("xlsx");
  return xlsxModule;
}

/**
 * Exports table data to Excel (.xlsx) format with lazy-loaded dependencies.
 *
 * This is the recommended way to export Excel files as it only loads the
 * xlsx library when actually needed, reducing initial bundle size by ~500KB.
 *
 * @example
 * ```tsx
 * const result = await exportToExcelAsync({
 *   data: users,
 *   columns,
 *   filename: "users-export",
 *   autoWidth: true,
 * });
 *
 * if (!result.success) {
 *   console.error("Export failed:", result.error);
 * }
 * ```
 */
export async function exportToExcelAsync<T extends { id: string }>(
  options: ExcelExportOptions<T>
): Promise<ExportResult> {
  const {
    filename,
    sheetName = "Sheet1",
    autoWidth = true,
    freezeHeader = true,
    styleHeader = true,
    zebraStripes = false,
    includeHeaders = true,
    formatValue,
  } = options;

  try {
    // Validate required options
    if (!options.data) {
      return { success: false, error: "No data provided for export" };
    }
    if (!options.columns) {
      return { success: false, error: "No columns provided for export" };
    }

    // Lazy load xlsx
    const XLSX = await loadXLSX();

    const { rows, columns } = prepareExportData(options);

    if (rows.length === 0) {
      return { success: false, error: "No data to export" };
    }

    if (columns.length === 0) {
      return { success: false, error: "No columns to export" };
    }

    // Build data array
    const data: string[][] = [];

    // Add headers
    if (includeHeaders) {
      data.push(columns.map((col) => col.header));
    }

    // Add data rows
    for (const row of rows) {
      const values = columns.map((col) => getCellValue(row, col, formatValue));
      data.push(values);
    }

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Auto-size columns
    if (autoWidth) {
      const colWidths = columns.map((col) => {
        const maxLength = Math.max(
          col.header.length,
          ...rows.map((row) => getCellValue(row, col, formatValue).length)
        );
        return { wch: Math.min(maxLength + 2, 50) };
      });
      worksheet["!cols"] = colWidths;
    }

    // Freeze header row
    if (freezeHeader && includeHeaders) {
      worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };
    }

    // Apply header styling (using cell refs)
    if (styleHeader && includeHeaders) {
      for (let c = 0; c < columns.length; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c });
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "E0E0E0" } },
            alignment: { horizontal: "center" },
          };
        }
      }
    }

    // Apply zebra stripes
    if (zebraStripes) {
      const startRow = includeHeaders ? 1 : 0;
      for (let r = startRow; r < data.length; r++) {
        if ((r - startRow) % 2 === 1) {
          for (let c = 0; c < columns.length; c++) {
            const cellRef = XLSX.utils.encode_cell({ r, c });
            if (worksheet[cellRef]) {
              worksheet[cellRef].s = {
                ...worksheet[cellRef].s,
                fill: { fgColor: { rgb: "F5F5F5" } },
              };
            }
          }
        }
      }
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Download
    const outputFilename = generateFilename(filename, "xlsx");
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = outputFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
      rowCount: rows.length,
      fileSize: buffer.byteLength,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export Excel";
    console.error("Excel export failed:", error);
    return { success: false, error: message };
  }
}

/**
 * Returns Excel workbook as a Blob (without downloading).
 * Uses lazy-loaded xlsx library.
 */
export async function toExcelBlobAsync<T extends { id: string }>(
  options: ExcelExportOptions<T>
): Promise<Blob> {
  const { sheetName = "Sheet1", includeHeaders = true, formatValue } = options;

  // Lazy load xlsx
  const XLSX = await loadXLSX();

  const { rows, columns } = prepareExportData(options);

  const data: string[][] = [];

  if (includeHeaders) {
    data.push(columns.map((col) => col.header));
  }

  for (const row of rows) {
    const values = columns.map((col) => getCellValue(row, col, formatValue));
    data.push(values);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Check if xlsx library is already loaded.
 * Useful for showing loading indicators.
 */
export function isXLSXLoaded(): boolean {
  return xlsxModule !== null;
}

/**
 * Preload the xlsx library.
 * Call this ahead of time if you know the user will export to Excel.
 */
export async function preloadXLSX(): Promise<void> {
  await loadXLSX();
}
