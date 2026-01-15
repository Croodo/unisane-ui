import { getScopeId, connectDb, events, assertScopeOwnership } from "@unisane/kernel";
import { StorageRepo } from "../data/storage.repository";
import { STORAGE_EVENTS } from "../domain/constants";
import { ERR } from "@unisane/gateway";

export type ConfirmUploadArgs = {
  fileId: string;
};

export async function confirmUpload(args: ConfirmUploadArgs) {
  const scopeId = getScopeId();
  await connectDb();

  const file = await StorageRepo.findById(args.fileId);
  if (!file) throw ERR.notFound("File not found");
  assertScopeOwnership(file);

  const updated = await StorageRepo.confirmUpload(args.fileId);
  if (!updated) throw ERR.validation("File already confirmed or deleted");

  await events.emit(STORAGE_EVENTS.UPLOAD_CONFIRMED, {
    scopeId,
    fileId: args.fileId,
    key: file.key,
  });

  return updated;
}
