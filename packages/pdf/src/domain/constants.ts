/**
 * PDF Domain Constants
 */

export const PDF_EVENTS = {
  GENERATED: 'pdf.generated',
  FAILED: 'pdf.failed',
} as const;

export const PDF_DEFAULTS = {
  DEFAULT_PAGE_SIZE: 'A4',
  DEFAULT_MARGIN: 20,
  MAX_TEMPLATE_SIZE: 1024 * 1024,
} as const;

export const PDF_COLLECTIONS = {
  TEMPLATES: 'pdf_templates',
} as const;
