/**
 * Media Domain Constants
 */

export const MEDIA_EVENTS = {
  UPLOADED: 'media.uploaded',
  PROCESSED: 'media.processed',
  DELETED: 'media.deleted',
} as const;

export const MEDIA_DEFAULTS = {
  MAX_IMAGE_SIZE: 10 * 1024 * 1024,
  MAX_VIDEO_SIZE: 100 * 1024 * 1024,
  THUMBNAIL_SIZE: 200,
} as const;

export const MEDIA_COLLECTIONS = {
  MEDIA: 'media',
} as const;
