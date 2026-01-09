import { z } from 'zod';

export const ROLE = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  BILLING: 'billing',
} as const;

export type RoleId = (typeof ROLE)[keyof typeof ROLE];
export const ZRoleId = z.enum(Object.values(ROLE) as [RoleId, ...RoleId[]]);
