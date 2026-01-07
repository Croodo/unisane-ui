import { selectRepo } from "@unisane/kernel";
import { StorageRepoMongo } from "./storage.repository.mongo";
import type { StorageRepository } from "../domain/ports";

export const StorageRepo = selectRepo<StorageRepository>({
  mongo: StorageRepoMongo,
});
