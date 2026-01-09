import type { PDFExportOptions, ExportResult } from "./types";
import { prepareExportData, getCellValue, generateFilename } from "./utils";

// ─── LAZY PDF EXPORT ───────────────────────────────────────────────────────
// This module uses dynamic imports to load jspdf and jspdf-autotable
// only when needed, reducing initial bundle size.

// Type for the dynamically imported jsPDF module
type JsPDFModule = typeof import("jspdf");
type AutoTableModule = typeof import("jspdf-autotable");

// Cached module references
let jspdfModule: JsPDFModule | null = null;
let autoTableModule: AutoTableModule | null = null;

/**
 * Lazily loads the jsPDF and jspdf-autotable libraries.
 * Caches the modules after first load for subsequent calls.
 */
async function loadPDFLibraries(): Promise<{
  jsPDF: JsPDFModule["jsPDF"];
  autoTable: AutoTableModule["default"];
}> {
  if (!jspdfModule || !autoTableModule) {
    // Load both libraries in parallel
    const [jspdf, autotable] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    jspdfModule = jspdf;
    autoTableModule = autotable;
  }
  return {
    jsPDF: jspdfModule.jsPDF,
    autoTable: autoTableModule.default,
  };
}

/**
 * Exports table data to PDF format with lazy-loaded dependencies.
 *
 * This is the recommended way to export PDF files as it only loads the
 * jsPDF library when actually needed, reducing initial bundle size by ~400KB.
 *
 * @example
 * ```tsx
 * const result = await exportToPDFAsync({
 *   data: users,
 *   columns,
 *   filename: "users-report",
 *   title: "User Report",
 *   orientation: "landscape",
 * });
 *
 * if (!result.success) {
 *   console.error("Export failed:", result.error);
 * }
 * ```
 */
export async function exportToPDFAsync<T extends { id: string }>(
  options: PDFExportOptions<T>
): Promise<ExportResult> {
  const {
    filename,
    orientation = "portrait",
    pageSize = "a4",
    title,
    showPageNumbers = true,
    headerColor = "#6750A4",
    alternateRowColor = "#F5F5F5",
    fontSize = 10,
    includeTimestamp = true,
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

    // Lazy load jsPDF and autoTable
    const { jsPDF, autoTable } = await loadPDFLibraries();

    const { rows, columns } = prepareExportData(options);

    if (rows.length === 0) {
      return { success: false, error: "No data to export" };
    }

    if (columns.length === 0) {
      return { success: false, error: "No columns to export" };
    }

    // Create PDF document
    const doc = new jsPDF({
      orientation,
      unit: "mm",
      format: pageSize,
    });

    // Add title if provided
    let startY = 15;
    if (title) {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(title, 14, startY);
      startY += 10;
    }

    // Prepare table data
    const headers = includeHeaders ? [columns.map((col) => col.header)] : [];
    const body = rows.map((row) =>
      columns.map((col) => getCellValue(row, col, formatValue))
    );

    // Parse color from hex to RGB
    const parseColor = (hex: string): [number, number, number] => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (result) {
        return [
          parseInt(result[1]!, 16),
          parseInt(result[2]!, 16),
          parseInt(result[3]!, 16),
        ];
      }
      return [103, 80, 164]; // Default primary color
    };

    // Generate table
    autoTable(doc, {
      head: headers,
      body,
      startY,
      styles: {
        fontSize,
        cellPadding: 3,
        overflow: "linebreak",
        halign: "left",
      },
      headStyles: {
        fillColor: parseColor(headerColor),
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: parseColor(alternateRowColor),
      },
      margin: { top: 15, right: 14, bottom: 20, left: 14 },
      didDrawPage: (data) => {
        // Add page numbers
        if (showPageNumbers) {
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          const pageText = `Page ${data.pageNumber} of ${pageCount}`;
          const pageWidth = doc.internal.pageSize.getWidth();
          doc.text(pageText, pageWidth - 25, doc.internal.pageSize.getHeight() - 10);
        }

        // Add timestamp
        if (includeTimestamp && data.pageNumber === 1) {
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          const timestamp = `Generated: ${new Date().toLocaleString()}`;
          doc.text(timestamp, 14, doc.internal.pageSize.getHeight() - 10);
        }
      },
    });

    // Download
    const outputFilename = generateFilename(filename, "pdf");
    doc.save(outputFilename);

    return {
      success: true,
      rowCount: rows.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export PDF";
    console.error("PDF export failed:", error);
    return { success: false, error: message };
  }
}

/**
 * Returns PDF as a Blob (without downloading).
 * Uses lazy-loaded jsPDF library.
 */
export async function toPDFBlobAsync<T extends { id: string }>(
  options: PDFExportOptions<T>
): Promise<Blob> {
  const {
    orientation = "portrait",
    pageSize = "a4",
    title,
    headerColor = "#6750A4",
    alternateRowColor = "#F5F5F5",
    fontSize = 10,
    includeHeaders = true,
    formatValue,
  } = options;

  // Lazy load jsPDF and autoTable
  const { jsPDF, autoTable } = await loadPDFLibraries();

  const { rows, columns } = prepareExportData(options);

  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: pageSize,
  });

  let startY = 15;
  if (title) {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, startY);
    startY += 10;
  }

  const headers = includeHeaders ? [columns.map((col) => col.header)] : [];
  const body = rows.map((row) =>
    columns.map((col) => getCellValue(row, col, formatValue))
  );

  const parseColor = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return [
        parseInt(result[1]!, 16),
        parseInt(result[2]!, 16),
        parseInt(result[3]!, 16),
      ];
    }
    return [103, 80, 164];
  };

  autoTable(doc, {
    head: headers,
    body,
    startY,
    styles: { fontSize, cellPadding: 3, overflow: "linebreak", halign: "left" },
    headStyles: {
      fillColor: parseColor(headerColor),
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: parseColor(alternateRowColor) },
    margin: { top: 15, right: 14, bottom: 20, left: 14 },
  });

  return doc.output("blob");
}

/**
 * Check if PDF libraries are already loaded.
 * Useful for showing loading indicators.
 */
export function isPDFLoaded(): boolean {
  return jspdfModule !== null && autoTableModule !== null;
}

/**
 * Preload the PDF libraries.
 * Call this ahead of time if you know the user will export to PDF.
 */
export async function preloadPDF(): Promise<void> {
  await loadPDFLibraries();
}
