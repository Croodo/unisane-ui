/**
 * @module @unisane/media
 * @description Image processing, avatars, and media transformation
 * @layer 4
 */

// ════════════════════════════════════════════════════════════════════════════
// Domain - Schemas & Types
// ════════════════════════════════════════════════════════════════════════════

export * from "./domain/schemas";
export * from "./domain/types";

// ════════════════════════════════════════════════════════════════════════════
// Domain - Errors
// ════════════════════════════════════════════════════════════════════════════

export { MediaNotFoundError, MediaProcessingError, UnsupportedMediaTypeError } from './domain/errors';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Constants
// ════════════════════════════════════════════════════════════════════════════

export { MEDIA_EVENTS, MEDIA_DEFAULTS, MEDIA_COLLECTIONS } from './domain/constants';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Cache Keys
// ════════════════════════════════════════════════════════════════════════════

export { mediaKeys } from './domain/keys';
export type { MediaKeyBuilder } from './domain/keys';

// ════════════════════════════════════════════════════════════════════════════
// Services - Avatar
// ════════════════════════════════════════════════════════════════════════════

export { generateAvatarSvg, getAvatarUrl } from "./service/avatar";

// ════════════════════════════════════════════════════════════════════════════
// Services - Transform
// ════════════════════════════════════════════════════════════════════════════

export {
  isSharpAvailable,
  getImageMetadata,
  transformImage,
  transformWithPreset,
  optimizeImage,
  generateVariants,
} from "./service/transform";
