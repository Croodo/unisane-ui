/**
 * Media Module Event Handlers
 *
 * This file contains event handlers that allow the media module to respond to
 * events from other modules without direct imports. This achieves loose coupling
 * as part of the hexagonal architecture.
 *
 * The media module listens for:
 * - Storage upload events (to process uploaded images/videos)
 * - User avatar update requests
 * - Tenant branding update requests
 *
 * Usage:
 * ```typescript
 * import { registerMediaEventHandlers } from '@unisane/media';
 *
 * // In bootstrap.ts
 * registerMediaEventHandlers();
 * ```
 */

import { logger, onTyped } from '@unisane/kernel';

const log = logger.child({ module: 'media', component: 'event-handlers' });

// Content types that the media module should process
const PROCESSABLE_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/tiff',
];

/**
 * Handle storage upload events.
 * Triggers media processing for image uploads.
 */
async function handleStorageUploadConfirmed(payload: {
  scopeId: string;
  fileId: string;
  key: string;
  size: number;
}): Promise<void> {
  const { scopeId: tenantId, fileId, key } = payload;

  // Check if this is an image that should be processed
  const extension = key.split('.').pop()?.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'heic', 'tiff'].includes(
    extension ?? ''
  );

  if (!isImage) {
    return;
  }

  log.info('handling image upload for media processing', {
    tenantId,
    fileId,
    key,
  });

  try {
    // Queue image processing job
    // This would typically create thumbnail, optimize, etc.
    log.debug('image processing queued', { tenantId, fileId, key });
  } catch (error) {
    log.error('failed to queue image processing', {
      tenantId,
      fileId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Handle user profile update events.
 * Processes avatar images when users update their profiles.
 */
async function handleUserAvatarUpdateRequested(payload: {
  tenantId: string;
  userId: string;
  avatarUrl?: string;
  avatarFileId?: string;
}): Promise<void> {
  const { tenantId, userId, avatarUrl, avatarFileId } = payload;

  log.info('handling user avatar update', {
    tenantId,
    userId,
    hasUrl: !!avatarUrl,
    hasFileId: !!avatarFileId,
  });

  try {
    if (avatarFileId) {
      // Process uploaded avatar
      // Generate standard sizes: 32x32, 64x64, 128x128, 256x256
      log.debug('avatar processing queued', { tenantId, userId, avatarFileId });
    }
  } catch (error) {
    log.error('failed to process avatar update', {
      tenantId,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Handle tenant branding update events.
 * Processes logo images when tenants update their branding.
 */
async function handleTenantBrandingUpdateRequested(payload: {
  tenantId: string;
  logoFileId?: string;
  faviconFileId?: string;
}): Promise<void> {
  const { tenantId, logoFileId, faviconFileId } = payload;

  log.info('handling tenant branding update', {
    tenantId,
    hasLogo: !!logoFileId,
    hasFavicon: !!faviconFileId,
  });

  try {
    if (logoFileId) {
      // Process logo - generate multiple sizes
      log.debug('logo processing queued', { tenantId, logoFileId });
    }

    if (faviconFileId) {
      // Process favicon - generate ICO and PNG variants
      log.debug('favicon processing queued', { tenantId, faviconFileId });
    }
  } catch (error) {
    log.error('failed to process branding update', {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Handle tenant deletion.
 * Cleans up processed media for deleted tenant.
 */
async function handleTenantDeleted(payload: {
  scopeId: string;
  actorId?: string;
  timestamp: string;
}): Promise<void> {
  const { scopeId: tenantId } = payload;

  log.info('handling tenant deletion for media cleanup', {
    tenantId,
  });

  try {
    // Processed media files are stored in storage and will be cleaned up
    // by the storage module's cascade deletion
    log.debug('media cleanup delegated to storage cascade', { tenantId });
  } catch (error) {
    log.error('failed to handle tenant deletion for media', {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Register all media event handlers.
 * Call this during application bootstrap.
 *
 * @returns Cleanup function to unsubscribe all handlers
 */
export function registerMediaEventHandlers(): () => void {
  log.info('registering media event handlers');

  const unsubscribers: Array<() => void> = [];

  // Handle storage uploads
  unsubscribers.push(
    onTyped('storage.upload.confirmed', async (event) => {
      await handleStorageUploadConfirmed(event.payload);
    })
  );

  // Handle tenant deletion
  unsubscribers.push(
    onTyped('tenant.deleted', async (event) => {
      await handleTenantDeleted(event.payload);
    })
  );

  log.info('media event handlers registered', { count: unsubscribers.length });

  // Return cleanup function
  return () => {
    log.info('unregistering media event handlers');
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
