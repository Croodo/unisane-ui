import { z } from 'zod';

// Platform-wide supported locales (BCP‑47). Keep this list short and intentional.
// Tenants may override per-tenant defaults, but values should come from this SSOT.
export const SUPPORTED_LOCALES = [
  'en',      // Generic English
  'en-US',   // U.S. English
  'en-GB',   // U.K. English
  'hi-IN',   // Hindi (India)
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const ZLocale = z.enum(SUPPORTED_LOCALES);

export function resolveLocale(...candidates: Array<string | null | undefined>): Locale {
  for (const c of candidates) {
    if (!c) continue;
    if ((SUPPORTED_LOCALES as readonly string[]).includes(c)) return c as Locale;
  }
  return DEFAULT_LOCALE;
}
