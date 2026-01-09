/**
 * Storage Domain — Zod Schemas
 *
 * Input validation schemas for storage operations.
 * Derived from SSOT in shared/constants/storage.ts
 */
import { z } from "zod";
import {
  ZStorageFolder,
  ZContentType,
  ZFileStatus,
  STORAGE_LIMITS,
} from "@unisane/kernel";
import { ZIdem } from "@unisane/kernel";

// ---------------------------------------------------------------------------
// Request Upload
// ---------------------------------------------------------------------------
export const ZRequestUpload = z.object({
  folder: ZStorageFolder,
  filename: z
    .string()
    .min(1)
    .max(STORAGE_LIMITS.MAX_FILENAME_LENGTH)
    .describe("Original filename from client"),
  contentType: ZContentType,
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(STORAGE_LIMITS.DEFAULT_MAX_FILE_SIZE)
    .describe("File size in bytes"),
  metadata: z.record(z.unknown()).optional().describe("Custom metadata"),
});

export type RequestUploadInput = z.infer<typeof ZRequestUpload>;

// ---------------------------------------------------------------------------
// Confirm Upload
// ---------------------------------------------------------------------------
export const ZConfirmUpload = z.object({
  fileId: z.string().min(1).describe("File record ID"),
});

export type ConfirmUploadInput = z.infer<typeof ZConfirmUpload>;

// ---------------------------------------------------------------------------
// Delete File
// ---------------------------------------------------------------------------
export const ZDeleteFile = z.object({
  fileId: z.string().min(1).describe("File record ID"),
});

export type DeleteFileInput = z.infer<typeof ZDeleteFile>;

// ---------------------------------------------------------------------------
// Get Download URL
// ---------------------------------------------------------------------------
export const ZGetDownloadUrl = z
  .object({
    fileId: z.string().min(1).optional().describe("File record ID"),
    key: z.string().min(1).optional().describe("Direct S3 key"),
  })
  .refine((v) => v.fileId || v.key, {
    message: "Either fileId or key must be provided",
  });

export type GetDownloadUrlInput = z.infer<typeof ZGetDownloadUrl>;

// ---------------------------------------------------------------------------
// List Files
// ---------------------------------------------------------------------------
export const ZListFiles = z.object({
  folder: ZStorageFolder.optional(),
  status: ZFileStatus.optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListFilesInput = z.infer<typeof ZListFiles>;

// ---------------------------------------------------------------------------
// Response Types (for contracts)
// ---------------------------------------------------------------------------
export const ZStorageFileResponse = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  uploaderId: z.string().min(1),
  key: z.string().min(1),
  folder: ZStorageFolder,
  filename: z.string().min(1),
  contentType: ZContentType,
  sizeBytes: z.number(),
  status: ZFileStatus,
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type StorageFileResponse = z.infer<typeof ZStorageFileResponse>;

export const ZUploadUrlResponse = z.object({
  fileId: z.string(),
  uploadUrl: z.string().url(),
  key: z.string(),
  expiresAt: z.number().describe("Unix timestamp in ms"),
});

export type UploadUrlResponse = z.infer<typeof ZUploadUrlResponse>;

export const ZDownloadUrlResponse = z.object({
  url: z.string().url(),
  key: z.string(),
  expiresAt: z.number().describe("Unix timestamp in ms"),
});

export type DownloadUrlResponse = z.infer<typeof ZDownloadUrlResponse>;
