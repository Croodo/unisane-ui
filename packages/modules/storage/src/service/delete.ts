import { getScopeId, connectDb, events, assertScopeOwnership } from "@unisane/kernel";
import { StorageRepo } from "../data/storage.repository";
import { STORAGE_EVENTS } from "../domain/constants";
import { ERR } from "@unisane/gateway";

export type DeleteFileArgs = {
  fileId: string;
};

export async function deleteFile(args: DeleteFileArgs) {
  const scopeId = getScopeId();
  await connectDb();

  const file = await StorageRepo.findById(args.fileId);
  if (!file) throw ERR.notFound("File not found");
  assertScopeOwnership(file);

  const deleted = await StorageRepo.softDelete(args.fileId);
  if (!deleted) throw ERR.validation("File already deleted");

  await events.emit(STORAGE_EVENTS.FILE_DELETED, {
    scopeId,
    fileId: args.fileId,
    key: file.key,
  });

  return { ok: true, key: file.key };
}
