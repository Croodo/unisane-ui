import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { PDFExportOptions, ExportResult } from "./types";
import { prepareExportData, getCellValue, generateFilename } from "./utils";

// ─── PDF EXPORT ─────────────────────────────────────────────────────────────

/**
 * Exports table data to PDF format
 */
export function exportToPDF<T extends { id: string }>(
  options: PDFExportOptions<T>
): ExportResult {
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
 * Returns PDF as a Blob (without downloading)
 */
export function toPDFBlob<T extends { id: string }>(
  options: PDFExportOptions<T>
): Blob {
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
