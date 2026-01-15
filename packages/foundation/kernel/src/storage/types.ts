/**
 * Storage Provider Types
 *
 * Defines the port interface for storage providers (S3, GCS, Local, etc.).
 * This enables swapping storage backends via configuration.
 */

/**
 * Supported storage provider types.
 */
export type StorageProviderType = 's3' | 'gcs' | 'local' | 'memory';

/**
 * Common options for signed URL generation.
 */
export interface SignedUrlOptions {
  /** Expiration time in seconds (default: 600) */
  expiresInSec?: number;
  /** Content type for uploads */
  contentType?: string;
}

/**
 * Result of a signed URL operation.
 */
export interface SignedUrl {
  /** The signed URL */
  url: string;
  /** The storage key */
  key: string;
  /** Unix timestamp when URL expires */
  expiresAt: number;
}

/**
 * Object metadata returned from head operations.
 */
export interface ObjectMetadata {
  /** Content length in bytes */
  contentLength: number;
  /** MIME type */
  contentType: string;
  /** Last modified timestamp */
  lastModified?: Date;
  /** ETag/checksum */
  etag?: string;
  /** Custom metadata */
  metadata?: Record<string, string>;
}

/**
 * Options for upload operations.
 */
export interface UploadOptions {
  /** MIME type of the content */
  contentType?: string;
  /** Custom metadata */
  metadata?: Record<string, string>;
  /** Cache-Control header */
  cacheControl?: string;
}

/**
 * Port interface for storage providers.
 * All storage adapters must implement this interface.
 */
export interface StorageProvider {
  /**
   * Get a signed URL for downloading an object.
   */
  getSignedDownloadUrl(key: string, options?: SignedUrlOptions): Promise<SignedUrl>;

  /**
   * Get a signed URL for uploading an object.
   */
  getSignedUploadUrl(key: string, options?: SignedUrlOptions): Promise<SignedUrl>;

  /**
   * Upload a buffer directly.
   */
  putBuffer(key: string, body: Buffer, options?: UploadOptions): Promise<void>;

  /**
   * Upload a JSON object directly.
   */
  putJson(key: string, value: unknown, options?: Omit<UploadOptions, 'contentType'>): Promise<void>;

  /**
   * Download an object as a buffer.
   */
  getBuffer(key: string): Promise<Buffer>;

  /**
   * Download and parse a JSON object.
   */
  getJson<T = unknown>(key: string): Promise<T>;

  /**
   * Delete an object.
   */
  delete(key: string): Promise<void>;

  /**
   * Get object metadata without downloading content.
   * Returns null if object doesn't exist.
   */
  head(key: string): Promise<ObjectMetadata | null>;

  /**
   * Check if an object exists.
   */
  exists(key: string): Promise<boolean>;

  /**
   * Copy an object to a new key.
   */
  copy?(sourceKey: string, destKey: string): Promise<void>;

  /**
   * List objects with a prefix.
   */
  list?(prefix: string, options?: { maxKeys?: number; continuationToken?: string }): Promise<{
    keys: string[];
    continuationToken?: string;
    isTruncated: boolean;
  }>;
}

/**
 * Configuration for storage provider initialization.
 */
export interface StorageProviderConfig {
  /** Provider type */
  type: StorageProviderType;

  /** S3-specific config */
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
    forcePathStyle?: boolean;
  };

  /** GCS-specific config */
  gcs?: {
    bucket: string;
    projectId?: string;
    keyFilename?: string;
    credentials?: object;
  };

  /** Local filesystem config */
  local?: {
    basePath: string;
    baseUrl?: string;
  };
}
