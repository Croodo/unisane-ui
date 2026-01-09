import { pickRegistry } from './types';
import { usersFieldRegistry } from './users.fields';

export const usersAdminFieldRegistry = pickRegistry(usersFieldRegistry, [
  "id",
  "email",
  "displayName",
  "updatedAt",
] as const);
