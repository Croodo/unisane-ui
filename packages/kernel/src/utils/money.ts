import { z } from "zod";

// Utilities for money conversions with currency-aware minor units.
// Internal representation for amounts from providers should prefer integers/minor units.

const ZMinorStr = z.string().regex(/^\d+$/);

// Common zero-decimal and three-decimal currencies.
// Default for others is 2 decimals.
const ZERO_DEC = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);
const THREE_DEC = new Set(["BHD", "IQD", "JOD", "KWD", "LYD", "OMR", "TND"]);

export function moneyDecimals(currency?: string | null): number {
  const c = (currency ?? "").toUpperCase();
  if (THREE_DEC.has(c)) return 3;
  if (ZERO_DEC.has(c)) return 0;
  return 2;
}

export function parseMinorStr(minorStr: string): bigint {
  const s = ZMinorStr.parse(minorStr);
  return BigInt(s);
}

export function toMinorStr(amountMajor: number, decimals = 2): string {
  if (!Number.isFinite(amountMajor)) throw new Error("Invalid amount");
  const factor = 10 ** decimals;
  const minor = Math.round(amountMajor * factor);
  if (!Number.isFinite(minor)) throw new Error("Invalid amount");
  return String(minor);
}

export function toMinorStrCurrency(
  amountMajor: number,
  currency: string
): string {
  return toMinorStr(amountMajor, moneyDecimals(currency));
}

export function toMajorNumber(amountMinor: bigint, decimals = 2): number {
  const factor = 10 ** decimals;
  return Number(amountMinor) / factor;
}

export function toMajorNumberCurrency(
  amountMinor: bigint,
  currency: string
): number {
  return toMajorNumber(amountMinor, moneyDecimals(currency));
}
