import { selectRepo } from "@unisane/kernel";
import { mongoApiKeysRepository } from "./api-keys.repository.mongo";
import type { ApiKeysApi } from "../domain/types";

export const apiKeysRepository = selectRepo<ApiKeysApi>({
  mongo: mongoApiKeysRepository,
});
