export type { UpsertConflict, UpsertOk, UpsertResult } from '../domain/types';
import type { FlagsRepoPort } from '../domain/ports';
import { selectRepo } from '@unisane/kernel';
import { FlagsRepoMongo } from './flags.repository.mongo';

export const FlagsRepo = selectRepo<FlagsRepoPort>({ mongo: FlagsRepoMongo });
