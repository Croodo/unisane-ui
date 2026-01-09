import { z } from 'zod';

export const OUTBOX_STATUS = ['queued', 'delivering', 'delivered', 'failed', 'dead'] as const;
export type OutboxStatus = (typeof OUTBOX_STATUS)[number];
export const ZOutboxStatus = z.enum(OUTBOX_STATUS);

export const OUTBOX_KIND = ['email', 'webhook'] as const;
export type OutboxKind = (typeof OUTBOX_KIND)[number];
export const ZOutboxKind = z.enum(OUTBOX_KIND);
