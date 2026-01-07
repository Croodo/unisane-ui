import { selectRepo } from "@unisane/kernel";
import { ExposuresRepoMongo } from "./exposures.repository.mongo";

export type ExposuresRepoApi = typeof ExposuresRepoMongo;

export const ExposuresRepo = selectRepo<ExposuresRepoApi>({
  mongo: ExposuresRepoMongo,
});
