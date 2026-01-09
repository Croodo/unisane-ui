import { selectRepo } from "@unisane/kernel";
import { mongoMembershipsRepository } from "./memberships.repository.mongo";
import type { MembershipsApi } from "../domain/types";

export const membershipsRepository = selectRepo<MembershipsApi>({
  mongo: mongoMembershipsRepository,
});
