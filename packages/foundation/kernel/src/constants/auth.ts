import { z } from 'zod';

export const AUTH_ALGO = ['scrypt'] as const;
export type AuthAlgo = (typeof AUTH_ALGO)[number];
export const ZAuthAlgo = z.enum(AUTH_ALGO);

