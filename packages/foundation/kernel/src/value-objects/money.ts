/**
 * Money Value Object
 *
 * Represents monetary values with proper precision handling.
 * Uses bigint internally to avoid floating-point precision issues.
 *
 * @example
 * ```typescript
 * import { Money } from '@unisane/kernel';
 *
 * const price = Money.fromMajor(19.99, 'USD');
 * const tax = price.multiply(0.1);
 * const total = price.add(tax);
 *
 * console.log(total.format()); // "$21.99"
 * console.log(total.toMinor()); // 2199n
 * ```
 */

import { z } from 'zod';

/**
 * Supported currency codes.
 * Follows ISO 4217 standard.
 */
export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'INR'
  | 'JPY'
  | 'CAD'
  | 'AUD'
  | 'CHF'
  | 'CNY'
  | 'KRW'
  | 'BRL'
  | 'MXN'
  | 'SGD'
  | 'HKD'
  | 'SEK'
  | 'NOK'
  | 'DKK'
  | 'NZD'
  | 'ZAR'
  | 'AED';

/**
 * Zero-decimal currencies (no minor units).
 */
const ZERO_DECIMAL_CURRENCIES = new Set([
  'JPY',
  'KRW',
  'VND',
  'CLP',
  'PYG',
  'GNF',
  'RWF',
  'UGX',
  'XAF',
  'XOF',
  'XPF',
]);

/**
 * Money value object for handling monetary amounts.
 *
 * Key features:
 * - Immutable - all operations return new instances
 * - Uses bigint internally to avoid floating-point precision issues
 * - Supports zero-decimal currencies (JPY, KRW, etc.)
 * - Currency-safe operations (can't accidentally mix currencies)
 */
export class Money {
  /**
   * Private constructor - use factory methods instead.
   */
  private constructor(
    private readonly minorUnits: bigint,
    public readonly currency: CurrencyCode
  ) {
    // Allow negative for refunds, but validate it's a valid bigint
    if (typeof minorUnits !== 'bigint') {
      throw new Error('Money amount must be a bigint');
    }
  }

  // ─── FACTORY METHODS ────────────────────────────────────────────────────────

  /**
   * Create Money from major units (e.g., dollars).
   *
   * @example
   * ```typescript
   * Money.fromMajor(19.99, 'USD') // $19.99
   * Money.fromMajor(1000, 'JPY')  // ¥1000 (no decimals)
   * ```
   */
  static fromMajor(amount: number, currency: CurrencyCode): Money {
    const decimals = Money.decimalsFor(currency);
    const multiplier = Math.pow(10, decimals);
    const minor = BigInt(Math.round(amount * multiplier));
    return new Money(minor, currency);
  }

  /**
   * Create Money from minor units (e.g., cents).
   *
   * @example
   * ```typescript
   * Money.fromMinor(1999n, 'USD') // $19.99
   * Money.fromMinor(1000n, 'JPY') // ¥1000
   * ```
   */
  static fromMinor(amount: bigint | number, currency: CurrencyCode): Money {
    const minor = typeof amount === 'number' ? BigInt(amount) : amount;
    return new Money(minor, currency);
  }

  /**
   * Create zero Money for a currency.
   */
  static zero(currency: CurrencyCode): Money {
    return new Money(0n, currency);
  }

  /**
   * Create Money from a JSON representation.
   */
  static fromJSON(json: { amount: number; currency: string }): Money {
    return Money.fromMajor(json.amount, json.currency as CurrencyCode);
  }

  /**
   * Try to create Money, returns null if invalid.
   */
  static tryCreate(
    amount: number,
    currency: string
  ): Money | null {
    try {
      return Money.fromMajor(amount, currency as CurrencyCode);
    } catch {
      return null;
    }
  }

  // ─── ACCESSORS ──────────────────────────────────────────────────────────────

  /**
   * Get amount in major units (e.g., dollars).
   */
  toMajor(): number {
    const decimals = Money.decimalsFor(this.currency);
    return Number(this.minorUnits) / Math.pow(10, decimals);
  }

  /**
   * Get amount in minor units (e.g., cents).
   */
  toMinor(): bigint {
    return this.minorUnits;
  }

  /**
   * Get amount in minor units as number.
   * Use with caution for large amounts.
   */
  toMinorNumber(): number {
    return Number(this.minorUnits);
  }

  // ─── ARITHMETIC OPERATIONS ──────────────────────────────────────────────────

  /**
   * Add two Money values.
   * @throws Error if currencies don't match
   */
  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minorUnits + other.minorUnits, this.currency);
  }

  /**
   * Subtract another Money value.
   * @throws Error if currencies don't match
   */
  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minorUnits - other.minorUnits, this.currency);
  }

  /**
   * Multiply by a factor (e.g., for tax calculation).
   */
  multiply(factor: number): Money {
    const result = BigInt(Math.round(Number(this.minorUnits) * factor));
    return new Money(result, this.currency);
  }

  /**
   * Divide by a divisor.
   */
  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new Error('Cannot divide by zero');
    }
    const result = BigInt(Math.round(Number(this.minorUnits) / divisor));
    return new Money(result, this.currency);
  }

  /**
   * Get absolute value (for refunds that might be negative).
   */
  abs(): Money {
    const absValue = this.minorUnits < 0n ? -this.minorUnits : this.minorUnits;
    return new Money(absValue, this.currency);
  }

  /**
   * Negate the amount.
   */
  negate(): Money {
    return new Money(-this.minorUnits, this.currency);
  }

  // ─── COMPARISON ─────────────────────────────────────────────────────────────

  /**
   * Check if two Money values are equal.
   */
  equals(other: Money): boolean {
    return (
      this.minorUnits === other.minorUnits && this.currency === other.currency
    );
  }

  /**
   * Check if this is zero.
   */
  isZero(): boolean {
    return this.minorUnits === 0n;
  }

  /**
   * Check if this is positive.
   */
  isPositive(): boolean {
    return this.minorUnits > 0n;
  }

  /**
   * Check if this is negative.
   */
  isNegative(): boolean {
    return this.minorUnits < 0n;
  }

  /**
   * Check if this is greater than another Money.
   * @throws Error if currencies don't match
   */
  greaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.minorUnits > other.minorUnits;
  }

  /**
   * Check if this is greater than or equal to another Money.
   * @throws Error if currencies don't match
   */
  greaterThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.minorUnits >= other.minorUnits;
  }

  /**
   * Check if this is less than another Money.
   * @throws Error if currencies don't match
   */
  lessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.minorUnits < other.minorUnits;
  }

  /**
   * Check if this is less than or equal to another Money.
   * @throws Error if currencies don't match
   */
  lessThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.minorUnits <= other.minorUnits;
  }

  // ─── FORMATTING ─────────────────────────────────────────────────────────────

  /**
   * Format as localized currency string.
   *
   * @example
   * ```typescript
   * money.format()         // "$19.99" (default en-US)
   * money.format('de-DE')  // "19,99 $"
   * money.format('ja-JP')  // "￥1,000"
   * ```
   */
  format(locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
    }).format(this.toMajor());
  }

  /**
   * Format as simple string (amount only, no currency symbol).
   */
  formatAmount(locale: string = 'en-US'): string {
    const decimals = Money.decimalsFor(this.currency);
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(this.toMajor());
  }

  /**
   * String representation for debugging.
   */
  toString(): string {
    return `${this.currency} ${this.toMajor()}`;
  }

  // ─── SERIALIZATION ──────────────────────────────────────────────────────────

  /**
   * Convert to JSON-serializable object.
   */
  toJSON(): { amount: number; currency: string } {
    return {
      amount: this.toMajor(),
      currency: this.currency,
    };
  }

  // ─── HELPERS ────────────────────────────────────────────────────────────────

  /**
   * Assert that two Money values have the same currency.
   */
  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Currency mismatch: cannot operate on ${this.currency} and ${other.currency}`
      );
    }
  }

  /**
   * Get decimal places for a currency.
   */
  private static decimalsFor(currency: CurrencyCode | string): number {
    return ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2;
  }

  /**
   * Check if a currency code is valid.
   */
  static isValidCurrency(currency: string): currency is CurrencyCode {
    const validCurrencies = new Set<string>([
      'USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'KRW',
      'BRL', 'MXN', 'SGD', 'HKD', 'SEK', 'NOK', 'DKK', 'NZD', 'ZAR', 'AED',
    ]);
    return validCurrencies.has(currency);
  }
}

// ─── ZOD INTEGRATION ────────────────────────────────────────────────────────

/**
 * Zod schema for Money serialization format.
 */
export const ZMoneyInput = z.object({
  amount: z.number(),
  currency: z.string(),
});

/**
 * Zod schema that transforms to Money value object.
 */
export const ZMoney = ZMoneyInput.transform((val) =>
  Money.fromMajor(val.amount, val.currency as CurrencyCode)
);

/**
 * Zod schema for currency code validation.
 */
export const ZCurrencyCode = z.enum([
  'USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'KRW',
  'BRL', 'MXN', 'SGD', 'HKD', 'SEK', 'NOK', 'DKK', 'NZD', 'ZAR', 'AED',
]);
