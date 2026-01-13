import { describe, it, expect } from "vitest";
import { ErrorCode } from "@unisane/kernel";
import {
  AiProviderError,
  AiRateLimitError,
  AiTokenLimitError,
  AiModelNotFoundError,
  ContentModerationError,
} from "../domain/errors";

describe("AI Errors", () => {
  describe("AiProviderError", () => {
    it("should create error with provider and reason", () => {
      const error = new AiProviderError("openai", "API timeout");

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.AI_REQUEST_FAILED);
      expect(error.status).toBe(500);
      expect(error.message).toContain("openai");
      expect(error.message).toContain("API timeout");
      expect(error.name).toBe("AiProviderError");
    });

    it("should be retryable", () => {
      const error = new AiProviderError("anthropic", "Network error");

      expect(error.retryable).toBe(true);
    });
  });

  describe("AiRateLimitError", () => {
    it("should create error with retry time", () => {
      const error = new AiRateLimitError(60000);

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.AI_QUOTA_EXCEEDED);
      expect(error.status).toBe(429);
      expect(error.message).toContain("60000");
      expect(error.name).toBe("AiRateLimitError");
    });

    it("should be retryable", () => {
      const error = new AiRateLimitError(30000);

      expect(error.retryable).toBe(true);
    });
  });

  describe("AiTokenLimitError", () => {
    it("should create error with token counts", () => {
      const error = new AiTokenLimitError(8000, 4096);

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.AI_QUOTA_EXCEEDED);
      expect(error.status).toBe(400);
      expect(error.message).toContain("8000");
      expect(error.message).toContain("4096");
      expect(error.name).toBe("AiTokenLimitError");
    });

    it("should not be retryable", () => {
      const error = new AiTokenLimitError(5000, 4000);

      expect(error.retryable).toBe(false);
    });
  });

  describe("AiModelNotFoundError", () => {
    it("should create error with model name", () => {
      const error = new AiModelNotFoundError("gpt-5");

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.MODEL_NOT_FOUND);
      expect(error.status).toBe(404);
      expect(error.message).toContain("gpt-5");
      expect(error.name).toBe("AiModelNotFoundError");
    });

    it("should not be retryable", () => {
      const error = new AiModelNotFoundError("invalid-model");

      expect(error.retryable).toBe(false);
    });
  });

  describe("ContentModerationError", () => {
    it("should create error with reason", () => {
      const error = new ContentModerationError("Contains prohibited content");

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.CONTENT_MODERATION_FAILED);
      expect(error.status).toBe(400);
      expect(error.message).toContain("prohibited content");
      expect(error.name).toBe("ContentModerationError");
    });

    it("should not be retryable", () => {
      const error = new ContentModerationError("Unsafe content detected");

      expect(error.retryable).toBe(false);
    });
  });

  describe("Error Type Guards", () => {
    it("should differentiate between error types", () => {
      const provider = new AiProviderError("openai", "error");
      const rateLimit = new AiRateLimitError(60000);
      const tokenLimit = new AiTokenLimitError(8000, 4096);
      const modelNotFound = new AiModelNotFoundError("gpt-5");
      const moderation = new ContentModerationError("flagged");

      expect(provider.code).toBe(ErrorCode.AI_REQUEST_FAILED);
      expect(rateLimit.code).toBe(ErrorCode.AI_QUOTA_EXCEEDED);
      expect(tokenLimit.code).toBe(ErrorCode.AI_QUOTA_EXCEEDED);
      expect(modelNotFound.code).toBe(ErrorCode.MODEL_NOT_FOUND);
      expect(moderation.code).toBe(ErrorCode.CONTENT_MODERATION_FAILED);
    });

    it("should have correct status codes", () => {
      const provider = new AiProviderError("openai", "error");
      const rateLimit = new AiRateLimitError(60000);
      const tokenLimit = new AiTokenLimitError(8000, 4096);
      const modelNotFound = new AiModelNotFoundError("gpt-5");
      const moderation = new ContentModerationError("flagged");

      expect(provider.status).toBe(500);
      expect(rateLimit.status).toBe(429);
      expect(tokenLimit.status).toBe(400);
      expect(modelNotFound.status).toBe(404);
      expect(moderation.status).toBe(400);
    });

    it("should only mark provider and rate limit errors as retryable", () => {
      const provider = new AiProviderError("openai", "error");
      const rateLimit = new AiRateLimitError(60000);
      const tokenLimit = new AiTokenLimitError(8000, 4096);
      const modelNotFound = new AiModelNotFoundError("gpt-5");
      const moderation = new ContentModerationError("flagged");

      expect(provider.retryable).toBe(true);
      expect(rateLimit.retryable).toBe(true);
      expect(tokenLimit.retryable).toBe(false);
      expect(modelNotFound.retryable).toBe(false);
      expect(moderation.retryable).toBe(false);
    });
  });
});
