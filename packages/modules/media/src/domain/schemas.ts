import { z } from "zod";
import { MEDIA_FORMATS, MEDIA_PRESETS } from "@unisane/kernel";

// ──────────────────────────────────────────────────────────────────────────────
// Base Enums
// ──────────────────────────────────────────────────────────────────────────────

export const ZMediaFormat = z.enum([
  MEDIA_FORMATS.JPEG,
  MEDIA_FORMATS.PNG,
  MEDIA_FORMATS.WEBP,
  MEDIA_FORMATS.AVIF,
  MEDIA_FORMATS.GIF,
  MEDIA_FORMATS.HEIC,
  MEDIA_FORMATS.HEIF,
  MEDIA_FORMATS.TIFF,
  MEDIA_FORMATS.BMP,
]);

export const ZMediaPreset = z.enum([
  "AVATAR_SM",
  "AVATAR_MD",
  "AVATAR_LG",
  "THUMBNAIL",
  "PREVIEW",
  "BANNER",
  "LOGO",
] as const);

export const ZFitMode = z.enum([
  "cover", // Crop to fill (default)
  "contain", // Fit within bounds, may letterbox
  "fill", // Stretch to fill
  "inside", // Fit inside, preserve aspect
  "outside", // Fit outside, may exceed bounds
]);

export const ZGravity = z.enum([
  "center",
  "north",
  "northeast",
  "east",
  "southeast",
  "south",
  "southwest",
  "west",
  "northwest",
  "smart", // AI-detected focal point
  "attention", // Focus on attention area
  "entropy", // Focus on high entropy area
]);

// ──────────────────────────────────────────────────────────────────────────────
// Transform Schemas
// ──────────────────────────────────────────────────────────────────────────────

export const ZTransformRequest = z.object({
  // Dimensions
  width: z.number().int().min(1).max(4096).optional(),
  height: z.number().int().min(1).max(4096).optional(),

  // Output
  format: ZMediaFormat.optional(),
  quality: z.number().int().min(1).max(100).optional().default(80),

  // Resize behavior
  fit: ZFitMode.optional().default("cover"),
  gravity: ZGravity.optional().default("center"),
  background: z
    .string()
    .regex(/^#[0-9a-fA-F]{6,8}$/)
    .optional(), // RGBA hex

  // Crop (explicit region)
  crop: z
    .object({
      x: z.number().int().min(0),
      y: z.number().int().min(0),
      width: z.number().int().min(1),
      height: z.number().int().min(1),
    })
    .optional(),

  // Focal point (0-1 normalized coordinates)
  focalPoint: z
    .object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
    })
    .optional(),

  // Effects
  blur: z.number().min(0.3).max(100).optional(),
  sharpen: z.boolean().optional(),
  grayscale: z.boolean().optional(),
  rotate: z.number().int().min(-360).max(360).optional(),
  flip: z.boolean().optional(),
  flop: z.boolean().optional(), // horizontal flip

  // Preset (overrides individual settings)
  preset: ZMediaPreset.optional(),

  // Strip metadata for privacy
  stripMetadata: z.boolean().optional().default(true),
});

export const ZTransformResponse = z.object({
  url: z.string(),
  width: z.number(),
  height: z.number(),
  format: z.string(),
  sizeBytes: z.number(),
  contentType: z.string(),
});

// ──────────────────────────────────────────────────────────────────────────────
// Avatar Schemas
// ──────────────────────────────────────────────────────────────────────────────

export const ZAvatarRequest = z.object({
  initials: z.string().min(1).max(3),
  preset: ZMediaPreset.optional().default("AVATAR_MD"),
  backgroundColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  textColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .default("#ffffff"),
  fontWeight: z
    .enum(["normal", "medium", "semibold", "bold"])
    .optional()
    .default("medium"),
  rounded: z.boolean().optional().default(false), // Circle vs square
});

export const ZAvatarResponse = z.object({
  url: z.string(), // Data URL or CDN URL
  initials: z.string(),
  width: z.number(),
  height: z.number(),
  backgroundColor: z.string(),
});

// ──────────────────────────────────────────────────────────────────────────────
// Optimization Schemas
// ──────────────────────────────────────────────────────────────────────────────

export const ZOptimizeRequest = z.object({
  quality: z.number().int().min(1).max(100).optional().default(80),
  format: ZMediaFormat.optional().default("webp"),
  maxWidth: z.number().int().min(1).max(4096).optional(),
  maxHeight: z.number().int().min(1).max(4096).optional(),

  // Progressive loading (JPEG/WebP)
  progressive: z.boolean().optional().default(true),

  // Lossless mode (PNG/WebP)
  lossless: z.boolean().optional().default(false),

  // Target file size (will adjust quality to hit target)
  targetSizeKb: z.number().int().min(1).optional(),
});

export const ZOptimizeResponse = z.object({
  url: z.string(),
  originalSizeBytes: z.number(),
  optimizedSizeBytes: z.number(),
  savings: z.number(), // Percentage reduction
  format: z.string(),
  width: z.number(),
  height: z.number(),
});

// ──────────────────────────────────────────────────────────────────────────────
// Metadata Schemas
// ──────────────────────────────────────────────────────────────────────────────

export const ZImageMetadata = z.object({
  width: z.number(),
  height: z.number(),
  format: z.string(),
  sizeBytes: z.number(),
  hasAlpha: z.boolean().optional(),
  isAnimated: z.boolean().optional(),
  orientation: z.number().optional(), // EXIF orientation
  colorSpace: z.string().optional(),
  density: z.number().optional(), // DPI

  // EXIF data (if available)
  exif: z
    .object({
      make: z.string().optional(),
      model: z.string().optional(),
      dateTaken: z.string().optional(),
      gps: z
        .object({
          latitude: z.number(),
          longitude: z.number(),
        })
        .optional(),
    })
    .optional(),

  // Dominant colors
  dominantColors: z.array(z.string()).optional(),

  // Blur hash for placeholder
  blurHash: z.string().optional(),
});

// ──────────────────────────────────────────────────────────────────────────────
// Batch Processing Schemas
// ──────────────────────────────────────────────────────────────────────────────

export const ZBatchTransformRequest = z.object({
  sourceUrl: z.string().url(),
  variants: z
    .array(
      z.object({
        name: z.string().min(1),
        transform: ZTransformRequest,
      })
    )
    .min(1)
    .max(10),
});

export const ZBatchTransformResponse = z.object({
  sourceUrl: z.string(),
  variants: z.array(
    z.object({
      name: z.string(),
      url: z.string(),
      width: z.number(),
      height: z.number(),
      sizeBytes: z.number(),
    })
  ),
  totalSizeBytes: z.number(),
  processingTimeMs: z.number(),
});

// ──────────────────────────────────────────────────────────────────────────────
// Watermark Schemas
// ──────────────────────────────────────────────────────────────────────────────

export const ZWatermarkRequest = z.object({
  // Text watermark
  text: z.string().max(100).optional(),
  textSize: z.number().int().min(8).max(200).optional().default(24),
  textColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6,8}$/)
    .optional()
    .default("#ffffff80"),
  textFont: z.string().optional(),

  // Image watermark (overlay)
  overlayUrl: z.string().url().optional(),
  overlayOpacity: z.number().min(0).max(1).optional().default(0.5),
  overlayScale: z.number().min(0.01).max(1).optional().default(0.2), // Relative to image

  // Position
  position: ZGravity.optional().default("southeast"),
  margin: z.number().int().min(0).max(500).optional().default(20),

  // Tiling (repeat watermark)
  tile: z.boolean().optional().default(false),
});

// ──────────────────────────────────────────────────────────────────────────────
// Upload Processing Schemas (for storage integration)
// ──────────────────────────────────────────────────────────────────────────────

export const ZProcessUploadRequest = z.object({
  fileId: z.string(),

  // Auto-generate variants
  generateVariants: z.array(ZMediaPreset).optional(),

  // Optimize original
  optimize: z.boolean().optional().default(true),
  optimizeOptions: ZOptimizeRequest.optional(),

  // Extract metadata
  extractMetadata: z.boolean().optional().default(true),

  // Generate blur hash placeholder
  generateBlurHash: z.boolean().optional().default(true),

  // NSFW/content moderation (if AI available)
  moderateContent: z.boolean().optional().default(false),
});

export const ZProcessUploadResponse = z.object({
  fileId: z.string(),
  metadata: ZImageMetadata.optional(),
  variants: z.record(z.string(), ZTransformResponse).optional(),
  blurHash: z.string().optional(),
  moderation: z
    .object({
      safe: z.boolean(),
      flags: z.array(z.string()),
    })
    .optional(),
});

// ──────────────────────────────────────────────────────────────────────────────
// CDN/URL Schemas
// ──────────────────────────────────────────────────────────────────────────────

export const ZCdnUrlRequest = z.object({
  fileKey: z.string(),
  transform: ZTransformRequest.optional(),

  // CDN options
  cacheTtl: z.number().int().min(0).optional(), // Seconds
  signed: z.boolean().optional().default(false),
  expiresIn: z.number().int().min(60).optional(), // Seconds for signed URLs
});

export const ZCdnUrlResponse = z.object({
  url: z.string(),
  cdnUrl: z.string().optional(), // If different from storage URL
  expiresAt: z.number().optional().describe("Unix timestamp in ms"),
  cacheControl: z.string().optional(),
});
