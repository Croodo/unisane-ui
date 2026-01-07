import { getTenantId, connectDb, getSignedDownloadUrl, assertTenantOwnership } from "@unisane/kernel";
import { STORAGE_LIMITS, FILE_STATUS } from "@unisane/kernel";
import { StorageRepo } from "../data/storage.repository";
import { ERR } from "@unisane/gateway";

export type GetDownloadUrlArgs = {
  fileId?: string;
  key?: string;
};

export async function getDownloadUrl(args: GetDownloadUrlArgs) {
  const tenantId = getTenantId();
  await connectDb();

  if (args.fileId) {
    const file = await StorageRepo.findById(args.fileId);
    if (!file) throw ERR.notFound("File not found");
    assertTenantOwnership(file);
    if (file.status !== FILE_STATUS.ACTIVE) {
      throw ERR.validation("File not available");
    }
    const signed = await getSignedDownloadUrl(
      file.key,
      STORAGE_LIMITS.PRESIGN_EXPIRY_SEC
    );
    return { url: signed.url, key: file.key, expiresAt: signed.expiresAt };
  }

  if (args.key) {
    const file = await StorageRepo.findByKey(args.key);
    if (file) {
      assertTenantOwnership(file);
    }
    const signed = await getSignedDownloadUrl(
      args.key,
      STORAGE_LIMITS.PRESIGN_EXPIRY_SEC
    );
    return { url: signed.url, key: args.key, expiresAt: signed.expiresAt };
  }

  throw ERR.validation("Either fileId or key required");
}
