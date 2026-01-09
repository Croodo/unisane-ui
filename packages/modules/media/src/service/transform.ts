import type {
  TransformOptions,
  TransformResult,
  ImageMetadata,
} from "../domain/types";
import type { MediaFormat, MediaPreset } from "@unisane/kernel";
import { MEDIA_PRESETS, MEDIA_LIMITS } from "@unisane/kernel";
import { ERR } from "@unisane/gateway";

const MAX_INPUT_SIZE_BYTES = MEDIA_LIMITS.MAX_INPUT_SIZE_MB * 1024 * 1024;
const MAX_PIXEL_COUNT = MEDIA_LIMITS.MAX_WIDTH * MEDIA_LIMITS.MAX_HEIGHT;

let sharpModule: typeof import("sharp") | null = null;
let sharpLoadAttempted = false;

async function getSharp(): Promise<typeof import("sharp") | null> {
  if (sharpLoadAttempted) return sharpModule;
  sharpLoadAttempted = true;
  try {
    sharpModule = (await import("sharp"))
      .default as unknown as typeof import("sharp");
  } catch {
    sharpModule = null;
  }
  return sharpModule;
}

export function isSharpAvailable(): Promise<boolean> {
  return getSharp().then((s) => s !== null);
}

function validateInputSize(buffer: Buffer): void {
  if (buffer.length > MAX_INPUT_SIZE_BYTES) {
    throw ERR.validation(
      `Input size ${(buffer.length / 1024 / 1024).toFixed(1)}MB exceeds max ${MEDIA_LIMITS.MAX_INPUT_SIZE_MB}MB`
    );
  }
}

function validatePixelCount(width: number, height: number): void {
  const pixels = width * height;
  if (pixels > MAX_PIXEL_COUNT) {
    throw ERR.validation(
      `Image dimensions ${width}x${height} exceed max pixel count`
    );
  }
}

export async function getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
  validateInputSize(buffer);

  const sharp = await getSharp();
  if (!sharp) {
    throw ERR.internal("Image processing not available");
  }

  try {
    const image = sharp(buffer, { limitInputPixels: MAX_PIXEL_COUNT });
    const metadata = await image.metadata();

    return {
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      format: metadata.format ?? "unknown",
      sizeBytes: buffer.length,
      ...(metadata.hasAlpha !== undefined
        ? { hasAlpha: metadata.hasAlpha }
        : {}),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("Input buffer") || msg.includes("unsupported")) {
      throw ERR.validation("Invalid or unsupported image format");
    }
    throw ERR.internal(`Image metadata extraction failed: ${msg}`);
  }
}

export async function transformImage(
  buffer: Buffer,
  options: TransformOptions
): Promise<TransformResult> {
  validateInputSize(buffer);

  const sharp = await getSharp();
  if (!sharp) {
    throw ERR.internal("Image processing not available");
  }

  try {
    let image = sharp(buffer, {
      limitInputPixels: MAX_PIXEL_COUNT,
      failOn: "error",
    });

    const inputMeta = await image.metadata();
    if (inputMeta.width && inputMeta.height) {
      validatePixelCount(inputMeta.width, inputMeta.height);
    }

    if (options.width || options.height) {
      const width = Math.min(
        options.width ?? MEDIA_LIMITS.MAX_WIDTH,
        MEDIA_LIMITS.MAX_WIDTH
      );
      const height = Math.min(
        options.height ?? MEDIA_LIMITS.MAX_HEIGHT,
        MEDIA_LIMITS.MAX_HEIGHT
      );

      image = image.resize(width, height, {
        fit: options.fit ?? "cover",
        background: options.background ?? { r: 255, g: 255, b: 255, alpha: 0 },
      });
    }

    let format = options.format ?? "webp";
    const quality = Math.min(
      Math.max(options.quality ?? MEDIA_LIMITS.QUALITY_DEFAULT, 1),
      100
    );

    let outputFormat = format;
    if (format === "heic" || format === "heif") {
      outputFormat = "jpeg";
    }

    switch (outputFormat) {
      case "jpeg":
        image = image.jpeg({ quality });
        break;
      case "png":
        image = image.png({
          compressionLevel: Math.floor((100 - quality) / 10),
        });
        break;
      case "webp":
        image = image.webp({ quality });
        break;
      case "avif":
        image = image.avif({ quality });
        break;
      case "gif":
        image = image.gif();
        break;
      case "tiff":
        image = image.tiff({ quality });
        break;
      case "bmp":
        image = image.png();
        outputFormat = "png";
        break;
    }

    const outputBuffer = await image.toBuffer();
    const outputMetadata = await sharp(outputBuffer).metadata();

    const contentTypeMap: Record<string, string> = {
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      avif: "image/avif",
      gif: "image/gif",
      tiff: "image/tiff",
      heic: "image/heic",
      heif: "image/heif",
      bmp: "image/bmp",
    };

    format = outputFormat;

    return {
      buffer: outputBuffer,
      format,
      width: outputMetadata.width ?? 0,
      height: outputMetadata.height ?? 0,
      sizeBytes: outputBuffer.length,
      contentType: contentTypeMap[format] ?? "application/octet-stream",
    };
  } catch (err) {
    if ((err as { code?: string }).code?.startsWith("ERR_")) throw err;
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (
      msg.includes("Input buffer") ||
      msg.includes("unsupported") ||
      msg.includes("corrupt")
    ) {
      throw ERR.validation("Invalid or corrupt image file");
    }
    throw ERR.internal(`Image transform failed: ${msg}`);
  }
}

export async function transformWithPreset(
  buffer: Buffer,
  preset: MediaPreset
): Promise<TransformResult> {
  const config = MEDIA_PRESETS[preset];
  if (!config) {
    throw ERR.validation(`Invalid preset: ${preset}`);
  }
  return transformImage(buffer, {
    width: config.width,
    height: config.height,
    format: config.format as MediaFormat,
    fit: "cover",
  });
}

export async function optimizeImage(
  buffer: Buffer,
  options?: {
    quality?: number;
    format?: MediaFormat;
    maxWidth?: number;
    maxHeight?: number;
  }
): Promise<TransformResult> {
  validateInputSize(buffer);

  const sharp = await getSharp();
  if (!sharp) {
    throw ERR.internal("Image processing not available");
  }

  const metadata = await sharp(buffer, {
    limitInputPixels: MAX_PIXEL_COUNT,
  }).metadata();
  const currentWidth = metadata.width ?? 0;
  const currentHeight = metadata.height ?? 0;

  const transformOpts: TransformOptions = {
    format: options?.format ?? "webp",
    quality: options?.quality ?? MEDIA_LIMITS.QUALITY_DEFAULT,
  };

  if (options?.maxWidth && currentWidth > options.maxWidth) {
    transformOpts.width = options.maxWidth;
  }
  if (options?.maxHeight && currentHeight > options.maxHeight) {
    transformOpts.height = options.maxHeight;
  }

  return transformImage(buffer, transformOpts);
}

export async function generateVariants(
  buffer: Buffer,
  widths: number[] = [320, 640, 960, 1280]
): Promise<Map<number, TransformResult>> {
  validateInputSize(buffer);

  const validWidths = widths.filter(
    (w) => w > 0 && w <= MEDIA_LIMITS.MAX_WIDTH
  );
  if (validWidths.length === 0) {
    throw ERR.validation("No valid widths provided");
  }

  const results = new Map<number, TransformResult>();

  for (const width of validWidths) {
    const result = await transformImage(buffer, {
      width,
      format: "webp",
      fit: "inside",
    });
    results.set(width, result);
  }

  return results;
}
