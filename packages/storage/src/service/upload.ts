import { randomUUID } from "node:crypto";
import { getTenantId, connectDb, getSignedUploadUrl, events } from "@unisane/kernel";
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

export async function requestUpload(args: RequestUploadArgs) {
  const tenantId = getTenantId();
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

  const uuid = randomUUID();
  const key = generateStorageKey({
    tenantId,
    folder,
    uuid,
    filename,
    contentType: contentType as AllowedContentType,
  });

  const file = await StorageRepo.create({
    tenantId,
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
    tenantId,
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
