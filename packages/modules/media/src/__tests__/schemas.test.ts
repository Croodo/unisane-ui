import { describe, it, expect } from "vitest";
import {
  ZMediaFormat,
  ZMediaPreset,
  ZFitMode,
  ZGravity,
  ZTransformRequest,
  ZTransformResponse,
  ZAvatarRequest,
  ZAvatarResponse,
  ZOptimizeRequest,
  ZOptimizeResponse,
  ZImageMetadata,
  ZBatchTransformRequest,
  ZBatchTransformResponse,
  ZWatermarkRequest,
  ZProcessUploadRequest,
  ZProcessUploadResponse,
  ZCdnUrlRequest,
  ZCdnUrlResponse,
} from "../domain/schemas";

describe("Media Schemas", () => {
  describe("ZMediaFormat", () => {
    it("should accept valid image formats", () => {
      const formats = ["jpeg", "png", "webp", "avif", "gif"];

      formats.forEach((format) => {
        const result = ZMediaFormat.safeParse(format);
        expect(result.success).toBe(true);
      });
    });

    it("should accept additional formats", () => {
      const formats = ["heic", "heif", "tiff", "bmp"];

      formats.forEach((format) => {
        const result = ZMediaFormat.safeParse(format);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid formats", () => {
      const result = ZMediaFormat.safeParse("invalid");
      expect(result.success).toBe(false);
    });
  });

  describe("ZMediaPreset", () => {
    it("should accept avatar presets", () => {
      const presets = ["AVATAR_SM", "AVATAR_MD", "AVATAR_LG"];

      presets.forEach((preset) => {
        const result = ZMediaPreset.safeParse(preset);
        expect(result.success).toBe(true);
      });
    });

    it("should accept other presets", () => {
      const presets = ["THUMBNAIL", "PREVIEW", "BANNER", "LOGO"];

      presets.forEach((preset) => {
        const result = ZMediaPreset.safeParse(preset);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid presets", () => {
      const result = ZMediaPreset.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("ZFitMode", () => {
    it("should accept all fit modes", () => {
      const modes = ["cover", "contain", "fill", "inside", "outside"];

      modes.forEach((mode) => {
        const result = ZFitMode.safeParse(mode);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid fit modes", () => {
      const result = ZFitMode.safeParse("stretch");
      expect(result.success).toBe(false);
    });
  });

  describe("ZGravity", () => {
    it("should accept directional gravities", () => {
      const gravities = [
        "center",
        "north",
        "northeast",
        "east",
        "southeast",
        "south",
        "southwest",
        "west",
        "northwest",
      ];

      gravities.forEach((gravity) => {
        const result = ZGravity.safeParse(gravity);
        expect(result.success).toBe(true);
      });
    });

    it("should accept smart gravities", () => {
      const gravities = ["smart", "attention", "entropy"];

      gravities.forEach((gravity) => {
        const result = ZGravity.safeParse(gravity);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid gravity", () => {
      const result = ZGravity.safeParse("top");
      expect(result.success).toBe(false);
    });
  });

  describe("ZTransformRequest", () => {
    it("should accept transform with dimensions only", () => {
      const result = ZTransformRequest.safeParse({
        width: 800,
        height: 600,
      });

      expect(result.success).toBe(true);
    });

    it("should accept transform with format and quality", () => {
      const result = ZTransformRequest.safeParse({
        width: 1200,
        format: "webp",
        quality: 85,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quality).toBe(85);
      }
    });

    it("should default quality to 80", () => {
      const result = ZTransformRequest.safeParse({
        width: 800,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quality).toBe(80);
      }
    });

    it("should accept fit and gravity options", () => {
      const result = ZTransformRequest.safeParse({
        width: 500,
        height: 500,
        fit: "contain",
        gravity: "smart",
      });

      expect(result.success).toBe(true);
    });

    it("should accept crop region", () => {
      const result = ZTransformRequest.safeParse({
        crop: {
          x: 100,
          y: 100,
          width: 400,
          height: 400,
        },
      });

      expect(result.success).toBe(true);
    });

    it("should accept focal point", () => {
      const result = ZTransformRequest.safeParse({
        focalPoint: {
          x: 0.5,
          y: 0.5,
        },
      });

      expect(result.success).toBe(true);
    });

    it("should accept effects", () => {
      const result = ZTransformRequest.safeParse({
        blur: 5,
        sharpen: true,
        grayscale: true,
        rotate: 90,
        flip: true,
        flop: false,
      });

      expect(result.success).toBe(true);
    });

    it("should accept background color in hex format", () => {
      const result = ZTransformRequest.safeParse({
        background: "#ffffff",
      });

      expect(result.success).toBe(true);
    });

    it("should accept background color with alpha", () => {
      const result = ZTransformRequest.safeParse({
        background: "#ffffff80",
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid background color format", () => {
      const result = ZTransformRequest.safeParse({
        background: "white",
      });

      expect(result.success).toBe(false);
    });

    it("should accept preset", () => {
      const result = ZTransformRequest.safeParse({
        preset: "THUMBNAIL",
      });

      expect(result.success).toBe(true);
    });

    it("should default stripMetadata to true", () => {
      const result = ZTransformRequest.safeParse({
        width: 800,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stripMetadata).toBe(true);
      }
    });

    it("should reject dimensions outside limits", () => {
      const resultTooLarge = ZTransformRequest.safeParse({
        width: 5000,
      });
      expect(resultTooLarge.success).toBe(false);

      const resultZero = ZTransformRequest.safeParse({
        width: 0,
      });
      expect(resultZero.success).toBe(false);
    });

    it("should reject invalid quality values", () => {
      const resultTooHigh = ZTransformRequest.safeParse({
        quality: 101,
      });
      expect(resultTooHigh.success).toBe(false);

      const resultZero = ZTransformRequest.safeParse({
        quality: 0,
      });
      expect(resultZero.success).toBe(false);
    });
  });

  describe("ZTransformResponse", () => {
    it("should accept valid transform response", () => {
      const result = ZTransformResponse.safeParse({
        url: "https://cdn.example.com/image.webp",
        width: 800,
        height: 600,
        format: "webp",
        sizeBytes: 50000,
        contentType: "image/webp",
      });

      expect(result.success).toBe(true);
    });

    it("should require all fields", () => {
      const result = ZTransformResponse.safeParse({
        url: "https://cdn.example.com/image.webp",
        width: 800,
        height: 600,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("ZAvatarRequest", () => {
    it("should accept valid avatar request with minimal fields", () => {
      const result = ZAvatarRequest.safeParse({
        initials: "AB",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.preset).toBe("AVATAR_MD");
        expect(result.data.textColor).toBe("#ffffff");
        expect(result.data.fontWeight).toBe("medium");
        expect(result.data.rounded).toBe(false);
      }
    });

    it("should accept 1-3 character initials", () => {
      const validInitials = ["A", "AB", "ABC"];

      validInitials.forEach((initials) => {
        const result = ZAvatarRequest.safeParse({ initials });
        expect(result.success).toBe(true);
      });
    });

    it("should reject empty or too long initials", () => {
      const invalidInitials = ["", "ABCD"];

      invalidInitials.forEach((initials) => {
        const result = ZAvatarRequest.safeParse({ initials });
        expect(result.success).toBe(false);
      });
    });

    it("should accept custom colors", () => {
      const result = ZAvatarRequest.safeParse({
        initials: "JD",
        backgroundColor: "#3f51b5",
        textColor: "#ffffff",
      });

      expect(result.success).toBe(true);
    });

    it("should accept font weight options", () => {
      const weights = ["normal", "medium", "semibold", "bold"];

      weights.forEach((fontWeight) => {
        const result = ZAvatarRequest.safeParse({
          initials: "AB",
          fontWeight,
        });
        expect(result.success).toBe(true);
      });
    });

    it("should accept rounded option", () => {
      const result = ZAvatarRequest.safeParse({
        initials: "AB",
        rounded: true,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("ZAvatarResponse", () => {
    it("should accept valid avatar response", () => {
      const result = ZAvatarResponse.safeParse({
        url: "data:image/svg+xml;base64,PHN2Zy4uLg==",
        initials: "AB",
        width: 96,
        height: 96,
        backgroundColor: "#3f51b5",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("ZOptimizeRequest", () => {
    it("should accept optimization with defaults", () => {
      const result = ZOptimizeRequest.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quality).toBe(80);
        expect(result.data.format).toBe("webp");
        expect(result.data.progressive).toBe(true);
        expect(result.data.lossless).toBe(false);
      }
    });

    it("should accept custom quality and format", () => {
      const result = ZOptimizeRequest.safeParse({
        quality: 90,
        format: "avif",
      });

      expect(result.success).toBe(true);
    });

    it("should accept max dimensions", () => {
      const result = ZOptimizeRequest.safeParse({
        maxWidth: 1920,
        maxHeight: 1080,
      });

      expect(result.success).toBe(true);
    });

    it("should accept lossless mode", () => {
      const result = ZOptimizeRequest.safeParse({
        format: "png",
        lossless: true,
      });

      expect(result.success).toBe(true);
    });

    it("should accept target file size", () => {
      const result = ZOptimizeRequest.safeParse({
        targetSizeKb: 100,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("ZOptimizeResponse", () => {
    it("should accept valid optimize response", () => {
      const result = ZOptimizeResponse.safeParse({
        url: "https://cdn.example.com/optimized.webp",
        originalSizeBytes: 500000,
        optimizedSizeBytes: 150000,
        savings: 70,
        format: "webp",
        width: 1200,
        height: 800,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("ZImageMetadata", () => {
    it("should accept basic metadata", () => {
      const result = ZImageMetadata.safeParse({
        width: 1920,
        height: 1080,
        format: "jpeg",
        sizeBytes: 500000,
      });

      expect(result.success).toBe(true);
    });

    it("should accept optional alpha and animation flags", () => {
      const result = ZImageMetadata.safeParse({
        width: 800,
        height: 600,
        format: "png",
        sizeBytes: 200000,
        hasAlpha: true,
        isAnimated: false,
      });

      expect(result.success).toBe(true);
    });

    it("should accept EXIF data", () => {
      const result = ZImageMetadata.safeParse({
        width: 4032,
        height: 3024,
        format: "jpeg",
        sizeBytes: 3000000,
        orientation: 1,
        exif: {
          make: "Apple",
          model: "iPhone 13 Pro",
          dateTaken: "2024-01-15T10:30:00Z",
          gps: {
            latitude: 37.7749,
            longitude: -122.4194,
          },
        },
      });

      expect(result.success).toBe(true);
    });

    it("should accept dominant colors", () => {
      const result = ZImageMetadata.safeParse({
        width: 800,
        height: 600,
        format: "webp",
        sizeBytes: 100000,
        dominantColors: ["#3f51b5", "#f44336", "#4caf50"],
      });

      expect(result.success).toBe(true);
    });

    it("should accept blur hash", () => {
      const result = ZImageMetadata.safeParse({
        width: 800,
        height: 600,
        format: "jpeg",
        sizeBytes: 150000,
        blurHash: "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("ZBatchTransformRequest", () => {
    it("should accept batch transform with multiple variants", () => {
      const result = ZBatchTransformRequest.safeParse({
        sourceUrl: "https://cdn.example.com/original.jpg",
        variants: [
          {
            name: "thumbnail",
            transform: { width: 150, height: 150 },
          },
          {
            name: "preview",
            transform: { width: 400, height: 400 },
          },
        ],
      });

      expect(result.success).toBe(true);
    });

    it("should reject empty variants", () => {
      const result = ZBatchTransformRequest.safeParse({
        sourceUrl: "https://cdn.example.com/original.jpg",
        variants: [],
      });

      expect(result.success).toBe(false);
    });

    it("should reject more than 10 variants", () => {
      const variants = Array.from({ length: 11 }, (_, i) => ({
        name: `variant-${i}`,
        transform: { width: 100 },
      }));

      const result = ZBatchTransformRequest.safeParse({
        sourceUrl: "https://cdn.example.com/original.jpg",
        variants,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("ZBatchTransformResponse", () => {
    it("should accept valid batch transform response", () => {
      const result = ZBatchTransformResponse.safeParse({
        sourceUrl: "https://cdn.example.com/original.jpg",
        variants: [
          {
            name: "thumbnail",
            url: "https://cdn.example.com/thumb.webp",
            width: 150,
            height: 150,
            sizeBytes: 5000,
          },
          {
            name: "preview",
            url: "https://cdn.example.com/preview.webp",
            width: 400,
            height: 400,
            sizeBytes: 25000,
          },
        ],
        totalSizeBytes: 30000,
        processingTimeMs: 1500,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("ZWatermarkRequest", () => {
    it("should accept text watermark", () => {
      const result = ZWatermarkRequest.safeParse({
        text: "Copyright 2024",
        textSize: 32,
        textColor: "#ffffff80",
      });

      expect(result.success).toBe(true);
    });

    it("should accept image overlay watermark", () => {
      const result = ZWatermarkRequest.safeParse({
        overlayUrl: "https://cdn.example.com/logo.png",
        overlayOpacity: 0.7,
        overlayScale: 0.15,
      });

      expect(result.success).toBe(true);
    });

    it("should accept position and margin", () => {
      const result = ZWatermarkRequest.safeParse({
        text: "Sample",
        position: "southeast",
        margin: 30,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.position).toBe("southeast");
        expect(result.data.margin).toBe(30);
      }
    });

    it("should accept tiling option", () => {
      const result = ZWatermarkRequest.safeParse({
        text: "CONFIDENTIAL",
        tile: true,
      });

      expect(result.success).toBe(true);
    });

    it("should default tile to false", () => {
      const result = ZWatermarkRequest.safeParse({
        text: "Sample",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tile).toBe(false);
      }
    });
  });

  describe("ZProcessUploadRequest", () => {
    it("should accept basic process request", () => {
      const result = ZProcessUploadRequest.safeParse({
        fileId: "file123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.optimize).toBe(true);
        expect(result.data.extractMetadata).toBe(true);
        expect(result.data.generateBlurHash).toBe(true);
        expect(result.data.moderateContent).toBe(false);
      }
    });

    it("should accept variant generation", () => {
      const result = ZProcessUploadRequest.safeParse({
        fileId: "file123",
        generateVariants: ["THUMBNAIL", "PREVIEW"],
      });

      expect(result.success).toBe(true);
    });

    it("should accept optimize options", () => {
      const result = ZProcessUploadRequest.safeParse({
        fileId: "file123",
        optimize: true,
        optimizeOptions: {
          quality: 85,
          format: "webp",
        },
      });

      expect(result.success).toBe(true);
    });

    it("should accept content moderation flag", () => {
      const result = ZProcessUploadRequest.safeParse({
        fileId: "file123",
        moderateContent: true,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("ZProcessUploadResponse", () => {
    it("should accept process response with all optional fields", () => {
      const result = ZProcessUploadResponse.safeParse({
        fileId: "file123",
        metadata: {
          width: 1920,
          height: 1080,
          format: "jpeg",
          sizeBytes: 500000,
        },
        variants: {
          thumbnail: {
            url: "https://cdn.example.com/thumb.webp",
            width: 150,
            height: 150,
            format: "webp",
            sizeBytes: 5000,
            contentType: "image/webp",
          },
        },
        blurHash: "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
        moderation: {
          safe: true,
          flags: [],
        },
      });

      expect(result.success).toBe(true);
    });

    it("should accept minimal process response", () => {
      const result = ZProcessUploadResponse.safeParse({
        fileId: "file123",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("ZCdnUrlRequest", () => {
    it("should accept basic CDN URL request", () => {
      const result = ZCdnUrlRequest.safeParse({
        fileKey: "uploads/image.jpg",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.signed).toBe(false);
      }
    });

    it("should accept transform options", () => {
      const result = ZCdnUrlRequest.safeParse({
        fileKey: "uploads/image.jpg",
        transform: {
          width: 800,
          format: "webp",
        },
      });

      expect(result.success).toBe(true);
    });

    it("should accept signed URL options", () => {
      const result = ZCdnUrlRequest.safeParse({
        fileKey: "uploads/private.jpg",
        signed: true,
        expiresIn: 3600,
      });

      expect(result.success).toBe(true);
    });

    it("should accept cache TTL", () => {
      const result = ZCdnUrlRequest.safeParse({
        fileKey: "uploads/image.jpg",
        cacheTtl: 86400,
      });

      expect(result.success).toBe(true);
    });

    it("should reject expiresIn less than 60 seconds", () => {
      const result = ZCdnUrlRequest.safeParse({
        fileKey: "uploads/image.jpg",
        signed: true,
        expiresIn: 30,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("ZCdnUrlResponse", () => {
    it("should accept basic CDN URL response", () => {
      const result = ZCdnUrlResponse.safeParse({
        url: "https://storage.example.com/uploads/image.jpg",
      });

      expect(result.success).toBe(true);
    });

    it("should accept CDN URL with all optional fields", () => {
      const result = ZCdnUrlResponse.safeParse({
        url: "https://storage.example.com/uploads/image.jpg",
        cdnUrl: "https://cdn.example.com/image.jpg",
        expiresAt: Date.now() + 3600000,
        cacheControl: "public, max-age=86400",
      });

      expect(result.success).toBe(true);
    });
  });
});
