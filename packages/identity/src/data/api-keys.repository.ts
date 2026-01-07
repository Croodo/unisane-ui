import { selectRepo } from "@unisane/kernel";
import { mongoApiKeysRepository } from "./api-keys.repository.mongo";

export const apiKeysRepository = selectRepo({
  mongo: mongoApiKeysRepository,
});
