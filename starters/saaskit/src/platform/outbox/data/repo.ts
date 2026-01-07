import type { OutboxRepoPort } from '@/src/platform/outbox/domain/ports';
import { selectRepo } from '@unisane/kernel';
import { OutboxRepoMongo } from './repo.mongo';

export const OutboxRepo = selectRepo<OutboxRepoPort>({ mongo: OutboxRepoMongo });

