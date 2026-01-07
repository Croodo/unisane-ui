import crypto from 'node:crypto';
import { ID_PREFIX } from '@/src/shared/constants/ids';

import { ulid } from 'ulid';

export function uuid(): string {
  return crypto.randomUUID();
}

export function newTenantId(): string {
  return `${ID_PREFIX.TENANT}${ulid()}`;
}

export function newUserId(): string {
  return `${ID_PREFIX.USER}${ulid()}`;
}

export function newApiKeyId(): string {
  return `${ID_PREFIX.API_KEY}${ulid()}`;
}
