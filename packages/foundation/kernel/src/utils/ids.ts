import crypto from 'node:crypto';
import { ID_PREFIX } from '../constants/ids';

import { ulid } from 'ulid';

export function uuid(): string {
  return crypto.randomUUID();
}

/**
 * Generate a prefixed ID using ULID.
 * @param prefix - The prefix to use (e.g., 'req', 'evt', 'ses')
 * @returns A prefixed unique ID like 'req_01HQ3Z4X...'
 */
export function generateId(prefix: string): string {
  return `${prefix}_${ulid()}`;
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
