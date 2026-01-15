/**
 * CreditAmount Value Object
 *
 * Represents a credit amount with proper validation.
 * Credits are always non-negative integers.
 *
 * @example
 * ```typescript
 * import { CreditAmount } from '@unisane/credits';
 *
 * const credits = CreditAmount.create(100);
 * const bonus = CreditAmount.create(10);
 * const total = credits.add(bonus);
 *
 * console.log(total.toNumber()); // 110
 * ```
 */

import { z } from 'zod';

/**
 * CreditAmount value object for handling credit quantities.
 *
 * Key features:
 * - Immutable - all operations return new instances
 * - Always non-negative integer
 * - Safe arithmetic operations
 */
export class CreditAmount {
  private readonly value: number;

  /**
   * Private constructor - use factory methods instead.
   */
  private constructor(amount: number) {
    if (!Number.isInteger(amount)) {
      throw new Error('Credit amount must be an integer');
    }
    if (amount < 0) {
      throw new Error('Credit amount cannot be negative');
    }
    this.value = amount;
  }

  // ─── FACTORY METHODS ────────────────────────────────────────────────────────

  /**
   * Create a CreditAmount from a number.
   * @throws Error if amount is not a non-negative integer
   */
  static create(amount: number): CreditAmount {
    return new CreditAmount(amount);
  }

  /**
   * Try to create a CreditAmount, returns null if invalid.
   */
  static tryCreate(amount: number): CreditAmount | null {
    try {
      return new CreditAmount(amount);
    } catch {
      return null;
    }
  }

  /**
   * Create a zero CreditAmount.
   */
  static zero(): CreditAmount {
    return new CreditAmount(0);
  }

  // ─── ACCESSORS ──────────────────────────────────────────────────────────────

  /**
   * Get the credit amount as a number.
   */
  toNumber(): number {
    return this.value;
  }

  /**
   * Get the raw value.
   */
  get rawValue(): number {
    return this.value;
  }

  // ─── ARITHMETIC OPERATIONS ──────────────────────────────────────────────────

  /**
   * Add another CreditAmount.
   */
  add(other: CreditAmount): CreditAmount {
    return new CreditAmount(this.value + other.value);
  }

  /**
   * Subtract another CreditAmount.
   * @throws Error if result would be negative
   */
  subtract(other: CreditAmount): CreditAmount {
    const result = this.value - other.value;
    if (result < 0) {
      throw new Error('Insufficient credits');
    }
    return new CreditAmount(result);
  }

  /**
   * Try to subtract, returns null if insufficient.
   */
  trySubtract(other: CreditAmount): CreditAmount | null {
    const result = this.value - other.value;
    if (result < 0) {
      return null;
    }
    return new CreditAmount(result);
  }

  /**
   * Multiply by a factor (rounds down).
   */
  multiply(factor: number): CreditAmount {
    const result = Math.floor(this.value * factor);
    return new CreditAmount(result);
  }

  // ─── COMPARISON ─────────────────────────────────────────────────────────────

  /**
   * Check if two CreditAmount values are equal.
   */
  equals(other: CreditAmount): boolean {
    return this.value === other.value;
  }

  /**
   * Check if this is zero.
   */
  isZero(): boolean {
    return this.value === 0;
  }

  /**
   * Check if this is positive.
   */
  isPositive(): boolean {
    return this.value > 0;
  }

  /**
   * Check if this is greater than another CreditAmount.
   */
  greaterThan(other: CreditAmount): boolean {
    return this.value > other.value;
  }

  /**
   * Check if this is greater than or equal to another CreditAmount.
   */
  greaterThanOrEqual(other: CreditAmount): boolean {
    return this.value >= other.value;
  }

  /**
   * Check if this is less than another CreditAmount.
   */
  lessThan(other: CreditAmount): boolean {
    return this.value < other.value;
  }

  /**
   * Check if this has enough credits for an operation.
   */
  hasSufficientFor(required: CreditAmount): boolean {
    return this.value >= required.value;
  }

  // ─── FORMATTING ─────────────────────────────────────────────────────────────

  /**
   * Format with locale-aware number formatting.
   */
  format(locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale).format(this.value);
  }

  /**
   * String representation.
   */
  toString(): string {
    return String(this.value);
  }

  // ─── SERIALIZATION ──────────────────────────────────────────────────────────

  /**
   * Convert to JSON.
   */
  toJSON(): number {
    return this.value;
  }
}

// ─── ZOD INTEGRATION ────────────────────────────────────────────────────────

/**
 * Zod schema that validates and transforms to CreditAmount value object.
 */
export const ZCreditAmount = z
  .number()
  .int('Credit amount must be an integer')
  .nonnegative('Credit amount cannot be negative')
  .transform((val) => CreditAmount.create(val));

/**
 * Zod schema for credit amount number (validates but doesn't transform).
 */
export const ZCreditAmountNumber = z
  .number()
  .int('Credit amount must be an integer')
  .nonnegative('Credit amount cannot be negative');
