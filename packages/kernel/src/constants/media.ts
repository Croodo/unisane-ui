// Media module SSOT constants

export const MEDIA_FORMATS = {
  JPEG: "jpeg",
  PNG: "png",
  WEBP: "webp",
  AVIF: "avif",
  GIF: "gif",
  HEIC: "heic",
  HEIF: "heif",
  TIFF: "tiff",
  BMP: "bmp",
} as const;

export type MediaFormat = (typeof MEDIA_FORMATS)[keyof typeof MEDIA_FORMATS];

export const MEDIA_PRESETS = {
  AVATAR_SM: { width: 48, height: 48, format: "webp" as const },
  AVATAR_MD: { width: 96, height: 96, format: "webp" as const },
  AVATAR_LG: { width: 192, height: 192, format: "webp" as const },
  THUMBNAIL: { width: 150, height: 150, format: "webp" as const },
  PREVIEW: { width: 400, height: 400, format: "webp" as const },
  BANNER: { width: 1200, height: 630, format: "webp" as const },
  LOGO: { width: 200, height: 200, format: "png" as const },
} as const;

export type MediaPreset = keyof typeof MEDIA_PRESETS;

export const MEDIA_LIMITS = {
  MAX_WIDTH: 4096,
  MAX_HEIGHT: 4096,
  MAX_INPUT_SIZE_MB: 10,
  QUALITY_DEFAULT: 80,
  QUALITY_HIGH: 90,
  QUALITY_LOW: 60,
} as const;

export const AVATAR_COLORS = [
  "#f44336", // red
  "#e91e63", // pink
  "#9c27b0", // purple
  "#673ab7", // deep purple
  "#3f51b5", // indigo
  "#2196f3", // blue
  "#03a9f4", // light blue
  "#00bcd4", // cyan
  "#009688", // teal
  "#4caf50", // green
  "#8bc34a", // light green
  "#ff9800", // orange
  "#ff5722", // deep orange
  "#795548", // brown
] as const;
