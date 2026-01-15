/**
 * BillingPeriod Value Object
 *
 * Represents a subscription billing period with start and end dates.
 * Provides utilities for checking active status and calculating remaining time.
 *
 * @example
 * ```typescript
 * import { BillingPeriod } from '@unisane/billing';
 *
 * const period = BillingPeriod.create(startDate, endDate);
 *
 * if (period.isActive()) {
 *   console.log(`${period.daysRemaining()} days left`);
 * }
 *
 * // Create from end date (common in Stripe webhooks)
 * const fromEnd = BillingPeriod.fromEnd(periodEndDate, 1);
 * ```
 */

import { z } from 'zod';

/**
 * BillingPeriod value object for subscription periods.
 *
 * Key features:
 * - Immutable start/end dates
 * - Active status checking
 * - Days remaining calculation
 * - Period duration utilities
 */
export class BillingPeriod {
  /**
   * Private constructor - use factory methods instead.
   */
  private constructor(
    public readonly start: Date,
    public readonly end: Date
  ) {
    if (end < start) {
      throw new Error('Period end must be after start');
    }
  }

  // ─── FACTORY METHODS ────────────────────────────────────────────────────────

  /**
   * Create a BillingPeriod from start and end dates.
   */
  static create(start: Date, end: Date): BillingPeriod {
    return new BillingPeriod(new Date(start), new Date(end));
  }

  /**
   * Try to create a BillingPeriod, returns null if invalid.
   */
  static tryCreate(start: Date, end: Date): BillingPeriod | null {
    try {
      return new BillingPeriod(new Date(start), new Date(end));
    } catch {
      return null;
    }
  }

  /**
   * Create a BillingPeriod from an end date and interval.
   * Common for Stripe webhooks that provide currentPeriodEnd.
   *
   * @param end - Period end date
   * @param intervalMonths - Number of months in the billing interval (default: 1)
   */
  static fromEnd(end: Date, intervalMonths: number = 1): BillingPeriod {
    const endDate = new Date(end);
    const startDate = new Date(end);
    startDate.setMonth(startDate.getMonth() - intervalMonths);
    return new BillingPeriod(startDate, endDate);
  }

  /**
   * Create a BillingPeriod from Unix timestamps (seconds).
   */
  static fromUnix(startUnix: number, endUnix: number): BillingPeriod {
    return new BillingPeriod(
      new Date(startUnix * 1000),
      new Date(endUnix * 1000)
    );
  }

  /**
   * Create a BillingPeriod for the current month.
   */
  static currentMonth(): BillingPeriod {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return new BillingPeriod(start, end);
  }

  // ─── STATUS CHECKS ──────────────────────────────────────────────────────────

  /**
   * Check if the period is currently active.
   */
  isActive(at: Date = new Date()): boolean {
    return at >= this.start && at <= this.end;
  }

  /**
   * Check if the period has expired.
   */
  isExpired(at: Date = new Date()): boolean {
    return at > this.end;
  }

  /**
   * Check if the period hasn't started yet.
   */
  isPending(at: Date = new Date()): boolean {
    return at < this.start;
  }

  // ─── DURATION CALCULATIONS ──────────────────────────────────────────────────

  /**
   * Get the number of days remaining in the period.
   */
  daysRemaining(at: Date = new Date()): number {
    if (at > this.end) return 0;
    const diffMs = this.end.getTime() - at.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Get the total duration of the period in days.
   */
  durationDays(): number {
    const diffMs = this.end.getTime() - this.start.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Get the total duration of the period in milliseconds.
   */
  durationMs(): number {
    return this.end.getTime() - this.start.getTime();
  }

  /**
   * Get the progress through the period as a percentage (0-100).
   */
  progressPercent(at: Date = new Date()): number {
    if (at <= this.start) return 0;
    if (at >= this.end) return 100;

    const total = this.end.getTime() - this.start.getTime();
    const elapsed = at.getTime() - this.start.getTime();
    return Math.round((elapsed / total) * 100);
  }

  // ─── PERIOD OPERATIONS ──────────────────────────────────────────────────────

  /**
   * Get the next billing period (same duration).
   */
  next(): BillingPeriod {
    const durationMs = this.durationMs();
    const nextStart = new Date(this.end.getTime() + 1);
    const nextEnd = new Date(nextStart.getTime() + durationMs);
    return new BillingPeriod(nextStart, nextEnd);
  }

  /**
   * Get the previous billing period (same duration).
   */
  previous(): BillingPeriod {
    const durationMs = this.durationMs();
    const prevEnd = new Date(this.start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - durationMs);
    return new BillingPeriod(prevStart, prevEnd);
  }

  /**
   * Check if a date falls within this period.
   */
  contains(date: Date): boolean {
    return date >= this.start && date <= this.end;
  }

  /**
   * Check if this period overlaps with another.
   */
  overlaps(other: BillingPeriod): boolean {
    return this.start <= other.end && this.end >= other.start;
  }

  // ─── COMPARISON ─────────────────────────────────────────────────────────────

  /**
   * Check if two BillingPeriods are equal.
   */
  equals(other: BillingPeriod): boolean {
    return (
      this.start.getTime() === other.start.getTime() &&
      this.end.getTime() === other.end.getTime()
    );
  }

  // ─── FORMATTING ─────────────────────────────────────────────────────────────

  /**
   * Format the period for display.
   */
  format(locale: string = 'en-US'): string {
    const opts: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    const startStr = this.start.toLocaleDateString(locale, opts);
    const endStr = this.end.toLocaleDateString(locale, opts);
    return `${startStr} - ${endStr}`;
  }

  /**
   * String representation.
   */
  toString(): string {
    return this.format();
  }

  // ─── SERIALIZATION ──────────────────────────────────────────────────────────

  /**
   * Convert to JSON.
   */
  toJSON(): { start: string; end: string } {
    return {
      start: this.start.toISOString(),
      end: this.end.toISOString(),
    };
  }

  /**
   * Create from JSON.
   */
  static fromJSON(json: { start: string; end: string }): BillingPeriod {
    return new BillingPeriod(new Date(json.start), new Date(json.end));
  }
}

// ─── ZOD INTEGRATION ────────────────────────────────────────────────────────

/**
 * Zod schema for BillingPeriod input.
 */
export const ZBillingPeriodInput = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
});

/**
 * Zod schema that validates and transforms to BillingPeriod value object.
 */
export const ZBillingPeriod = ZBillingPeriodInput.transform((val) =>
  BillingPeriod.create(val.start, val.end)
);
