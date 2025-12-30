import type { Column } from "../types";
import { getNestedValue } from "./get-nested-value";

/**
 * Escapes a value for CSV format
 */
function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const str = String(value);

  // If contains comma, quotes, or newlines, wrap in quotes and escape existing quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export interface ExportResult {
  success: boolean;
  error?: string;
}

/**
 * Converts table data to CSV format and triggers a download
 * @returns Result object indicating success or failure with error message
 */
export function exportToCSV<T extends { id: string }>(
  data: T[],
  columns: Column<T>[],
  filename: string = "export.csv"
): ExportResult {
  let url: string | null = null;
  let link: HTMLAnchorElement | null = null;

  try {
    // Validate inputs
    if (!data || !Array.isArray(data)) {
      return { success: false, error: "Invalid data: expected an array" };
    }
    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      return { success: false, error: "Invalid columns: expected a non-empty array" };
    }

    // Build header row
    const headers = columns.map((col) => escapeCSV(col.header));

    // Build data rows
    const rows = data.map((row) =>
      columns.map((col) => {
        const value = getNestedValue(row as unknown as Record<string, unknown>, String(col.key));
        return escapeCSV(value);
      })
    );

    // Combine headers and rows
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n"
    );

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    url = URL.createObjectURL(blob);

    link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export CSV";
    console.error("CSV export failed:", error);
    return { success: false, error: message };
  } finally {
    // Clean up
    if (link && document.body.contains(link)) {
      document.body.removeChild(link);
    }
    if (url) {
      URL.revokeObjectURL(url);
    }
  }
}

/**
 * Alternative: Returns CSV string instead of downloading
 */
export function toCSVString<T extends { id: string }>(
  data: T[],
  columns: Column<T>[]
): string {
  const headers = columns.map((col) => escapeCSV(col.header));

  const rows = data.map((row) =>
    columns.map((col) => {
      const value = getNestedValue(row as unknown as Record<string, unknown>, String(col.key));
      return escapeCSV(value);
    })
  );

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}
