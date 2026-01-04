import type { HTMLExportOptions, ExportResult } from "./types";
import { prepareExportData, getCellValue, downloadFile, generateFilename } from "./utils";

// ─── HTML EXPORT ────────────────────────────────────────────────────────────

/**
 * Escapes HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] ?? char);
}

/**
 * Generates inline CSS for the HTML table
 */
function generateStyles(options: {
  headerColor: string;
  headerTextColor: string;
  borderColor: string;
  zebraColor: string;
  fontSize: number;
  fontFamily: string;
}): string {
  const { headerColor, headerTextColor, borderColor, zebraColor, fontSize, fontFamily } = options;

  return `
    <style>
      .datatable-export {
        font-family: ${fontFamily};
        font-size: ${fontSize}px;
        border-collapse: collapse;
        width: 100%;
        margin: 0 auto;
      }
      .datatable-export th,
      .datatable-export td {
        border: 1px solid ${borderColor};
        padding: 8px 12px;
        text-align: left;
      }
      .datatable-export th {
        background-color: ${headerColor};
        color: ${headerTextColor};
        font-weight: 600;
      }
      .datatable-export tr:nth-child(even) td {
        background-color: ${zebraColor};
      }
      .datatable-export tr:hover td {
        background-color: #e8f0fe;
      }
      .datatable-title {
        font-family: ${fontFamily};
        font-size: ${fontSize + 4}px;
        font-weight: 600;
        margin-bottom: 16px;
        color: #1a1a1a;
      }
      .datatable-metadata {
        font-family: ${fontFamily};
        font-size: ${fontSize - 2}px;
        color: #666;
        margin-top: 12px;
      }
    </style>
  `.trim();
}

/**
 * Exports table data to HTML format.
 *
 * Generates a standalone HTML table that can be:
 * - Embedded in emails
 * - Opened in a browser
 * - Copied to rich text editors
 *
 * @example
 * ```tsx
 * exportToHTML({
 *   data: users,
 *   columns,
 *   filename: "users-table",
 *   title: "User List",
 *   includeStyles: true,
 * });
 * ```
 */
export function exportToHTML<T extends { id: string }>(
  options: HTMLExportOptions<T>
): ExportResult {
  const {
    filename,
    title,
    includeStyles = true,
    inlineStyles = false,
    headerColor = "#6750A4",
    headerTextColor = "#ffffff",
    borderColor = "#e0e0e0",
    zebraColor = "#f5f5f5",
    fontSize = 14,
    fontFamily = "system-ui, -apple-system, sans-serif",
    includeMetadata = false,
    wrapInDocument = true,
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

    // Generate table content
    const tableRows: string[] = [];

    // Header row
    if (includeHeaders) {
      const headerCells = columns.map((col) => {
        const style = inlineStyles
          ? ` style="background-color: ${headerColor}; color: ${headerTextColor}; font-weight: 600; padding: 8px 12px; border: 1px solid ${borderColor};"`
          : "";
        return `<th${style}>${escapeHtml(col.header)}</th>`;
      });
      tableRows.push(`<tr>${headerCells.join("")}</tr>`);
    }

    // Data rows
    rows.forEach((row, rowIndex) => {
      const isEven = rowIndex % 2 === 0;
      const cells = columns.map((col) => {
        const value = getCellValue(row, col, formatValue);
        const style = inlineStyles
          ? ` style="padding: 8px 12px; border: 1px solid ${borderColor};${!isEven ? ` background-color: ${zebraColor};` : ""}"`
          : "";
        return `<td${style}>${escapeHtml(value)}</td>`;
      });
      tableRows.push(`<tr>${cells.join("")}</tr>`);
    });

    // Build table HTML
    const tableStyle = inlineStyles
      ? ` style="font-family: ${fontFamily}; font-size: ${fontSize}px; border-collapse: collapse; width: 100%;"`
      : ' class="datatable-export"';

    let html = "";

    // Add title if provided
    if (title) {
      const titleStyle = inlineStyles
        ? ` style="font-family: ${fontFamily}; font-size: ${fontSize + 4}px; font-weight: 600; margin-bottom: 16px; color: #1a1a1a;"`
        : ' class="datatable-title"';
      html += `<h2${titleStyle}>${escapeHtml(title)}</h2>\n`;
    }

    // Add table
    html += `<table${tableStyle}>\n`;
    if (includeHeaders) {
      html += `  <thead>\n    ${tableRows[0]}\n  </thead>\n`;
      html += `  <tbody>\n${tableRows.slice(1).map((r) => `    ${r}`).join("\n")}\n  </tbody>\n`;
    } else {
      html += `  <tbody>\n${tableRows.map((r) => `    ${r}`).join("\n")}\n  </tbody>\n`;
    }
    html += "</table>\n";

    // Add metadata if requested
    if (includeMetadata) {
      const metadataStyle = inlineStyles
        ? ` style="font-family: ${fontFamily}; font-size: ${fontSize - 2}px; color: #666; margin-top: 12px;"`
        : ' class="datatable-metadata"';
      html += `<p${metadataStyle}>Exported ${rows.length} rows on ${new Date().toLocaleString()}</p>\n`;
    }

    // Wrap in document if requested
    if (wrapInDocument) {
      const styles = includeStyles && !inlineStyles
        ? generateStyles({ headerColor, headerTextColor, borderColor, zebraColor, fontSize, fontFamily })
        : "";

      html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title ? escapeHtml(title) : "Data Export"}</title>
  ${styles}
</head>
<body>
${html}
</body>
</html>`;
    }

    // Download
    const outputFilename = generateFilename(filename, "html");
    downloadFile(html, outputFilename, "text/html");

    return {
      success: true,
      rowCount: rows.length,
      fileSize: new Blob([html]).size,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export HTML";
    console.error("HTML export failed:", error);
    return { success: false, error: message };
  }
}

/**
 * Returns HTML content as a string (without downloading).
 *
 * Useful for:
 * - Embedding in email bodies
 * - Copying to clipboard
 * - Server-side rendering
 *
 * @example
 * ```tsx
 * const html = toHTMLString({
 *   data: users,
 *   columns,
 *   inlineStyles: true, // Better for email embedding
 *   wrapInDocument: false, // Just the table, no DOCTYPE
 * });
 * ```
 */
export function toHTMLString<T extends { id: string }>(
  options: HTMLExportOptions<T>
): string {
  const {
    title,
    includeStyles = true,
    inlineStyles = false,
    headerColor = "#6750A4",
    headerTextColor = "#ffffff",
    borderColor = "#e0e0e0",
    zebraColor = "#f5f5f5",
    fontSize = 14,
    fontFamily = "system-ui, -apple-system, sans-serif",
    includeMetadata = false,
    wrapInDocument = false,
    includeHeaders = true,
    formatValue,
  } = options;

  const { rows, columns } = prepareExportData(options);

  // Generate table content
  const tableRows: string[] = [];

  // Header row
  if (includeHeaders) {
    const headerCells = columns.map((col) => {
      const style = inlineStyles
        ? ` style="background-color: ${headerColor}; color: ${headerTextColor}; font-weight: 600; padding: 8px 12px; border: 1px solid ${borderColor};"`
        : "";
      return `<th${style}>${escapeHtml(col.header)}</th>`;
    });
    tableRows.push(`<tr>${headerCells.join("")}</tr>`);
  }

  // Data rows
  rows.forEach((row, rowIndex) => {
    const isEven = rowIndex % 2 === 0;
    const cells = columns.map((col) => {
      const value = getCellValue(row, col, formatValue);
      const style = inlineStyles
        ? ` style="padding: 8px 12px; border: 1px solid ${borderColor};${!isEven ? ` background-color: ${zebraColor};` : ""}"`
        : "";
      return `<td${style}>${escapeHtml(value)}</td>`;
    });
    tableRows.push(`<tr>${cells.join("")}</tr>`);
  });

  // Build table HTML
  const tableStyle = inlineStyles
    ? ` style="font-family: ${fontFamily}; font-size: ${fontSize}px; border-collapse: collapse; width: 100%;"`
    : ' class="datatable-export"';

  let html = "";

  // Add title if provided
  if (title) {
    const titleStyle = inlineStyles
      ? ` style="font-family: ${fontFamily}; font-size: ${fontSize + 4}px; font-weight: 600; margin-bottom: 16px; color: #1a1a1a;"`
      : ' class="datatable-title"';
    html += `<h2${titleStyle}>${escapeHtml(title)}</h2>\n`;
  }

  // Add table
  html += `<table${tableStyle}>\n`;
  if (includeHeaders) {
    html += `  <thead>\n    ${tableRows[0]}\n  </thead>\n`;
    html += `  <tbody>\n${tableRows.slice(1).map((r) => `    ${r}`).join("\n")}\n  </tbody>\n`;
  } else {
    html += `  <tbody>\n${tableRows.map((r) => `    ${r}`).join("\n")}\n  </tbody>\n`;
  }
  html += "</table>\n";

  // Add metadata if requested
  if (includeMetadata) {
    const metadataStyle = inlineStyles
      ? ` style="font-family: ${fontFamily}; font-size: ${fontSize - 2}px; color: #666; margin-top: 12px;"`
      : ' class="datatable-metadata"';
    html += `<p${metadataStyle}>Exported ${rows.length} rows on ${new Date().toLocaleString()}</p>\n`;
  }

  // Wrap in document if requested
  if (wrapInDocument) {
    const styles = includeStyles && !inlineStyles
      ? generateStyles({ headerColor, headerTextColor, borderColor, zebraColor, fontSize, fontFamily })
      : "";

    html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title ? escapeHtml(title) : "Data Export"}</title>
  ${styles}
</head>
<body>
${html}
</body>
</html>`;
  }

  return html;
}
