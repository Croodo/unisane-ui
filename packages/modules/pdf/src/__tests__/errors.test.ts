import { describe, it, expect } from "vitest";
import { ErrorCode } from "@unisane/kernel";
import {
  PdfGenerationError,
  TemplateNotFoundError,
  InvalidTemplateError,
} from "../domain/errors";

describe("PDF Errors", () => {
  describe("PdfGenerationError", () => {
    it("should create error with reason", () => {
      const error = new PdfGenerationError("Invalid HTML syntax");

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.status).toBe(500);
      expect(error.message).toContain("Invalid HTML syntax");
      expect(error.name).toBe("PdfGenerationError");
    });

    it("should be retryable", () => {
      const error = new PdfGenerationError("Temporary service unavailable");

      expect(error.retryable).toBe(true);
    });

    it("should include reason in message", () => {
      const error = new PdfGenerationError("Chromium process crashed");

      expect(error.message).toMatch(/Chromium process crashed/);
    });
  });

  describe("TemplateNotFoundError", () => {
    it("should create error with template ID", () => {
      const error = new TemplateNotFoundError("invoice-template");

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.status).toBe(404);
      expect(error.message).toContain("invoice-template");
      expect(error.name).toBe("TemplateNotFoundError");
    });

    it("should not be retryable", () => {
      const error = new TemplateNotFoundError("template123");

      expect(error.retryable).toBe(false);
    });

    it("should include template ID in message", () => {
      const error = new TemplateNotFoundError("receipt-v2");

      expect(error.message).toMatch(/receipt-v2/);
    });
  });

  describe("InvalidTemplateError", () => {
    it("should create error with reason", () => {
      const error = new InvalidTemplateError("Missing required variable");

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.status).toBe(400);
      expect(error.message).toContain("Missing required variable");
      expect(error.name).toBe("InvalidTemplateError");
    });

    it("should not be retryable", () => {
      const error = new InvalidTemplateError("Syntax error in template");

      expect(error.retryable).toBe(false);
    });

    it("should include reason in message", () => {
      const error = new InvalidTemplateError("Unsupported template format");

      expect(error.message).toMatch(/Unsupported template format/);
    });
  });

  describe("Error Type Guards", () => {
    it("should differentiate between error types", () => {
      const generation = new PdfGenerationError("error");
      const notFound = new TemplateNotFoundError("template1");
      const invalid = new InvalidTemplateError("reason");

      expect(generation.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(notFound.code).toBe(ErrorCode.NOT_FOUND);
      expect(invalid.code).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it("should have correct status codes", () => {
      const generation = new PdfGenerationError("error");
      const notFound = new TemplateNotFoundError("template1");
      const invalid = new InvalidTemplateError("reason");

      expect(generation.status).toBe(500);
      expect(notFound.status).toBe(404);
      expect(invalid.status).toBe(400);
    });

    it("should only mark generation errors as retryable", () => {
      const generation = new PdfGenerationError("error");
      const notFound = new TemplateNotFoundError("template1");
      const invalid = new InvalidTemplateError("reason");

      expect(generation.retryable).toBe(true);
      expect(notFound.retryable).toBe(false);
      expect(invalid.retryable).toBe(false);
    });
  });
});
