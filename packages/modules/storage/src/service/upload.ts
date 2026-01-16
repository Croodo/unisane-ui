import { randomUUID } from "node:crypto";
import {
  getScopeId,
  connectDb,
  getSignedUploadUrl,
  events,
  getTenantsProvider,
  hasTenantsProvider,
  PLAN_DEFS,
  type PlanId,
} from "@unisane/kernel";
import {
  generateStorageKey,
  STORAGE_LIMITS,
  ALLOWED_CONTENT_TYPES,
  type AllowedContentType,
} from "@unisane/kernel";
import { StorageRepo } from "../data/storage.repository";
import { STORAGE_EVENTS } from "../domain/constants";
import type { RequestUploadInput } from "../domain/schemas";
import { ERR } from "@unisane/gateway";

export type RequestUploadArgs = {
  uploaderId: string;
  input: RequestUploadInput;
};

/**
 * Helper to format bytes in human-readable form
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Get storage quota limit for a given plan
 */
function getStorageQuotaForPlan(planId: PlanId): number {
  const planDef = PLAN_DEFS[planId];
  const storageBytes = planDef?.entitlements?.capacities?.storageBytes;
  const defaultBytes = PLAN_DEFS.free.entitlements?.capacities?.storageBytes ?? 0;
  return storageBytes ?? defaultBytes;
}

/**
 * M-010 FIX: Map file extensions to expected MIME types.
 * Used to validate that filename extension matches declared content type.
 */
const EXTENSION_TO_MIME: Record<string, AllowedContentType[]> = {
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  gif: ["image/gif"],
  webp: ["image/webp"],
  svg: ["image/svg+xml"],
  heic: ["image/heic"],
  heif: ["image/heif"],
  avif: ["image/avif"],
  tiff: ["image/tiff"],
  tif: ["image/tiff"],
  bmp: ["image/bmp"],
  pdf: ["application/pdf"],
  json: ["application/json"],
  csv: ["text/csv"],
  txt: ["text/plain"],
  zip: ["application/zip"],
};

/**
 * M-010 FIX: Validate that the filename extension matches the declared MIME type.
 * This prevents MIME type spoofing attacks where an attacker declares a safe
 * MIME type but uploads a different file type.
 */
function validateFilenameMatchesMimeType(
  filename: string,
  contentType: AllowedContentType
): void {
  // Extract extension from filename (lowercase)
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) {
    // No extension - allow (some legitimate files have no extension)
    return;
  }

  const ext = filename.slice(lastDot + 1).toLowerCase();
  if (!ext) {
    // Empty extension after dot - allow
    return;
  }

  // Check if extension is known
  const allowedMimes = EXTENSION_TO_MIME[ext];
  if (!allowedMimes) {
    // Unknown extension - allow (might be legitimate)
    return;
  }

  // Check if declared MIME type matches what the extension expects
  if (!allowedMimes.includes(contentType)) {
    throw ERR.validation(
      `File extension '.${ext}' does not match declared content type '${contentType}'. ` +
        `Expected one of: ${allowedMimes.join(", ")}`
    );
  }
}

export async function requestUpload(args: RequestUploadArgs) {
  const scopeId = getScopeId();
  await connectDb();

  const { uploaderId, input } = args;
  const { folder, filename, contentType, sizeBytes, metadata } = input;

  const typeConfig = ALLOWED_CONTENT_TYPES[contentType as AllowedContentType];
  if (!typeConfig) {
    throw ERR.validation(`Content type ${contentType} not allowed`);
  }
  if (sizeBytes > typeConfig.maxBytes) {
    throw ERR.validation(
      `File size ${sizeBytes} exceeds max ${typeConfig.maxBytes} for ${contentType}`
    );
  }

  // M-010 FIX: Validate filename extension matches MIME type
  validateFilenameMatchesMimeType(filename, contentType as AllowedContentType);

  // Check storage quota before proceeding
  if (hasTenantsProvider()) {
    const tenantsProvider = getTenantsProvider();
    const tenant = await tenantsProvider.findById(scopeId);
    const planId = (tenant?.planId as PlanId) ?? "free";
    const storageQuota = getStorageQuotaForPlan(planId);

    // Get current storage usage
    const usage = await StorageRepo.getStorageUsage();

    // Check if the new file would exceed the quota
    if (usage.totalBytes + sizeBytes > storageQuota) {
      throw ERR.validation(
        `Storage quota exceeded. Used: ${formatBytes(usage.totalBytes)}, Limit: ${formatBytes(storageQuota)}, Requested: ${formatBytes(sizeBytes)}`
      );
    }
  }

  const uuid = randomUUID();
  const key = generateStorageKey({
    scopeId,
    folder,
    uuid,
    filename,
    contentType: contentType as AllowedContentType,
  });

  const file = await StorageRepo.create({
    scopeId,
    uploaderId,
    key,
    folder,
    filename,
    contentType: contentType as AllowedContentType,
    sizeBytes,
    ...(metadata ? { metadata } : {}),
  });

  const signed = await getSignedUploadUrl(
    key,
    STORAGE_LIMITS.PRESIGN_EXPIRY_SEC
  );

  await events.emit(STORAGE_EVENTS.UPLOAD_REQUESTED, {
    scopeId,
    fileId: file.id,
    key,
    uploaderId,
  });

  return {
    fileId: file.id,
    uploadUrl: signed.url,
    key,
    expiresAt: signed.expiresAt,
  };
}
