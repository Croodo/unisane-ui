import type { UsageRepoPort } from '../domain/ports';
import { selectRepo } from '@unisane/kernel';
import { UsageRepoMongo } from './usage.repository.mongo';

export const UsageRepo = selectRepo<UsageRepoPort>({ mongo: UsageRepoMongo });

