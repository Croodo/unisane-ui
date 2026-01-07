export type {
  PatchConflict,
  PatchOk,
  PatchResult,
} from "../domain/types";
import { selectRepo } from "@unisane/kernel";
import { SettingsRepoMongo } from "./settings.repository.mongo";
import type { SettingsRepo as SettingsRepoPort } from "../domain/ports";

let _repo: SettingsRepoPort | undefined;
function getRepo() {
  if (!_repo) {
    _repo = selectRepo<SettingsRepoPort>({ mongo: SettingsRepoMongo });
  }
  return _repo;
}

export const SettingsRepo = new Proxy({} as SettingsRepoPort, {
  get(_target, prop) {
    return getRepo()[prop as keyof SettingsRepoPort];
  },
});
