import type { Column } from "../../types";
import type { ExportOptions } from "./types";
import { getNestedValue } from "../get-nested-value";

// ─── FILTER DATA BY OPTIONS ─────────────────────────────────────────────────

/**
 * Filters and prepares data based on export options
 */
export function prepareExportData<T extends { id: string }>(
  options: ExportOptions<T>
): { rows: T[]; columns: Column<T>[] } {
  const {
    data,
    columns,
    visibleColumnsOnly = false,
    hiddenColumns = new Set(),
    selectedOnly = false,
    selectedIds = new Set(),
  } = options;

  // Validate inputs
  if (!data || !Array.isArray(data)) {
    return { rows: [], columns: columns ?? [] };
  }
  if (!columns || !Array.isArray(columns)) {
    return { rows: data, columns: [] };
  }

  // Filter rows if selectedOnly
  let rows = data;
  if (selectedOnly && selectedIds.size > 0) {
    rows = data.filter((row) => selectedIds.has(row.id));
  }

  // Filter columns if visibleColumnsOnly
  let exportColumns = columns;
  if (visibleColumnsOnly && hiddenColumns.size > 0) {
    exportColumns = columns.filter((col) => !hiddenColumns.has(String(col.key)));
  }

  return { rows, columns: exportColumns };
}

// ─── GET CELL VALUE ─────────────────────────────────────────────────────────

/**
 * Gets the formatted value for a cell
 * Includes error handling to prevent single cell errors from breaking entire export
 */
export function getCellValue<T extends { id: string }>(
  row: T,
  column: Column<T>,
  formatValue?: ExportOptions<T>["formatValue"]
): string {
  try {
    const value = getNestedValue(row, String(column.key));

    // Use custom formatter if provided
    if (formatValue) {
      try {
        return formatValue(value, column, row);
      } catch (formatError) {
        console.warn(
          `Export: Custom formatter failed for column "${String(column.key)}", row "${row.id}":`,
          formatError
        );
        // Fall through to default formatting
      }
    }

    // Handle null/undefined
    if (value === null || value === undefined) {
      return "";
    }

    // Handle Date objects
    if (value instanceof Date) {
      return value.toISOString().split("T")[0] ?? "";
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.join(", ");
    }

    // Handle objects
    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    // Handle booleans
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    return String(value);
  } catch (error) {
    console.warn(
      `Export: Failed to get value for column "${String(column.key)}", row "${row.id}":`,
      error
    );
    return ""; // Return empty string on error to not break the export
  }
}

// ─── DOWNLOAD FILE ──────────────────────────────────────────────────────────

/**
 * Triggers a file download in the browser
 * Uses a delayed cleanup to ensure the download has time to start
 */
export function downloadFile(
  content: Blob | string,
  filename: string,
  mimeType: string
): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();

  // Cleanup after a short delay to ensure download has started
  // This fixes an issue where the URL could be revoked before the download begins
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 150);
}

// ─── ESCAPE FUNCTIONS ───────────────────────────────────────────────────────

/**
 * Escapes a value for CSV format
 */
export function escapeCSV(value: string, delimiter: string = ","): string {
  if (value.includes(delimiter) || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ─── GENERATE FILENAME ──────────────────────────────────────────────────────

/**
 * Generates a filename with timestamp if not provided
 */
export function generateFilename(
  basename: string | undefined,
  extension: string
): string {
  const name = basename ?? `export-${new Date().toISOString().slice(0, 10)}`;
  return `${name}.${extension}`;
}
