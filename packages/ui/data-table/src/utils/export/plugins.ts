// ─── EXPORT PLUGIN SYSTEM ────────────────────────────────────────────────────
// Extensible plugin architecture for custom export formats.

import type { Column } from "../../types";
import type { ExportResult, ExportOptions } from "./types";

// ─── PLUGIN TYPES ────────────────────────────────────────────────────────────

/**
 * Cell value with metadata for export
 */
export interface ExportCellValue<T> {
  /** The raw value from the data */
  rawValue: unknown;
  /** The formatted display value */
  formattedValue: string;
  /** Column definition */
  column: Column<T>;
  /** Row data */
  row: T;
  /** Row index (0-based) */
  rowIndex: number;
  /** Column index (0-based) */
  columnIndex: number;
}

/**
 * Prepared export data ready for plugin processing
 */
export interface ExportData<T extends { id: string }> {
  /** Column headers */
  headers: string[];
  /** Column definitions */
  columns: Column<T>[];
  /** Rows as arrays of cell values */
  rows: ExportCellValue<T>[][];
  /** Original data rows */
  rawData: T[];
  /** Export metadata */
  metadata: ExportMetadata;
}

/**
 * Export metadata
 */
export interface ExportMetadata {
  /** Export timestamp */
  exportedAt: Date;
  /** Total row count */
  rowCount: number;
  /** Total column count */
  columnCount: number;
  /** Original filename (without extension) */
  filename: string;
  /** Whether only selected rows were exported */
  selectedOnly: boolean;
  /** Whether only visible columns were exported */
  visibleColumnsOnly: boolean;
}

/**
 * Base plugin options that all plugins receive
 */
export interface ExportPluginBaseOptions<T extends { id: string }> {
  /** Prepared export data */
  data: ExportData<T>;
  /** Original export options */
  options: ExportOptions<T>;
}

/**
 * Export plugin definition
 */
export interface ExportPlugin<
  T extends { id: string } = { id: string },
  TOptions extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Unique plugin identifier (used as format name) */
  id: string;

  /** Display name for the format */
  name: string;

  /** File extension (without dot) */
  extension: string;

  /** MIME type for the exported file */
  mimeType: string;

  /** Optional description */
  description?: string;

  /** Optional icon name (Material Symbol) */
  icon?: string;

  /**
   * Export function that generates the file content.
   * Should return the file content as a Blob, string, or ArrayBuffer.
   */
  export: (
    baseOptions: ExportPluginBaseOptions<T>,
    pluginOptions?: TOptions
  ) => ExportPluginResult | Promise<ExportPluginResult>;

  /**
   * Optional function to generate content as a string (for preview).
   */
  toString?: (
    baseOptions: ExportPluginBaseOptions<T>,
    pluginOptions?: TOptions
  ) => string | Promise<string>;

  /**
   * Optional validation function to check if plugin can handle the data.
   */
  validate?: (
    baseOptions: ExportPluginBaseOptions<T>,
    pluginOptions?: TOptions
  ) => ValidationResult;

  /**
   * Optional default plugin options.
   */
  defaultOptions?: Partial<TOptions>;
}

/**
 * Result from a plugin export operation
 */
export interface ExportPluginResult {
  /** File content */
  content: Blob | string | ArrayBuffer;
  /** Actual filename with extension */
  filename: string;
  /** Size in bytes (optional, will be calculated if not provided) */
  size?: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * Plugin registry configuration
 */
export interface PluginRegistryConfig {
  /** Whether to allow overwriting existing plugins */
  allowOverwrite?: boolean;
  /** Default plugins to register (built-in formats) */
  registerBuiltIn?: boolean;
}

// ─── PLUGIN REGISTRY ─────────────────────────────────────────────────────────

/**
 * Registry for export plugins.
 * Singleton pattern for global plugin management.
 */
class ExportPluginRegistry {
  private plugins: Map<string, ExportPlugin> = new Map();
  private allowOverwrite: boolean;

  constructor(config: PluginRegistryConfig = {}) {
    this.allowOverwrite = config.allowOverwrite ?? false;
  }

  /**
   * Register a new export plugin.
   *
   * @example
   * ```typescript
   * registry.register({
   *   id: "markdown",
   *   name: "Markdown",
   *   extension: "md",
   *   mimeType: "text/markdown",
   *   export: ({ data }) => {
   *     let md = `| ${data.headers.join(" | ")} |\n`;
   *     md += `| ${data.headers.map(() => "---").join(" | ")} |\n`;
   *     for (const row of data.rows) {
   *       md += `| ${row.map((c) => c.formattedValue).join(" | ")} |\n`;
   *     }
   *     return { content: md, filename: `${data.metadata.filename}.md` };
   *   },
   * });
   * ```
   */
  register<T extends { id: string }, TOptions extends Record<string, unknown>>(
    plugin: ExportPlugin<T, TOptions>
  ): void {
    if (!plugin.id) {
      throw new Error("Plugin must have an id");
    }

    if (this.plugins.has(plugin.id) && !this.allowOverwrite) {
      throw new Error(
        `Export plugin "${plugin.id}" is already registered. ` +
          "Set allowOverwrite: true in registry config to allow overwriting."
      );
    }

    this.plugins.set(plugin.id, plugin as unknown as ExportPlugin);
  }

  /**
   * Unregister a plugin by ID.
   */
  unregister(pluginId: string): boolean {
    return this.plugins.delete(pluginId);
  }

  /**
   * Get a plugin by ID.
   */
  get<T extends { id: string }, TOptions extends Record<string, unknown>>(
    pluginId: string
  ): ExportPlugin<T, TOptions> | undefined {
    return this.plugins.get(pluginId) as ExportPlugin<T, TOptions> | undefined;
  }

  /**
   * Check if a plugin is registered.
   */
  has(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * Get all registered plugins.
   */
  getAll(): ExportPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get all registered plugin IDs.
   */
  getIds(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Get plugin metadata for UI display.
   */
  getPluginInfo(): Array<{
    id: string;
    name: string;
    extension: string;
    description?: string;
    icon?: string;
  }> {
    return this.getAll().map((p) => ({
      id: p.id,
      name: p.name,
      extension: p.extension,
      description: p.description,
      icon: p.icon,
    }));
  }

  /**
   * Clear all registered plugins.
   */
  clear(): void {
    this.plugins.clear();
  }
}

// Global singleton registry
let globalRegistry: ExportPluginRegistry | null = null;

/**
 * Get the global export plugin registry.
 */
export function getExportPluginRegistry(): ExportPluginRegistry {
  if (!globalRegistry) {
    globalRegistry = new ExportPluginRegistry({ allowOverwrite: true });
  }
  return globalRegistry;
}

/**
 * Create a new isolated registry (useful for testing).
 */
export function createExportPluginRegistry(
  config?: PluginRegistryConfig
): ExportPluginRegistry {
  return new ExportPluginRegistry(config);
}

// ─── DATA PREPARATION ────────────────────────────────────────────────────────

import { getNestedValue } from "../get-nested-value";

/**
 * Get exportable columns (filter hidden columns)
 */
function getExportableColumns<T>(
  columns: Column<T>[],
  visibleColumnsOnly: boolean,
  hiddenColumns?: Set<string>
): Column<T>[] {
  if (!visibleColumnsOnly || !hiddenColumns || hiddenColumns.size === 0) {
    return columns;
  }
  return columns.filter((col) => !hiddenColumns.has(String(col.key)));
}

/**
 * Get raw value from row using column key
 */
function getRawCellValue<T extends object>(row: T, column: Column<T>): unknown {
  return getNestedValue(row, String(column.key));
}

/**
 * Format a value for export (default formatting)
 */
function formatValueForExport(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().split("T")[0] ?? "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

/**
 * Prepare data for export plugins.
 * Handles column filtering, row filtering, and value formatting.
 */
export function preparePluginExportData<T extends { id: string }>(
  options: ExportOptions<T>
): ExportData<T> {
  const {
    data,
    columns,
    filename = "export",
    visibleColumnsOnly = false,
    hiddenColumns,
    selectedOnly = false,
    selectedIds,
    includeHeaders = true,
    formatValue,
  } = options;

  // Filter columns
  const exportColumns = getExportableColumns(
    columns,
    visibleColumnsOnly,
    hiddenColumns
  );

  // Filter rows
  let exportRows = data;
  if (selectedOnly && selectedIds && selectedIds.size > 0) {
    exportRows = data.filter((row) => selectedIds.has(row.id));
  }

  // Build headers
  const headers = includeHeaders
    ? exportColumns.map((col) => col.header || String(col.key))
    : [];

  // Build row data with cell values
  const rows: ExportCellValue<T>[][] = exportRows.map((row, rowIndex) =>
    exportColumns.map((column, columnIndex) => {
      const rawValue = getRawCellValue(row, column);
      const formattedValue = formatValue
        ? formatValue(rawValue, column, row)
        : formatValueForExport(rawValue);

      return {
        rawValue,
        formattedValue,
        column,
        row,
        rowIndex,
        columnIndex,
      };
    })
  );

  // Build metadata
  const metadata: ExportMetadata = {
    exportedAt: new Date(),
    rowCount: rows.length,
    columnCount: exportColumns.length,
    filename,
    selectedOnly,
    visibleColumnsOnly,
  };

  return {
    headers,
    columns: exportColumns,
    rows,
    rawData: exportRows,
    metadata,
  };
}

// ─── PLUGIN EXPORT FUNCTION ──────────────────────────────────────────────────

/**
 * Options for exporting with a plugin
 */
export interface ExportWithPluginOptions<
  T extends { id: string },
  TOptions extends Record<string, unknown> = Record<string, unknown>,
> extends ExportOptions<T> {
  /** Plugin ID to use */
  pluginId: string;
  /** Plugin-specific options */
  pluginOptions?: TOptions;
  /** Custom registry (defaults to global) */
  registry?: ExportPluginRegistry;
  /** Whether to trigger download (default: true) */
  download?: boolean;
}

/**
 * Export result with additional plugin info
 */
export interface ExportWithPluginResult extends ExportResult {
  /** Plugin that was used */
  pluginId: string;
  /** Generated blob (if available) */
  blob?: Blob;
  /** Download URL (if download was triggered) */
  downloadUrl?: string;
}

/**
 * Export data using a registered plugin.
 *
 * @example
 * ```typescript
 * // Register a custom plugin
 * getExportPluginRegistry().register({
 *   id: "yaml",
 *   name: "YAML",
 *   extension: "yml",
 *   mimeType: "text/yaml",
 *   export: ({ data }) => {
 *     // Custom YAML generation logic
 *     return { content: yamlContent, filename: `${data.metadata.filename}.yml` };
 *   },
 * });
 *
 * // Use the plugin
 * const result = await exportWithPlugin({
 *   pluginId: "yaml",
 *   data: tableData,
 *   columns: tableColumns,
 *   filename: "export",
 * });
 * ```
 */
export async function exportWithPlugin<
  T extends { id: string },
  TOptions extends Record<string, unknown> = Record<string, unknown>,
>(options: ExportWithPluginOptions<T, TOptions>): Promise<ExportWithPluginResult> {
  const {
    pluginId,
    pluginOptions,
    registry = getExportPluginRegistry(),
    download = true,
    ...exportOptions
  } = options;

  // Get plugin
  const plugin = registry.get<T, TOptions>(pluginId);
  if (!plugin) {
    return {
      success: false,
      error: `Export plugin "${pluginId}" is not registered`,
      pluginId,
    };
  }

  try {
    // Prepare data
    const preparedData = preparePluginExportData(exportOptions);

    // Merge plugin default options with provided options
    const mergedPluginOptions = {
      ...plugin.defaultOptions,
      ...pluginOptions,
    } as TOptions;

    // Validate if plugin has validation
    if (plugin.validate) {
      const validation = plugin.validate(
        { data: preparedData, options: exportOptions },
        mergedPluginOptions
      );
      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors?.join(", ")}`,
          pluginId,
        };
      }
    }

    // Run export
    const result = await plugin.export(
      { data: preparedData, options: exportOptions },
      mergedPluginOptions
    );

    // Convert content to Blob
    let blob: Blob;
    if (result.content instanceof Blob) {
      blob = result.content;
    } else if (typeof result.content === "string") {
      blob = new Blob([result.content], { type: plugin.mimeType });
    } else {
      // ArrayBuffer
      blob = new Blob([result.content], { type: plugin.mimeType });
    }

    // Trigger download if requested
    let downloadUrl: string | undefined;
    if (download && typeof window !== "undefined") {
      downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup after a short delay
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl!);
      }, 100);
    }

    return {
      success: true,
      pluginId,
      rowCount: preparedData.metadata.rowCount,
      fileSize: result.size ?? blob.size,
      blob,
      downloadUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      pluginId,
    };
  }
}

/**
 * Get string output from a plugin (for preview).
 */
export async function pluginToString<
  T extends { id: string },
  TOptions extends Record<string, unknown> = Record<string, unknown>,
>(options: Omit<ExportWithPluginOptions<T, TOptions>, "download">): Promise<string | null> {
  const {
    pluginId,
    pluginOptions,
    registry = getExportPluginRegistry(),
    ...exportOptions
  } = options;

  const plugin = registry.get<T, TOptions>(pluginId);
  if (!plugin || !plugin.toString) {
    return null;
  }

  try {
    const preparedData = preparePluginExportData(exportOptions);
    const mergedPluginOptions = {
      ...plugin.defaultOptions,
      ...pluginOptions,
    } as TOptions;

    return await plugin.toString(
      { data: preparedData, options: exportOptions },
      mergedPluginOptions
    );
  } catch {
    return null;
  }
}

// ─── HOOK FOR REACT ──────────────────────────────────────────────────────────

import { useCallback, useMemo, useState } from "react";

export interface UseExportPluginsOptions {
  /** Custom registry (defaults to global) */
  registry?: ExportPluginRegistry;
}

export interface UseExportPluginsReturn {
  /** All registered plugins */
  plugins: Array<{
    id: string;
    name: string;
    extension: string;
    description?: string;
    icon?: string;
  }>;

  /** Register a new plugin */
  register: <T extends { id: string }, TOptions extends Record<string, unknown>>(
    plugin: ExportPlugin<T, TOptions>
  ) => void;

  /** Unregister a plugin */
  unregister: (pluginId: string) => void;

  /** Check if a plugin exists */
  hasPlugin: (pluginId: string) => boolean;

  /** Export with a plugin */
  exportWith: <T extends { id: string }, TOptions extends Record<string, unknown>>(
    options: ExportWithPluginOptions<T, TOptions>
  ) => Promise<ExportWithPluginResult>;

  /** Whether an export is in progress */
  isExporting: boolean;

  /** Last export error */
  error: string | null;

  /** Last export result */
  lastResult: ExportWithPluginResult | null;
}

/**
 * React hook for using export plugins.
 *
 * @example
 * ```tsx
 * function ExportButton() {
 *   const { plugins, exportWith, isExporting } = useExportPlugins();
 *
 *   return (
 *     <DropdownMenu>
 *       {plugins.map((plugin) => (
 *         <DropdownMenuItem
 *           key={plugin.id}
 *           onClick={() => exportWith({
 *             pluginId: plugin.id,
 *             data,
 *             columns,
 *           })}
 *         >
 *           {plugin.name} (.{plugin.extension})
 *         </DropdownMenuItem>
 *       ))}
 *     </DropdownMenu>
 *   );
 * }
 * ```
 */
export function useExportPlugins(
  options: UseExportPluginsOptions = {}
): UseExportPluginsReturn {
  const { registry = getExportPluginRegistry() } = options;

  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ExportWithPluginResult | null>(null);
  const [, forceUpdate] = useState({});

  const plugins = useMemo(() => registry.getPluginInfo(), [registry]);

  const register = useCallback(
    <T extends { id: string }, TOptions extends Record<string, unknown>>(
      plugin: ExportPlugin<T, TOptions>
    ) => {
      registry.register(plugin);
      forceUpdate({});
    },
    [registry]
  );

  const unregister = useCallback(
    (pluginId: string) => {
      registry.unregister(pluginId);
      forceUpdate({});
    },
    [registry]
  );

  const hasPlugin = useCallback(
    (pluginId: string) => registry.has(pluginId),
    [registry]
  );

  const exportWith = useCallback(
    async <T extends { id: string }, TOptions extends Record<string, unknown>>(
      opts: ExportWithPluginOptions<T, TOptions>
    ): Promise<ExportWithPluginResult> => {
      setIsExporting(true);
      setError(null);

      try {
        const result = await exportWithPlugin({ ...opts, registry });
        setLastResult(result);
        if (!result.success && result.error) {
          setError(result.error);
        }
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        const result: ExportWithPluginResult = {
          success: false,
          error: errorMessage,
          pluginId: opts.pluginId,
        };
        setLastResult(result);
        return result;
      } finally {
        setIsExporting(false);
      }
    },
    [registry]
  );

  return {
    plugins,
    register,
    unregister,
    hasPlugin,
    exportWith,
    isExporting,
    error,
    lastResult,
  };
}

// ─── BUILT-IN PLUGIN HELPERS ─────────────────────────────────────────────────

/**
 * Create a simple text-based export plugin.
 */
export function createTextPlugin<
  T extends { id: string },
  TOptions extends Record<string, unknown> = Record<string, unknown>,
>(config: {
  id: string;
  name: string;
  extension: string;
  mimeType?: string;
  description?: string;
  icon?: string;
  generate: (
    data: ExportData<T>,
    options: ExportOptions<T>,
    pluginOptions?: TOptions
  ) => string;
  defaultOptions?: Partial<TOptions>;
}): ExportPlugin<T, TOptions> {
  return {
    id: config.id,
    name: config.name,
    extension: config.extension,
    mimeType: config.mimeType ?? "text/plain",
    description: config.description,
    icon: config.icon,
    defaultOptions: config.defaultOptions,
    export: ({ data, options }, pluginOptions) => {
      const content = config.generate(data, options, pluginOptions);
      return {
        content,
        filename: `${data.metadata.filename}.${config.extension}`,
      };
    },
    toString: ({ data, options }, pluginOptions) => {
      return config.generate(data, options, pluginOptions);
    },
  };
}

/**
 * Create a binary export plugin.
 */
export function createBinaryPlugin<
  T extends { id: string },
  TOptions extends Record<string, unknown> = Record<string, unknown>,
>(config: {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  description?: string;
  icon?: string;
  generate: (
    data: ExportData<T>,
    options: ExportOptions<T>,
    pluginOptions?: TOptions
  ) => Blob | ArrayBuffer | Promise<Blob | ArrayBuffer>;
  defaultOptions?: Partial<TOptions>;
}): ExportPlugin<T, TOptions> {
  return {
    id: config.id,
    name: config.name,
    extension: config.extension,
    mimeType: config.mimeType,
    description: config.description,
    icon: config.icon,
    defaultOptions: config.defaultOptions,
    export: async ({ data, options }, pluginOptions) => {
      const content = await config.generate(data, options, pluginOptions);
      return {
        content,
        filename: `${data.metadata.filename}.${config.extension}`,
      };
    },
  };
}

export { ExportPluginRegistry };
