/**
 * Storage Provider Factory
 *
 * Creates and manages the active storage provider based on configuration.
 * Supports provider injection for testing.
 *
 * **Runtime Assumptions:**
 * This module uses module-level singletons for provider state. This is safe for:
 * - Node.js (single-threaded event loop)
 * - Vercel Edge Functions (isolated per request)
 * - AWS Lambda (single instance per invocation)
 *
 * For runtimes with shared state across requests (e.g., Cloudflare Workers with
 * Durable Objects), consider using AsyncLocalStorage-based provider injection.
 */

import { getEnv } from '../env';
import type { StorageProvider, StorageProviderType, StorageProviderConfig } from './types';
import { S3StorageAdapter } from './s3-adapter';
import { MemoryStorageAdapter } from './memory-adapter';
import { logger } from '../observability';

const log = logger.child({ module: 'storage', component: 'provider' });

// Module-level singleton - see module JSDoc for runtime compatibility notes
let storageProvider: StorageProvider | null = null;
let providerType: StorageProviderType = 's3';

/**
 * Get the current storage provider type from environment.
 */
export function getStorageProviderType(): StorageProviderType {
  const env = getEnv();
  // Check for explicit provider setting or infer from env vars
  const explicit = (process.env.STORAGE_PROVIDER as StorageProviderType) || undefined;
  if (explicit) return explicit;

  // Default to memory in test environments
  if (env.APP_ENV === 'test' || process.env.NODE_ENV === 'test') {
    return 'memory';
  }

  // Default to s3 if bucket is configured
  if (env.STORAGE_BUCKET) {
    return 's3';
  }

  // Fall back to memory for dev without config
  if (env.APP_ENV === 'dev') {
    return 'memory';
  }

  return 's3';
}

/**
 * Create a storage provider from configuration.
 *
 * **Available Providers:**
 * - `s3`: Production-ready, works with AWS S3, MinIO, DigitalOcean Spaces
 * - `memory`: For testing and development only (data lost on restart)
 * - `gcs`: Google Cloud Storage - placeholder for future implementation
 * - `local`: Local filesystem - placeholder for future implementation
 *
 * To implement GCS or local providers, create adapter classes following
 * the `StorageProvider` interface pattern (see `s3-adapter.ts` for reference).
 */
export function createStorageProvider(config: StorageProviderConfig): StorageProvider {
  switch (config.type) {
    case 's3':
      if (!config.s3) {
        throw new Error('S3 configuration required for s3 provider');
      }
      return new S3StorageAdapter(config.s3);

    case 'memory':
      return new MemoryStorageAdapter();

    case 'gcs':
      // Placeholder: Implement GcsStorageAdapter using @google-cloud/storage when needed
      throw new Error('GCS storage provider not yet implemented. Use s3 with S3-compatible storage or contribute an implementation.');

    case 'local':
      // Placeholder: Implement LocalStorageAdapter using fs module when needed
      throw new Error('Local storage provider not yet implemented. Use memory for development or contribute an implementation.');

    default:
      throw new Error(`Unknown storage provider type: ${config.type}`);
  }
}

/**
 * Create storage provider from environment variables.
 */
function createStorageProviderFromEnv(): StorageProvider {
  const type = getStorageProviderType();
  const env = getEnv();

  log.info('initializing storage provider', { type });

  switch (type) {
    case 's3':
      if (!env.STORAGE_BUCKET || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY || !env.AWS_REGION) {
        throw new Error(
          'S3 storage requires STORAGE_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY'
        );
      }
      return new S3StorageAdapter({
        bucket: env.STORAGE_BUCKET,
        region: env.AWS_REGION,
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        endpoint: env.STORAGE_ENDPOINT,
        forcePathStyle: env.STORAGE_FORCE_PATH_STYLE,
      });

    case 'memory':
      log.warn('using in-memory storage - data will be lost on restart');
      return new MemoryStorageAdapter();

    default:
      throw new Error(`Unsupported storage provider: ${type}`);
  }
}

/**
 * Get the current storage provider instance.
 * Creates it from environment if not already set.
 */
export function getStorageProvider(): StorageProvider {
  if (!storageProvider) {
    storageProvider = createStorageProviderFromEnv();
    providerType = getStorageProviderType();
  }
  return storageProvider;
}

/**
 * Set a custom storage provider.
 * Useful for testing or custom configurations.
 */
export function setStorageProvider(provider: StorageProvider, type: StorageProviderType = 'memory'): void {
  storageProvider = provider;
  providerType = type;
  log.info('custom storage provider set', { type });
}

/**
 * Reset the storage provider to be re-initialized from environment.
 * Useful for testing.
 */
export function resetStorageProvider(): void {
  storageProvider = null;
  providerType = 's3';
}

/**
 * Get the current provider type.
 */
export function getCurrentProviderType(): StorageProviderType {
  return providerType;
}

// ============================================================================
// Convenience Functions (delegate to provider)
// ============================================================================

/**
 * Get a signed URL for downloading an object.
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresInSec = 600
): Promise<{ url: string; key: string; expiresAt: number }> {
  const provider = getStorageProvider();
  return provider.getSignedDownloadUrl(key, { expiresInSec });
}

/**
 * Get a signed URL for uploading an object.
 */
export async function getSignedUploadUrl(
  key: string,
  expiresInSec = 600,
  contentType?: string
): Promise<{ url: string; key: string; expiresAt: number }> {
  const provider = getStorageProvider();
  return provider.getSignedUploadUrl(key, { expiresInSec, contentType });
}

/**
 * Upload a buffer to storage.
 */
export async function putObjectBuffer(
  key: string,
  body: Buffer,
  opts?: { contentType?: string }
): Promise<void> {
  const provider = getStorageProvider();
  return provider.putBuffer(key, body, opts);
}

/**
 * Upload a JSON object to storage.
 */
export async function putJsonObject(
  key: string,
  value: unknown,
  opts?: { metadata?: Record<string, string>; cacheControl?: string }
): Promise<void> {
  const provider = getStorageProvider();
  return provider.putJson(key, value, opts);
}

/**
 * Download an object as a buffer.
 */
export async function getObjectBuffer(key: string): Promise<Buffer> {
  const provider = getStorageProvider();
  return provider.getBuffer(key);
}

/**
 * Download and parse a JSON object.
 */
export async function getJsonObject<T = unknown>(key: string): Promise<T> {
  const provider = getStorageProvider();
  return provider.getJson<T>(key);
}

/**
 * Delete an object from storage.
 */
export async function deleteObject(key: string): Promise<void> {
  const provider = getStorageProvider();
  return provider.delete(key);
}

/**
 * @deprecated Use deleteObject instead. This alias exists for backward compatibility.
 */
export const deleteS3Object = deleteObject;

/**
 * Get object metadata without downloading content.
 */
export async function headObject(
  key: string
): Promise<{ contentLength: number; contentType: string } | null> {
  const provider = getStorageProvider();
  return provider.head(key);
}

/**
 * @deprecated Use headObject instead. This alias exists for backward compatibility.
 */
export const headS3Object = headObject;

/**
 * Generate a storage key for export files.
 */
export function exportObjectKey(
  tenantId: string,
  resource: string,
  ts: number,
  format: 'json' | 'csv' | 'xlsx'
): string {
  const safeRes = resource.replace(/[^a-zA-Z0-9_\-]/g, '_');
  return `exports/${tenantId}/${safeRes}-${ts}.${format}`;
}
