import { z } from 'zod';

export const GRANT_EFFECTS = ['allow', 'deny'] as const;
export type GrantEffect = (typeof GRANT_EFFECTS)[number];
export const ZGrantEffect = z.enum(GRANT_EFFECTS);

