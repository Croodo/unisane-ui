import type { SubscriptionsRepo } from '../domain/ports';
import { mongoSubscriptionsRepo } from './subscriptions.repository.mongo';
import { selectRepo } from '@unisane/kernel';

export const SubscriptionsRepository = selectRepo<SubscriptionsRepo>({ mongo: mongoSubscriptionsRepo });
