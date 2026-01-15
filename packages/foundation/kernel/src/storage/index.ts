/**
 * Storage Provider Abstraction
 *
 * Provides a pluggable storage system supporting multiple backends:
 * - S3 (AWS, MinIO, DigitalOcean Spaces)
 * - Memory (testing/development)
 * - GCS (Google Cloud Storage) - planned
 * - Local filesystem - planned
 *
 * @example
 * ```typescript
 * import { getStorageProvider, getSignedUploadUrl } from '@unisane/kernel';
 *
 * // Get signed URL for upload (uses configured provider)
 * const { url, key, expiresAt } = await getSignedUploadUrl('uploads/file.pdf');
 *
 * // Direct provider access
 * const provider = getStorageProvider();
 * await provider.putBuffer('data/export.json', buffer, { contentType: 'application/json' });
 * ```
 */

// Types
export type {
  StorageProvider,
  StorageProviderType,
  StorageProviderConfig,
  SignedUrl,
  SignedUrlOptions,
  ObjectMetadata,
  UploadOptions,
} from './types';

// Provider factory
export {
  getStorageProvider,
  setStorageProvider,
  resetStorageProvider,
  createStorageProvider,
  getStorageProviderType,
  getCurrentProviderType,
  // Convenience functions
  getSignedDownloadUrl,
  getSignedUploadUrl,
  putObjectBuffer,
  putJsonObject,
  getObjectBuffer,
  getJsonObject,
  deleteObject,
  headObject,
  exportObjectKey,
  // Backward compatible aliases (deprecated)
  deleteS3Object,
  headS3Object,
} from './provider';

// Adapters (for direct instantiation or testing)
export { S3StorageAdapter } from './s3-adapter';
export type { S3AdapterConfig } from './s3-adapter';
export { MemoryStorageAdapter } from './memory-adapter';
