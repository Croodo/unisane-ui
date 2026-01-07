import { z } from 'zod';

export const GLOBAL_ROLES = ['super_admin', 'support_admin'] as const;
export type GlobalRole = (typeof GLOBAL_ROLES)[number];
export const ZGlobalRole = z.enum(GLOBAL_ROLES);
