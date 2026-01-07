import type { MediaFormat, MediaPreset } from "@unisane/kernel";
import type { z } from "zod";
import type {
  ZTransformRequest,
  ZAvatarRequest,
  ZOptimizeRequest,
  ZImageMetadata,
  ZBatchTransformRequest,
  ZWatermarkRequest,
  ZProcessUploadRequest,
  ZCdnUrlRequest,
} from "./schemas";

// ──────────────────────────────────────────────────────────────────────────────
// Core Types (input types - all optional for flexibility)
// ──────────────────────────────────────────────────────────────────────────────

export type TransformOptions = z.input<typeof ZTransformRequest>;
export type AvatarOptions = z.input<typeof ZAvatarRequest>;
export type OptimizeOptions = z.input<typeof ZOptimizeRequest>;
export type ImageMetadataType = z.infer<typeof ZImageMetadata>;
export type BatchTransformInput = z.infer<typeof ZBatchTransformRequest>;
export type WatermarkOptions = z.infer<typeof ZWatermarkRequest>;
export type ProcessUploadInput = z.infer<typeof ZProcessUploadRequest>;
export type CdnUrlOptions = z.infer<typeof ZCdnUrlRequest>;

// ──────────────────────────────────────────────────────────────────────────────
// Result Types
// ──────────────────────────────────────────────────────────────────────────────

export type TransformResult = {
  buffer: Buffer;
  format: MediaFormat;
  width: number;
  height: number;
  sizeBytes: number;
  contentType: string;
};

export type OptimizeResult = {
  buffer: Buffer;
  originalSizeBytes: number;
  optimizedSizeBytes: number;
  savings: number; // Percentage
  format: MediaFormat;
  width: number;
  height: number;
};

export type AvatarResult = {
  svg: string;
  dataUrl: string;
  width: number;
  height: number;
  backgroundColor: string;
};

export type ImageMetadata = {
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
  hasAlpha?: boolean;
  isAnimated?: boolean;
  orientation?: number;
  colorSpace?: string;
  density?: number;
  exif?: {
    make?: string;
    model?: string;
    dateTaken?: string;
    gps?: { latitude: number; longitude: number };
  };
  dominantColors?: string[];
  blurHash?: string;
};

export type ProcessedImage = {
  original: ImageMetadata;
  variants: Record<
    string,
    {
      url: string;
      width: number;
      height: number;
      sizeBytes: number;
      format: string;
    }
  >;
  blurHash?: string;
  moderation?: {
    safe: boolean;
    flags: string[];
  };
};

// ──────────────────────────────────────────────────────────────────────────────
// Fit & Gravity Types
// ──────────────────────────────────────────────────────────────────────────────

export type FitMode = "cover" | "contain" | "fill" | "inside" | "outside";

export type Gravity =
  | "center"
  | "north"
  | "northeast"
  | "east"
  | "southeast"
  | "south"
  | "southwest"
  | "west"
  | "northwest"
  | "smart"
  | "attention"
  | "entropy";

// ──────────────────────────────────────────────────────────────────────────────
// Crop & Focal Point
// ──────────────────────────────────────────────────────────────────────────────

export type CropRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FocalPoint = {
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
};

// ──────────────────────────────────────────────────────────────────────────────
// CDN Types
// ──────────────────────────────────────────────────────────────────────────────

export type CdnUrl = {
  url: string;
  cdnUrl?: string;
  expiresAt?: number;
  cacheControl?: string;
};

// ──────────────────────────────────────────────────────────────────────────────
// Batch Processing Types
// ──────────────────────────────────────────────────────────────────────────────

export type BatchVariant = {
  name: string;
  url: string;
  width: number;
  height: number;
  sizeBytes: number;
};

export type BatchResult = {
  sourceUrl: string;
  variants: BatchVariant[];
  totalSizeBytes: number;
  processingTimeMs: number;
};

// ──────────────────────────────────────────────────────────────────────────────
// Service Function Types
// ──────────────────────────────────────────────────────────────────────────────

export type TransformFn = (
  buffer: Buffer,
  options: TransformOptions
) => Promise<TransformResult>;

export type OptimizeFn = (
  buffer: Buffer,
  options?: OptimizeOptions
) => Promise<OptimizeResult>;

export type GetMetadataFn = (buffer: Buffer) => Promise<ImageMetadata>;
