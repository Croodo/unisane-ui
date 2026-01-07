import { selectRepo } from "@unisane/kernel";
import type { AnalyticsRepo } from "../domain/ports";
import { AnalyticsRepoMongo } from "./analytics.repository.mongo";

export const analyticsRepository = selectRepo<AnalyticsRepo>({
  mongo: AnalyticsRepoMongo,
});
