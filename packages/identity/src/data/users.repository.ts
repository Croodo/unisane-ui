import { selectRepo } from "@unisane/kernel";
import { mongoUsersRepository } from "./users.repository.mongo";
import type { UsersApi } from "../domain/types";

export const usersRepository = selectRepo<UsersApi>({
  mongo: mongoUsersRepository,
});
