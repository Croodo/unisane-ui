"use client";

import type { Column } from "../types/index";
import { getNestedValue } from "./get-nested-value";

// ─── PRINT TYPES ──────────────────────────────────────────────────────────────

export interface PrintOptions {
  /** Document title for print */
  title?: string;
  /** Optional subtitle (e.g., date range, filter info) */
  subtitle?: string;
  /** Whether to include timestamp */
  includeTimestamp?: boolean;
  /** Page orientation */
  orientation?: "portrait" | "landscape";
  /** Paper size */
  paperSize?: "a4" | "letter" | "legal";
  /** Whether to include row numbers */
  showRowNumbers?: boolean;
  /** Whether to show page numbers in footer */
  showPageNumbers?: boolean;
  /** Custom header content (HTML string) */
  headerHtml?: string;
  /** Custom footer content (HTML string) */
  footerHtml?: string;
  /** Columns to include (by key). If not specified, includes all visible columns */
  columnKeys?: string[];
  /** Whether to fit table to page width */
  fitToPage?: boolean;
  /** Custom CSS to inject */
  customCss?: string;
  /** Font size for table content (default: 9pt) */
  fontSize?: string;
  /** Whether to include column widths from definitions */
  preserveColumnWidths?: boolean;
}

export interface PrintConfig<T extends { id: string }> {
  /** Data rows to print */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Print options */
  options?: PrintOptions;
  /** Selected row IDs (to print only selected) */
  selectedIds?: Set<string>;
  /** Whether to print only selected rows */
  selectedOnly?: boolean;
}

// ─── PRINT STYLES ─────────────────────────────────────────────────────────────

const getPrintStyles = (options: PrintOptions = {}): string => {
  const {
    orientation = "landscape",
    paperSize = "a4",
    fitToPage = true,
    fontSize = "9pt",
    showPageNumbers = true,
  } = options;

  return `
    @page {
      size: ${paperSize} ${orientation};
      margin: 15mm 10mm 20mm 10mm;
      ${showPageNumbers ? `
      @bottom-center {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 8pt;
        color: #666;
      }
      ` : ""}
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #1a1a1a;
      background: white;
    }

    .print-container {
      width: 100%;
      max-width: 100%;
    }

    .print-header {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #333;
    }

    .print-title {
      font-size: 16pt;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: #1a1a1a;
    }

    .print-subtitle {
      font-size: 10pt;
      color: #666;
      margin: 0;
    }

    .print-timestamp {
      font-size: 8pt;
      color: #888;
      margin-top: 4px;
    }

    .print-table {
      width: 100%;
      border-collapse: collapse;
      ${fitToPage ? "table-layout: fixed;" : ""}
      font-size: ${fontSize};
    }

    .print-table th,
    .print-table td {
      border: 1px solid #ddd;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .print-table th {
      background-color: #f5f5f5 !important;
      font-weight: 600;
      white-space: nowrap;
      color: #333;
    }

    .print-table tbody tr:nth-child(even) {
      background-color: #fafafa !important;
    }

    .print-row-number {
      width: 40px;
      text-align: center;
      color: #888;
      font-size: 8pt;
    }

    .print-align-center {
      text-align: center;
    }

    .print-align-right {
      text-align: right;
    }

    .print-footer {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #ddd;
      font-size: 8pt;
      color: #666;
      display: flex;
      justify-content: space-between;
    }

    .print-page-info {
      text-align: right;
    }

    .print-summary {
      font-weight: 500;
    }

    /* Hide elements not meant for print */
    .no-print {
      display: none !important;
    }

    /* Page break handling */
    .print-table thead {
      display: table-header-group;
    }

    .print-table tbody {
      display: table-row-group;
    }

    .print-table tr {
      page-break-inside: avoid;
    }

    /* Avoid orphans at page breaks */
    .print-table tbody tr:last-child {
      page-break-after: avoid;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }

    ${options.customCss || ""}
  `;
};

// ─── PRINT UTILITIES ──────────────────────────────────────────────────────────

/**
 * Format a cell value for print output
 */
function formatCellValue<T extends { id: string }>(row: T, column: Column<T>): string {
  const value = getNestedValue(row as object, String(column.key));

  // Handle null/undefined
  if (value === null || value === undefined) {
    return "";
  }

  // Use column's print formatter if available
  if (column.printValue) {
    return column.printValue(row);
  }

  // Handle common types
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  if (typeof value === "number") {
    // Format numbers with locale
    return value.toLocaleString();
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Generate HTML table content for printing
 */
function generatePrintHtml<T extends { id: string }>(
  config: PrintConfig<T>
): string {
  const { data, columns, options = {}, selectedIds, selectedOnly = false } = config;
  const {
    title,
    subtitle,
    includeTimestamp = true,
    showRowNumbers = false,
    headerHtml,
    footerHtml,
    columnKeys,
  } = options;

  // Filter data if selectedOnly
  const printData = selectedOnly && selectedIds
    ? data.filter((row) => selectedIds.has(row.id))
    : data;

  // Filter columns if specified
  const printColumns = columnKeys
    ? columns.filter((col) => columnKeys.includes(String(col.key)))
    : columns;

  // Generate header
  let headerContent = "";
  if (title || subtitle || headerHtml) {
    headerContent = `
      <div class="print-header">
        ${headerHtml || ""}
        ${title ? `<h1 class="print-title">${escapeHtml(title)}</h1>` : ""}
        ${subtitle ? `<p class="print-subtitle">${escapeHtml(subtitle)}</p>` : ""}
        ${includeTimestamp ? `<p class="print-timestamp">Generated: ${new Date().toLocaleString()}</p>` : ""}
      </div>
    `;
  }

  // Generate colgroup for column widths (if preserveColumnWidths is enabled)
  const preserveWidths = options.preserveColumnWidths ?? false;
  let colgroup = "";
  if (preserveWidths) {
    const cols = printColumns.map((col) => {
      const width = col.width;
      if (width) {
        const widthStr = typeof width === "number" ? `${width}px` : width;
        return `<col style="width: ${widthStr};">`;
      }
      return "<col>";
    });
    if (showRowNumbers) {
      cols.unshift('<col style="width: 40px;">');
    }
    colgroup = `<colgroup>${cols.join("")}</colgroup>`;
  }

  // Generate table header
  const theadCells = printColumns
    .map((col) => {
      const alignClass = col.align === "center"
        ? "print-align-center"
        : col.align === "end"
        ? "print-align-right"
        : "";
      return `<th class="${alignClass}">${escapeHtml(col.header)}</th>`;
    })
    .join("");

  const thead = `
    <thead>
      <tr>
        ${showRowNumbers ? '<th class="print-row-number">#</th>' : ""}
        ${theadCells}
      </tr>
    </thead>
  `;

  // Generate table body
  const tbodyRows = printData
    .map((row, index) => {
      const cells = printColumns
        .map((col) => {
          const alignClass = col.align === "center"
            ? "print-align-center"
            : col.align === "end"
            ? "print-align-right"
            : "";
          const value = formatCellValue(row, col);
          return `<td class="${alignClass}">${escapeHtml(value)}</td>`;
        })
        .join("");

      return `
        <tr>
          ${showRowNumbers ? `<td class="print-row-number">${index + 1}</td>` : ""}
          ${cells}
        </tr>
      `;
    })
    .join("");

  const tbody = `<tbody>${tbodyRows}</tbody>`;

  // Generate footer
  let footerContent = "";
  if (footerHtml || printData.length > 0) {
    footerContent = `
      <div class="print-footer">
        <div class="print-summary">
          Total: ${printData.length} ${printData.length === 1 ? "row" : "rows"}
          ${selectedOnly ? " (selected only)" : ""}
        </div>
        ${footerHtml || ""}
      </div>
    `;
  }

  // Combine all parts
  return `
    <div class="print-container">
      ${headerContent}
      <table class="print-table">
        ${colgroup}
        ${thead}
        ${tbody}
      </table>
      ${footerContent}
    </div>
  `;
}

/**
 * Escape HTML special characters (SSR-safe, no DOM dependency)
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── PRINT FUNCTION ───────────────────────────────────────────────────────────

/**
 * Print data table content
 *
 * @example
 * ```tsx
 * // Basic print
 * printDataTable({
 *   data: users,
 *   columns: columns,
 *   options: { title: "User Report" }
 * });
 *
 * // Print selected rows only
 * printDataTable({
 *   data: users,
 *   columns: columns,
 *   selectedIds: new Set(["1", "2", "3"]),
 *   selectedOnly: true,
 *   options: {
 *     title: "Selected Users",
 *     orientation: "portrait"
 *   }
 * });
 * ```
 */
export function printDataTable<T extends { id: string }>(
  config: PrintConfig<T>
): void {
  const { options = {} } = config;

  // Generate HTML content
  const htmlContent = generatePrintHtml(config);
  const styles = getPrintStyles(options);

  // Create print window
  const printWindow = window.open("", "_blank", "width=900,height=700");

  if (!printWindow) {
    console.error("Failed to open print window. Please allow popups for this site.");
    // Fallback: try inline print with injected styles
    alert("Popup blocked. Please allow popups to use the print feature.");
    return;
  }

  // Write content to print window
  const docContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${escapeHtml(options.title || "Print")}</title>
        <style>${styles}</style>
      </head>
      <body>
        ${htmlContent}
        <script>
          // Auto-print when ready
          window.onload = function() {
            window.focus();
            setTimeout(function() {
              window.print();
            }, 250);
          };
          // Close window after print (or cancel)
          window.onafterprint = function() {
            window.close();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(docContent);
  printWindow.document.close();
}

/**
 * Print the current table directly (inline print)
 * Uses the current page's print styles without opening a new window
 */
export function printInline(): void {
  window.print();
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

import { useCallback, useState } from "react";

export interface UsePrintOptions<T extends { id: string }> {
  /** Data rows */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Default print options */
  defaultOptions?: PrintOptions;
  /** Selected row IDs */
  selectedIds?: Set<string>;
}

export interface UsePrintReturn {
  /** Print all data */
  print: (options?: PrintOptions) => void;
  /** Print selected rows only */
  printSelected: (options?: PrintOptions) => void;
  /** Whether print is in progress */
  isPrinting: boolean;
}

/**
 * Hook for printing data table content
 *
 * @example
 * ```tsx
 * const { print, printSelected, isPrinting } = usePrint({
 *   data,
 *   columns,
 *   selectedIds,
 *   defaultOptions: { title: "Users Report" }
 * });
 *
 * // In toolbar
 * <Button onClick={() => print()}>Print All</Button>
 * <Button onClick={() => printSelected()} disabled={selectedIds.size === 0}>
 *   Print Selected
 * </Button>
 * ```
 */
export function usePrint<T extends { id: string }>(
  options: UsePrintOptions<T>
): UsePrintReturn {
  const { data, columns, defaultOptions = {}, selectedIds } = options;
  const [isPrinting, setIsPrinting] = useState(false);

  const print = useCallback(
    (printOptions?: PrintOptions) => {
      setIsPrinting(true);
      try {
        printDataTable({
          data,
          columns,
          options: { ...defaultOptions, ...printOptions },
        });
      } finally {
        // Small delay to allow print window to open
        setTimeout(() => setIsPrinting(false), 100);
      }
    },
    [data, columns, defaultOptions]
  );

  const printSelected = useCallback(
    (printOptions?: PrintOptions) => {
      if (!selectedIds || selectedIds.size === 0) {
        console.warn("No rows selected for printing");
        return;
      }

      setIsPrinting(true);
      try {
        printDataTable({
          data,
          columns,
          selectedIds,
          selectedOnly: true,
          options: { ...defaultOptions, ...printOptions },
        });
      } finally {
        setTimeout(() => setIsPrinting(false), 100);
      }
    },
    [data, columns, selectedIds, defaultOptions]
  );

  return { print, printSelected, isPrinting };
}
