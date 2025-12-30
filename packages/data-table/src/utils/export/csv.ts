import type { CSVExportOptions, ExportResult } from "./types";
import { prepareExportData, getCellValue, escapeCSV, downloadFile, generateFilename } from "./utils";

// ─── CSV EXPORT ─────────────────────────────────────────────────────────────

/**
 * Exports table data to CSV format
 */
export function exportToCSV<T extends { id: string }>(
  options: CSVExportOptions<T>
): ExportResult {
  const {
    filename,
    delimiter = ",",
    includeBOM = true,
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

    const { rows, columns } = prepareExportData(options);

    if (rows.length === 0) {
      return { success: false, error: "No data to export" };
    }

    if (columns.length === 0) {
      return { success: false, error: "No columns to export" };
    }

    const lines: string[] = [];

    // Add headers
    if (includeHeaders) {
      const headers = columns.map((col) => escapeCSV(col.header, delimiter));
      lines.push(headers.join(delimiter));
    }

    // Add data rows
    for (const row of rows) {
      const values = columns.map((col) => {
        const value = getCellValue(row, col, formatValue);
        return escapeCSV(value, delimiter);
      });
      lines.push(values.join(delimiter));
    }

    // Build content with optional BOM
    const csvContent = lines.join("\n");
    const content = includeBOM ? "\ufeff" + csvContent : csvContent;

    // Download
    const outputFilename = generateFilename(filename, "csv");
    downloadFile(content, outputFilename, "text/csv;charset=utf-8");

    return {
      success: true,
      rowCount: rows.length,
      fileSize: new Blob([content]).size,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export CSV";
    console.error("CSV export failed:", error);
    return { success: false, error: message };
  }
}

/**
 * Returns CSV content as a string (without downloading)
 */
export function toCSVString<T extends { id: string }>(
  options: CSVExportOptions<T>
): string {
  const { delimiter = ",", includeHeaders = true, formatValue } = options;
  const { rows, columns } = prepareExportData(options);

  const lines: string[] = [];

  if (includeHeaders) {
    const headers = columns.map((col) => escapeCSV(col.header, delimiter));
    lines.push(headers.join(delimiter));
  }

  for (const row of rows) {
    const values = columns.map((col) => {
      const value = getCellValue(row, col, formatValue);
      return escapeCSV(value, delimiter);
    });
    lines.push(values.join(delimiter));
  }

  return lines.join("\n");
}
