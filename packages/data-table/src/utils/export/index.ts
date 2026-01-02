// ─── EXPORT MODULE ──────────────────────────────────────────────────────────
// Unified export functionality for DataTable
// Supports: CSV, Excel (.xlsx), PDF, JSON, and custom plugins

export * from "./types";
export { exportToCSV, toCSVString } from "./csv";
export { exportToExcel, toExcelBlob } from "./excel";
export { exportToPDF, toPDFBlob } from "./pdf";
export { exportToJSON, toJSONString } from "./json";

// ─── PLUGIN SYSTEM ─────────────────────────────────────────────────────────
export {
  // Registry
  getExportPluginRegistry,
  createExportPluginRegistry,
  ExportPluginRegistry,
  // Data preparation
  preparePluginExportData,
  // Export functions
  exportWithPlugin,
  pluginToString,
  // Hook
  useExportPlugins,
  // Plugin creators
  createTextPlugin,
  createBinaryPlugin,
  // Types
  type ExportCellValue,
  type ExportData,
  type ExportMetadata,
  type ExportPlugin,
  type ExportPluginBaseOptions,
  type ExportPluginResult,
  type ValidationResult,
  type PluginRegistryConfig,
  type ExportWithPluginOptions,
  type ExportWithPluginResult,
  type UseExportPluginsOptions,
  type UseExportPluginsReturn,
} from "./plugins";

// ─── UNIFIED EXPORT FUNCTION ────────────────────────────────────────────────

import type { ExportConfig, ExportResult } from "./types";
import { exportToCSV } from "./csv";
import { exportToExcel } from "./excel";
import { exportToPDF } from "./pdf";
import { exportToJSON } from "./json";

/**
 * Unified export function that handles all formats
 *
 * @example
 * ```tsx
 * // Export to CSV
 * exportData({ format: "csv", data, columns, filename: "users" });
 *
 * // Export to Excel with options
 * exportData({
 *   format: "excel",
 *   data,
 *   columns,
 *   filename: "report",
 *   autoWidth: true,
 *   freezeHeader: true,
 * });
 *
 * // Export to PDF with title
 * exportData({
 *   format: "pdf",
 *   data,
 *   columns,
 *   title: "Monthly Report",
 *   orientation: "landscape",
 * });
 *
 * // Export selected rows only
 * exportData({
 *   format: "csv",
 *   data,
 *   columns,
 *   selectedOnly: true,
 *   selectedIds: new Set(["1", "2", "3"]),
 * });
 * ```
 */
export function exportData<T extends { id: string }>(
  config: ExportConfig<T>
): ExportResult {
  switch (config.format) {
    case "csv":
      return exportToCSV(config);
    case "excel":
      return exportToExcel(config);
    case "pdf":
      return exportToPDF(config);
    case "json":
      return exportToJSON(config);
    default: {
      const exhaustiveCheck: never = config;
      return { success: false, error: `Unknown format: ${exhaustiveCheck}` };
    }
  }
}
