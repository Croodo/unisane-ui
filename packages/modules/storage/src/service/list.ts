import { connectDb } from "@unisane/kernel";
import { StorageRepo } from "../data/storage.repository";
import type { ListFilesInput } from "../domain/schemas";

export async function listFiles(input: ListFilesInput) {
  await connectDb();

  // tenantId is automatically applied via tenantFilter() in repository
  const { items, nextCursor } = await StorageRepo.list({
    ...(input.folder ? { folder: input.folder } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.cursor ? { cursor: input.cursor } : {}),
    limit: input.limit,
  });

  return { items, nextCursor };
}
