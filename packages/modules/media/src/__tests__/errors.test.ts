import { describe, it, expect } from "vitest";
import { ErrorCode } from "@unisane/kernel";
import {
  MediaNotFoundError,
  MediaProcessingError,
  UnsupportedMediaTypeError,
} from "../domain/errors";

describe("Media Errors", () => {
  describe("MediaNotFoundError", () => {
    it("should create error with media ID", () => {
      const error = new MediaNotFoundError("media123");

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.FILE_NOT_FOUND);
      expect(error.status).toBe(404);
      expect(error.message).toContain("media123");
      expect(error.message).toContain("not found");
      expect(error.name).toBe("MediaNotFoundError");
    });

    it("should include media ID in message", () => {
      const error = new MediaNotFoundError("img-xyz-789");

      expect(error.message).toMatch(/img-xyz-789/);
    });

    it("should not be retryable", () => {
      const error = new MediaNotFoundError("media456");

      expect(error.retryable).toBe(false);
    });

    it("should handle various media ID formats", () => {
      const mediaIds = [
        "media123",
        "60f7b3b3c3b3c3b3c3b3c3b3",
        "img-2024-01-15-001",
        "uuid-format-id",
      ];

      mediaIds.forEach((mediaId) => {
        const error = new MediaNotFoundError(mediaId);
        expect(error.message).toContain(mediaId);
      });
    });
  });

  describe("MediaProcessingError", () => {
    it("should create error with operation and reason", () => {
      const error = new MediaProcessingError("transcoding", "FFmpeg timeout");

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.UPLOAD_FAILED);
      expect(error.status).toBe(500);
      expect(error.message).toContain("transcoding");
      expect(error.message).toContain("FFmpeg timeout");
      expect(error.name).toBe("MediaProcessingError");
    });

    it("should be retryable", () => {
      const error = new MediaProcessingError(
        "thumbnail generation",
        "Temporary service unavailable"
      );

      expect(error.retryable).toBe(true);
    });

    it("should handle different operation types", () => {
      const operations = [
        { operation: "transcoding", reason: "codec error" },
        { operation: "thumbnail generation", reason: "low memory" },
        { operation: "optimization", reason: "invalid format" },
        { operation: "watermarking", reason: "overlay failed" },
      ];

      operations.forEach(({ operation, reason }) => {
        const error = new MediaProcessingError(operation, reason);
        expect(error.message).toContain(operation);
        expect(error.message).toContain(reason);
      });
    });
  });

  describe("UnsupportedMediaTypeError", () => {
    it("should create error with content type", () => {
      const error = new UnsupportedMediaTypeError("video/x-matroska");

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.INVALID_FILE_TYPE);
      expect(error.status).toBe(415);
      expect(error.message).toContain("video/x-matroska");
      expect(error.message).toContain("Unsupported");
      expect(error.name).toBe("UnsupportedMediaTypeError");
    });

    it("should not be retryable", () => {
      const error = new UnsupportedMediaTypeError("application/octet-stream");

      expect(error.retryable).toBe(false);
    });

    it("should handle various content types", () => {
      const contentTypes = [
        "video/x-matroska",
        "application/octet-stream",
        "text/plain",
        "audio/wav",
      ];

      contentTypes.forEach((contentType) => {
        const error = new UnsupportedMediaTypeError(contentType);
        expect(error.message).toContain(contentType);
      });
    });
  });

  describe("Error Type Guards", () => {
    it("should differentiate between error types", () => {
      const notFound = new MediaNotFoundError("media1");
      const processing = new MediaProcessingError("operation", "reason");
      const unsupported = new UnsupportedMediaTypeError("video/mkv");

      expect(notFound.code).toBe(ErrorCode.FILE_NOT_FOUND);
      expect(processing.code).toBe(ErrorCode.UPLOAD_FAILED);
      expect(unsupported.code).toBe(ErrorCode.INVALID_FILE_TYPE);
    });

    it("should have correct status codes", () => {
      const notFound = new MediaNotFoundError("media1");
      const processing = new MediaProcessingError("operation", "reason");
      const unsupported = new UnsupportedMediaTypeError("video/mkv");

      expect(notFound.status).toBe(404);
      expect(processing.status).toBe(500);
      expect(unsupported.status).toBe(415);
    });

    it("should only mark processing error as retryable", () => {
      const notFound = new MediaNotFoundError("media1");
      const processing = new MediaProcessingError("operation", "reason");
      const unsupported = new UnsupportedMediaTypeError("video/mkv");

      expect(notFound.retryable).toBe(false);
      expect(processing.retryable).toBe(true);
      expect(unsupported.retryable).toBe(false);
    });

    it("should extend DomainError", () => {
      const notFound = new MediaNotFoundError("media1");
      const processing = new MediaProcessingError("operation", "reason");
      const unsupported = new UnsupportedMediaTypeError("video/mkv");

      expect(notFound).toBeInstanceOf(Error);
      expect(processing).toBeInstanceOf(Error);
      expect(unsupported).toBeInstanceOf(Error);
    });
  });
});
