import type { JSONExportOptions, ExportResult } from "./types";
import { prepareExportData, getCellValue, downloadFile, generateFilename } from "./utils";

// ─── JSON EXPORT ────────────────────────────────────────────────────────────

interface ExportedRow {
  [key: string]: string;
}

interface ExportedData {
  metadata?: {
    exportDate: string;
    rowCount: number;
    columnCount: number;
    columns: string[];
  };
  data: ExportedRow[];
}

/**
 * Exports table data to JSON format
 */
export function exportToJSON<T extends { id: string }>(
  options: JSONExportOptions<T>
): ExportResult {
  const {
    filename,
    pretty = true,
    indent = 2,
    includeMetadata = false,
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

    // Build data array
    const data: ExportedRow[] = rows.map((row) => {
      const obj: ExportedRow = {};
      for (const col of columns) {
        const key = String(col.key);
        obj[key] = getCellValue(row, col, formatValue);
      }
      return obj;
    });

    // Build output
    let output: ExportedData | ExportedRow[];

    if (includeMetadata) {
      output = {
        metadata: {
          exportDate: new Date().toISOString(),
          rowCount: rows.length,
          columnCount: columns.length,
          columns: columns.map((col) => col.header),
        },
        data,
      };
    } else {
      output = data;
    }

    // Stringify
    const content = pretty
      ? JSON.stringify(output, null, indent)
      : JSON.stringify(output);

    // Download
    const outputFilename = generateFilename(filename, "json");
    downloadFile(content, outputFilename, "application/json");

    return {
      success: true,
      rowCount: rows.length,
      fileSize: new Blob([content]).size,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export JSON";
    console.error("JSON export failed:", error);
    return { success: false, error: message };
  }
}

/**
 * Returns JSON content as a string (without downloading)
 */
export function toJSONString<T extends { id: string }>(
  options: JSONExportOptions<T>
): string {
  const { pretty = true, indent = 2, includeMetadata = false, formatValue } = options;
  const { rows, columns } = prepareExportData(options);

  const data: ExportedRow[] = rows.map((row) => {
    const obj: ExportedRow = {};
    for (const col of columns) {
      const key = String(col.key);
      obj[key] = getCellValue(row, col, formatValue);
    }
    return obj;
  });

  let output: ExportedData | ExportedRow[];

  if (includeMetadata) {
    output = {
      metadata: {
        exportDate: new Date().toISOString(),
        rowCount: rows.length,
        columnCount: columns.length,
        columns: columns.map((col) => col.header),
      },
      data,
    };
  } else {
    output = data;
  }

  return pretty ? JSON.stringify(output, null, indent) : JSON.stringify(output);
}
