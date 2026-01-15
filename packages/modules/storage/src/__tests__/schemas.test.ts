import { describe, it, expect } from "vitest";
import {
  ZRequestUpload,
  ZConfirmUpload,
  ZDeleteFile,
  ZGetDownloadUrl,
  ZListFiles,
  ZStorageFileResponse,
  ZUploadUrlResponse,
  ZDownloadUrlResponse,
} from "../domain/schemas";

describe("Storage Schemas", () => {
  describe("ZRequestUpload", () => {
    it("should accept valid upload request with all fields", () => {
      const result = ZRequestUpload.safeParse({
        folder: "documents",
        filename: "report.pdf",
        contentType: "application/pdf",
        sizeBytes: 1024000,
        metadata: { source: "web-app", version: "1.0" },
      });

      expect(result.success).toBe(true);
    });

    it("should accept valid request with minimal fields", () => {
      const result = ZRequestUpload.safeParse({
        folder: "documents",
        filename: "file.txt",
        contentType: "text/plain",
        sizeBytes: 500,
      });

      expect(result.success).toBe(true);
    });

    it("should accept optional metadata", () => {
      const result = ZRequestUpload.safeParse({
        folder: "avatars",
        filename: "photo.jpg",
        contentType: "image/jpeg",
        sizeBytes: 2048000,
        metadata: { camera: "iPhone", location: "NYC" },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata).toBeDefined();
      }
    });

    it("should reject empty folder", () => {
      const result = ZRequestUpload.safeParse({
        folder: "",
        filename: "file.txt",
        contentType: "text/plain",
        sizeBytes: 100,
      });

      expect(result.success).toBe(false);
    });

    it("should reject empty filename", () => {
      const result = ZRequestUpload.safeParse({
        folder: "docs",
        filename: "",
        contentType: "text/plain",
        sizeBytes: 100,
      });

      expect(result.success).toBe(false);
    });

    it("should reject missing contentType", () => {
      const result = ZRequestUpload.safeParse({
        folder: "docs",
        filename: "file.txt",
        sizeBytes: 100,
      });

      expect(result.success).toBe(false);
    });

    it("should reject negative file size", () => {
      const result = ZRequestUpload.safeParse({
        folder: "docs",
        filename: "file.txt",
        contentType: "text/plain",
        sizeBytes: -100,
      });

      expect(result.success).toBe(false);
    });

    it("should reject zero file size", () => {
      const result = ZRequestUpload.safeParse({
        folder: "docs",
        filename: "file.txt",
        contentType: "text/plain",
        sizeBytes: 0,
      });

      expect(result.success).toBe(false);
    });

    it("should accept large file sizes", () => {
      const result = ZRequestUpload.safeParse({
        folder: "attachments",
        filename: "archive.zip",
        contentType: "application/zip",
        sizeBytes: 50000000, // 50MB (within limit)
      });

      expect(result.success).toBe(true);
    });
  });

  describe("ZConfirmUpload", () => {
    it("should accept valid fileId", () => {
      const result = ZConfirmUpload.safeParse({
        fileId: "60f7b3b3c3b3c3b3c3b3c3b3",
      });

      expect(result.success).toBe(true);
    });

    it("should reject empty fileId", () => {
      const result = ZConfirmUpload.safeParse({
        fileId: "",
      });

      expect(result.success).toBe(false);
    });

    it("should reject missing fileId", () => {
      const result = ZConfirmUpload.safeParse({});

      expect(result.success).toBe(false);
    });
  });

  describe("ZDeleteFile", () => {
    it("should accept valid fileId", () => {
      const result = ZDeleteFile.safeParse({
        fileId: "60f7b3b3c3b3c3b3c3b3c3b3",
      });

      expect(result.success).toBe(true);
    });

    it("should reject empty fileId", () => {
      const result = ZDeleteFile.safeParse({
        fileId: "",
      });

      expect(result.success).toBe(false);
    });

    it("should reject missing fileId", () => {
      const result = ZDeleteFile.safeParse({});

      expect(result.success).toBe(false);
    });
  });

  describe("ZGetDownloadUrl", () => {
    it("should accept fileId only", () => {
      const result = ZGetDownloadUrl.safeParse({
        fileId: "60f7b3b3c3b3c3b3c3b3c3b3",
      });

      expect(result.success).toBe(true);
    });

    it("should accept key only", () => {
      const result = ZGetDownloadUrl.safeParse({
        key: "tenant123/documents/file.pdf",
      });

      expect(result.success).toBe(true);
    });

    it("should accept both fileId and key", () => {
      const result = ZGetDownloadUrl.safeParse({
        fileId: "60f7b3b3c3b3c3b3c3b3c3b3",
        key: "tenant123/documents/file.pdf",
      });

      expect(result.success).toBe(true);
    });

    it("should reject empty object", () => {
      const result = ZGetDownloadUrl.safeParse({});

      expect(result.success).toBe(false);
    });

    it("should reject empty strings", () => {
      const result = ZGetDownloadUrl.safeParse({
        fileId: "",
        key: "",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("ZListFiles", () => {
    it("should accept empty object (all optional)", () => {
      const result = ZListFiles.safeParse({});

      expect(result.success).toBe(true);
    });

    it("should accept folder filter", () => {
      const result = ZListFiles.safeParse({
        folder: "documents",
      });

      expect(result.success).toBe(true);
    });

    it("should accept status filter", () => {
      const result = ZListFiles.safeParse({
        status: "active",
      });

      expect(result.success).toBe(true);
    });

    it("should accept cursor pagination", () => {
      const result = ZListFiles.safeParse({
        cursor: "60f7b3b3c3b3c3b3c3b3c3b3",
        limit: 20,
      });

      expect(result.success).toBe(true);
    });

    it("should accept all filters combined", () => {
      const result = ZListFiles.safeParse({
        folder: "avatars",
        status: "deleted",
        cursor: "60f7b3b3c3b3c3b3c3b3c3b3",
        limit: 50,
      });

      expect(result.success).toBe(true);
    });

    it("should accept pending status", () => {
      const result = ZListFiles.safeParse({
        status: "pending",
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = ZListFiles.safeParse({
        status: "INVALID",
      });

      expect(result.success).toBe(false);
    });

    it("should reject negative limit", () => {
      const result = ZListFiles.safeParse({
        limit: -10,
      });

      expect(result.success).toBe(false);
    });

    it("should reject zero limit", () => {
      const result = ZListFiles.safeParse({
        limit: 0,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("ZStorageFileResponse", () => {
    it("should accept valid file response", () => {
      const result = ZStorageFileResponse.safeParse({
        id: "60f7b3b3c3b3c3b3c3b3c3b3",
        scopeId: "tenant123",
        uploaderId: "user123",
        key: "tenant123/documents/report.pdf",
        folder: "documents",
        filename: "report.pdf",
        contentType: "application/pdf",
        sizeBytes: 1024000,
        status: "active",
        createdAt: "2024-01-15T10:30:00Z",
        updatedAt: "2024-01-15T10:35:00Z",
      });

      expect(result.success).toBe(true);
    });

    it("should accept file with metadata", () => {
      const result = ZStorageFileResponse.safeParse({
        id: "60f7b3b3c3b3c3b3c3b3c3b3",
        scopeId: "tenant123",
        uploaderId: "user456",
        key: "tenant123/photos/img.jpg",
        folder: "avatars",
        filename: "img.jpg",
        contentType: "image/jpeg",
        sizeBytes: 500000,
        status: "active",
        metadata: { camera: "Canon", location: "Paris" },
        createdAt: "2024-01-15T10:30:00Z",
        updatedAt: "2024-01-15T10:30:00Z",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata).toEqual({
          camera: "Canon",
          location: "Paris",
        });
      }
    });

    it("should accept deleted file status", () => {
      const result = ZStorageFileResponse.safeParse({
        id: "60f7b3b3c3b3c3b3c3b3c3b3",
        scopeId: "tenant123",
        uploaderId: "user789",
        key: "tenant123/old/file.txt",
        folder: "documents",
        filename: "file.txt",
        contentType: "text/plain",
        sizeBytes: 100,
        status: "deleted",
        createdAt: "2024-01-15T10:30:00Z",
        updatedAt: "2024-01-20T10:30:00Z",
      });

      expect(result.success).toBe(true);
    });

    it("should reject missing required fields", () => {
      const result = ZStorageFileResponse.safeParse({
        id: "60f7b3b3c3b3c3b3c3b3c3b3",
        scopeId: "tenant123",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("ZUploadUrlResponse", () => {
    it("should accept valid upload URL response", () => {
      const result = ZUploadUrlResponse.safeParse({
        fileId: "60f7b3b3c3b3c3b3c3b3c3b3",
        uploadUrl: "https://s3.amazonaws.com/bucket/path?signed=true",
        key: "tenant123/documents/file.pdf",
        expiresAt: Date.now() + 3600000,
      });

      expect(result.success).toBe(true);
    });

    it("should reject missing fileId", () => {
      const result = ZUploadUrlResponse.safeParse({
        uploadUrl: "https://s3.amazonaws.com/bucket/path",
        key: "tenant123/file.pdf",
        expiresAt: Date.now() + 3600000,
      });

      expect(result.success).toBe(false);
    });

    it("should reject missing uploadUrl", () => {
      const result = ZUploadUrlResponse.safeParse({
        fileId: "60f7b3b3c3b3c3b3c3b3c3b3",
        key: "tenant123/file.pdf",
        expiresAt: Date.now() + 3600000,
      });

      expect(result.success).toBe(false);
    });

    it("should accept valid URL formats", () => {
      const result = ZUploadUrlResponse.safeParse({
        fileId: "60f7b3b3c3b3c3b3c3b3c3b3",
        uploadUrl: "https://storage.example.com/upload",
        key: "tenant123/file.pdf",
        expiresAt: Date.now() + 3600000,
      });

      expect(result.success).toBe(true);
    });

    it("should accept expiresAt as Unix timestamp in ms", () => {
      const result = ZUploadUrlResponse.safeParse({
        fileId: "60f7b3b3c3b3c3b3c3b3c3b3",
        uploadUrl: "https://s3.amazonaws.com/bucket/path",
        key: "tenant123/file.pdf",
        expiresAt: 1705320000000,
      });

      expect(result.success).toBe(true);
    });

    it("should reject string expiresAt", () => {
      const result = ZUploadUrlResponse.safeParse({
        fileId: "60f7b3b3c3b3c3b3c3b3c3b3",
        uploadUrl: "https://s3.amazonaws.com/bucket/path",
        key: "tenant123/file.pdf",
        expiresAt: "2024-01-15T11:00:00Z",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("ZDownloadUrlResponse", () => {
    it("should accept valid download URL response", () => {
      const result = ZDownloadUrlResponse.safeParse({
        url: "https://s3.amazonaws.com/bucket/file.pdf?signed=true",
        key: "tenant123/documents/file.pdf",
        expiresAt: Date.now() + 3600000,
      });

      expect(result.success).toBe(true);
    });

    it("should reject missing url", () => {
      const result = ZDownloadUrlResponse.safeParse({
        key: "tenant123/file.pdf",
        expiresAt: Date.now() + 3600000,
      });

      expect(result.success).toBe(false);
    });

    it("should reject missing key", () => {
      const result = ZDownloadUrlResponse.safeParse({
        url: "https://s3.amazonaws.com/file.pdf",
        expiresAt: Date.now() + 3600000,
      });

      expect(result.success).toBe(false);
    });

    it("should accept valid URL formats", () => {
      const result = ZDownloadUrlResponse.safeParse({
        url: "https://cdn.example.com/download/file.pdf",
        key: "tenant123/file.pdf",
        expiresAt: Date.now() + 3600000,
      });

      expect(result.success).toBe(true);
    });

    it("should accept expiresAt as Unix timestamp in ms", () => {
      const result = ZDownloadUrlResponse.safeParse({
        url: "https://cdn.example.com/file.pdf",
        key: "tenant123/file.pdf",
        expiresAt: 1705320000000,
      });

      expect(result.success).toBe(true);
    });

    it("should reject string expiresAt", () => {
      const result = ZDownloadUrlResponse.safeParse({
        url: "https://cdn.example.com/file.pdf",
        key: "tenant123/file.pdf",
        expiresAt: "2024-01-15T11:00:00Z",
      });

      expect(result.success).toBe(false);
    });
  });
});
