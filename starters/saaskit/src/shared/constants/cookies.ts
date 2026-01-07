import { z } from 'zod';

// Cookie SameSite attribute values
export const COOKIE_SAMESITE_VALUES = ['lax', 'none', 'strict'] as const;
export type CookieSameSite = (typeof COOKIE_SAMESITE_VALUES)[number];
export const ZCookieSameSite = z.enum(COOKIE_SAMESITE_VALUES);
export const DEFAULT_COOKIE_SAMESITE: CookieSameSite = 'lax';
