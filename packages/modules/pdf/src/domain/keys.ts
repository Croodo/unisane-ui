/**
 * PDF Cache Keys
 */

export const pdfKeys = {
  template: (templateId: string) => `pdf:template:${templateId}` as const,
  generated: (hash: string) => `pdf:generated:${hash}` as const,
} as const;

export type PdfKeyBuilder = typeof pdfKeys;
