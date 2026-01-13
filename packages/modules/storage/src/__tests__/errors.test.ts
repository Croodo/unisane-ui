import { describe, it, expect } from "vitest";
import { ErrorCode } from "@unisane/kernel";
import {
  FileNotFoundError,
  FileNotConfirmedError,
  FileAlreadyDeletedError,
  ContentTypeNotAllowedError,
  FileSizeExceededError,
  StorageQuotaExceededError,
  FileAccessDeniedError,
  PresignedUrlError,
} from "../domain/errors";

describe("Storage Errors", () => {
  describe("FileNotFoundError", () => {
    it("should create error with file ID", () => {
      const error = new FileNotFoundError("file123");

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.FILE_NOT_FOUND);
      expect(error.status).toBe(404);
      expect(error.message).toContain("file123");
      expect(error.message).toContain("id");
      expect(error.name).toBe("FileNotFoundError");
    });

    it("should create error with key lookup", () => {
      const error = new FileNotFoundError("tenant123/documents/file.pdf", "key");

      expect(error.code).toBe(ErrorCode.FILE_NOT_FOUND);
      expect(error.status).toBe(404);
      expect(error.message).toContain("tenant123/documents/file.pdf");
      expect(error.message).toContain("key");
    });

    it("should not be retryable", () => {
      const error = new FileNotFoundError("file123");

      expect(error.retryable).toBe(false);
    });
  });

  describe("FileNotConfirmedError", () => {
    it("should create error with fileId", () => {
      const error = new FileNotConfirmedError("file456");

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.PRECONDITION_FAILED);
      expect(error.status).toBe(412);
      expect(error.message).toContain("file456");
      expect(error.message).toContain("not been confirmed");
      expect(error.name).toBe("FileNotConfirmedError");
    });

    it("should not be retryable", () => {
      const error = new FileNotConfirmedError("file456");

      expect(error.retryable).toBe(false);
    });
  });

  describe("FileAlreadyDeletedError", () => {
    it("should create error with fileId", () => {
      const error = new FileAlreadyDeletedError("file789");

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.GONE);
      expect(error.status).toBe(410);
      expect(error.message).toContain("file789");
      expect(error.message).toContain("deleted");
      expect(error.name).toBe("FileAlreadyDeletedError");
    });

    it("should not be retryable", () => {
      const error = new FileAlreadyDeletedError("file789");

      expect(error.retryable).toBe(false);
    });
  });

  describe("ContentTypeNotAllowedError", () => {
    it("should create error with content type", () => {
      const error = new ContentTypeNotAllowedError("application/x-executable");

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.INVALID_FILE_TYPE);
      expect(error.status).toBe(415);
      expect(error.message).toContain("application/x-executable");
      expect(error.message).toContain("not allowed");
      expect(error.name).toBe("ContentTypeNotAllowedError");
    });

    it("should not be retryable", () => {
      const error = new ContentTypeNotAllowedError("text/html");

      expect(error.retryable).toBe(false);
    });
  });

  describe("FileSizeExceededError", () => {
    it("should create error with size and limit", () => {
      const error = new FileSizeExceededError(
        10000000,
        5000000,
        "image/jpeg"
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.FILE_TOO_LARGE);
      expect(error.status).toBe(413);
      expect(error.message).toContain("10000000");
      expect(error.message).toContain("5000000");
      expect(error.message).toContain("image/jpeg");
      expect(error.message).toContain("exceeds limit");
      expect(error.name).toBe("FileSizeExceededError");
    });

    it("should not be retryable", () => {
      const error = new FileSizeExceededError(1000, 500, "text/plain");

      expect(error.retryable).toBe(false);
    });

    it("should include all size information in message", () => {
      const error = new FileSizeExceededError(
        2097152,
        1048576,
        "video/mp4"
      );

      expect(error.message).toMatch(/2097152.*1048576.*video\/mp4/);
    });
  });

  describe("StorageQuotaExceededError", () => {
    it("should create error with quota details", () => {
      const error = new StorageQuotaExceededError(
        "tenant123",
        1073741824,
        1000000000
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.STORAGE_QUOTA_EXCEEDED);
      expect(error.status).toBe(403);
      expect(error.message).toContain("tenant123");
      expect(error.message).toContain("1073741824");
      expect(error.message).toContain("1000000000");
      expect(error.message).toContain("quota exceeded");
      expect(error.name).toBe("StorageQuotaExceededError");
    });

    it("should not be retryable", () => {
      const error = new StorageQuotaExceededError("tenant456", 1000, 500);

      expect(error.retryable).toBe(false);
    });

    it("should include tenant ID in message", () => {
      const error = new StorageQuotaExceededError("org-xyz", 5000, 4000);

      expect(error.message).toMatch(/org-xyz/);
    });
  });

  describe("FileAccessDeniedError", () => {
    it("should create error with fileId", () => {
      const error = new FileAccessDeniedError("file-secret-123");

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.FORBIDDEN);
      expect(error.status).toBe(403);
      expect(error.message).toContain("file-secret-123");
      expect(error.message).toContain("Access denied");
      expect(error.name).toBe("FileAccessDeniedError");
    });

    it("should not be retryable", () => {
      const error = new FileAccessDeniedError("file999");

      expect(error.retryable).toBe(false);
    });
  });

  describe("PresignedUrlError", () => {
    it("should create error for upload operation", () => {
      const error = new PresignedUrlError("upload", "S3 credentials invalid");

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.UPLOAD_FAILED);
      expect(error.status).toBe(500);
      expect(error.message).toContain("upload");
      expect(error.message).toContain("S3 credentials invalid");
      expect(error.name).toBe("PresignedUrlError");
    });

    it("should create error for download operation", () => {
      const error = new PresignedUrlError("download", "Bucket not accessible");

      expect(error.code).toBe(ErrorCode.UPLOAD_FAILED);
      expect(error.status).toBe(500);
      expect(error.message).toContain("download");
      expect(error.message).toContain("Bucket not accessible");
    });

    it("should be retryable", () => {
      const error = new PresignedUrlError("upload", "Temporary S3 error");

      expect(error.retryable).toBe(true);
    });

    it("should include operation and reason in message", () => {
      const error = new PresignedUrlError("download", "Network timeout");

      expect(error.message).toMatch(/download.*Network timeout/);
    });
  });

  describe("Error Type Guards", () => {
    it("should differentiate between error types", () => {
      const notFound = new FileNotFoundError("file1");
      const notConfirmed = new FileNotConfirmedError("file2");
      const deleted = new FileAlreadyDeletedError("file3");
      const contentType = new ContentTypeNotAllowedError("text/html");
      const fileSize = new FileSizeExceededError(1000, 500, "image/png");
      const quota = new StorageQuotaExceededError("t1", 1000, 500);
      const access = new FileAccessDeniedError("file4");
      const presigned = new PresignedUrlError("upload", "error");

      expect(notFound.code).toBe(ErrorCode.FILE_NOT_FOUND);
      expect(notConfirmed.code).toBe(ErrorCode.PRECONDITION_FAILED);
      expect(deleted.code).toBe(ErrorCode.GONE);
      expect(contentType.code).toBe(ErrorCode.INVALID_FILE_TYPE);
      expect(fileSize.code).toBe(ErrorCode.FILE_TOO_LARGE);
      expect(quota.code).toBe(ErrorCode.STORAGE_QUOTA_EXCEEDED);
      expect(access.code).toBe(ErrorCode.FORBIDDEN);
      expect(presigned.code).toBe(ErrorCode.UPLOAD_FAILED);
    });

    it("should have correct status codes", () => {
      const notFound = new FileNotFoundError("f1");
      const notConfirmed = new FileNotConfirmedError("f2");
      const deleted = new FileAlreadyDeletedError("f3");
      const contentType = new ContentTypeNotAllowedError("text/html");
      const fileSize = new FileSizeExceededError(1000, 500, "image/png");
      const quota = new StorageQuotaExceededError("t1", 1000, 500);
      const access = new FileAccessDeniedError("f4");
      const presigned = new PresignedUrlError("upload", "err");

      expect(notFound.status).toBe(404);
      expect(notConfirmed.status).toBe(412);
      expect(deleted.status).toBe(410);
      expect(contentType.status).toBe(415);
      expect(fileSize.status).toBe(413);
      expect(quota.status).toBe(403);
      expect(access.status).toBe(403);
      expect(presigned.status).toBe(500);
    });

    it("should only mark presigned URL errors as retryable", () => {
      const notFound = new FileNotFoundError("f1");
      const notConfirmed = new FileNotConfirmedError("f2");
      const deleted = new FileAlreadyDeletedError("f3");
      const contentType = new ContentTypeNotAllowedError("text/html");
      const fileSize = new FileSizeExceededError(1000, 500, "image/png");
      const quota = new StorageQuotaExceededError("t1", 1000, 500);
      const access = new FileAccessDeniedError("f4");
      const presigned = new PresignedUrlError("upload", "err");

      expect(notFound.retryable).toBe(false);
      expect(notConfirmed.retryable).toBe(false);
      expect(deleted.retryable).toBe(false);
      expect(contentType.retryable).toBe(false);
      expect(fileSize.retryable).toBe(false);
      expect(quota.retryable).toBe(false);
      expect(access.retryable).toBe(false);
      expect(presigned.retryable).toBe(true);
    });
  });
});
