import type { InappRepoPort } from "../domain/ports";
import { selectRepo } from "@unisane/kernel";
import { InappRepoMongo } from "./notifications.repository.mongo";

export const NotificationsRepository = selectRepo<InappRepoPort>({ mongo: InappRepoMongo });
