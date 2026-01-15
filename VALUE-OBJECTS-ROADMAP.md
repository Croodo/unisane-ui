# Value Objects Roadmap

> **Purpose**: Define domain concepts as immutable Value Objects to eliminate duplication, ensure consistency, and improve type safety.
> **Status**: ✅ IMPLEMENTED (Core Value Objects)
> **Last Updated**: 2026-01-14

---

## Implementation Status

All high-priority value objects have been implemented in `kernel/src/value-objects/`:

| Value Object | File | Status | Features |
|--------------|------|--------|----------|
| **Email** | `email.ts` | ✅ Done | Normalization, domain extraction, search tokens, Zod integration |
| **Money** | `money.ts` | ✅ Done | BigInt precision, 20+ currencies, formatting, arithmetic |
| **PhoneE164** | `phone.ts` | ✅ Done | E.164 format, 00→+ conversion, country code extraction |
| **Slug** | `slug.ts` | ✅ Done | URL-safe, collision handling, 30+ reserved words |
| **Username** | `username.ts` | ✅ Done | Normalization, @ prefix handling, 20+ reserved words |

All are exported from `@unisane/kernel` with Zod integration schemas (`ZEmail`, `ZMoney`, `ZPhoneE164`, `ZSlug`, `ZUsername`).

---

## What Are Value Objects?

Value Objects are immutable domain concepts that:
- Have no identity (compared by value, not reference)
- Contain validation in constructor
- Provide domain-specific methods (`equals()`, `format()`, `isValid()`)
- Encapsulate related data together (e.g., amount + currency = Money)

### Constants vs Value Objects

| Aspect | Constants | Value Objects |
|--------|-----------|---------------|
| **Purpose** | Fixed labels/identifiers | Domain concepts with behavior |
| **Structure** | Simple strings/numbers | Objects with properties + methods |
| **Examples** | `'owner'`, `'active'`, `'prod'` | `Money`, `Email`, `PhoneE164` |
| **Behavior** | None | `equals()`, `format()`, `isValid()` |
| **Validation** | None | In constructor |

---

## Current State: ✅ Value Objects Implemented

The codebase now uses proper Value Objects:

```typescript
// New approach - Value Objects in kernel/src/value-objects/
import { Email, Money, PhoneE164, Slug, Username } from '@unisane/kernel';

const email = Email.create('User@Example.COM');
console.log(email.toString());  // "user@example.com"
console.log(email.domain);      // "example.com"

const price = Money.fromMajor(19.99, 'USD');
const total = price.add(price.multiply(0.1));
console.log(total.format());    // "$21.99"
```

**Benefits:**
- ✅ Validation in constructor (fail-fast)
- ✅ Immutable values (no accidental mutation)
- ✅ Domain methods (`equals()`, `format()`, domain-specific helpers)
- ✅ Zod integration for schema validation
- ✅ Search token support for encrypted storage

---

## Value Objects Reference

### Priority: HIGH

#### 1. Money

**Duplication Found:** 5+ locations

**Current Pattern (scattered):**
```typescript
// Appears everywhere as separate primitives
type Payment = { amount: number; currency: string; };
type TopupOption = { amount: number; currency: string; };
type Invoice = { amount: number; currency: string; };

// Conversion logic scattered
toMajorNumberCurrency(BigInt(amountTotal), currencyRaw)
creditsForPurchase(amountMajor, currencyRaw)
```

**Files Affected:**
- `kernel/src/constants/credits.ts` - TopupOption type
- `kernel/src/constants/plan.ts` - Plan pricing
- `billing/src/domain/types.ts` - PaymentView, InvoiceView
- `billing/src/domain/schemas.ts` - ZTopup
- `webhooks/src/inbound/stripe/handlers.ts` - Payment processing
- `webhooks/src/inbound/razorpay/handlers.ts` - Payment processing

**Target Value Object:**
```typescript
// kernel/src/value-objects/money.ts

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY';

export class Money {
  private constructor(
    private readonly minorUnits: bigint,
    public readonly currency: CurrencyCode
  ) {
    if (minorUnits < 0n) {
      throw new Error('Money amount cannot be negative');
    }
  }

  // Factory methods
  static fromMajor(amount: number, currency: CurrencyCode): Money {
    const decimals = Money.decimalsFor(currency);
    const minor = BigInt(Math.round(amount * Math.pow(10, decimals)));
    return new Money(minor, currency);
  }

  static fromMinor(amount: bigint, currency: CurrencyCode): Money {
    return new Money(amount, currency);
  }

  static zero(currency: CurrencyCode): Money {
    return new Money(0n, currency);
  }

  // Accessors
  toMajor(): number {
    const decimals = Money.decimalsFor(this.currency);
    return Number(this.minorUnits) / Math.pow(10, decimals);
  }

  toMinor(): bigint {
    return this.minorUnits;
  }

  // Operations
  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minorUnits + other.minorUnits, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minorUnits - other.minorUnits, this.currency);
  }

  multiply(factor: number): Money {
    const result = BigInt(Math.round(Number(this.minorUnits) * factor));
    return new Money(result, this.currency);
  }

  // Comparison
  equals(other: Money): boolean {
    return this.minorUnits === other.minorUnits && this.currency === other.currency;
  }

  isZero(): boolean {
    return this.minorUnits === 0n;
  }

  isPositive(): boolean {
    return this.minorUnits > 0n;
  }

  greaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.minorUnits > other.minorUnits;
  }

  // Formatting
  format(locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
    }).format(this.toMajor());
  }

  // Helpers
  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }

  private static decimalsFor(currency: CurrencyCode): number {
    const zeroDecimal = ['JPY', 'KRW', 'VND'];
    return zeroDecimal.includes(currency) ? 0 : 2;
  }

  // Serialization
  toJSON(): { amount: number; currency: string } {
    return { amount: this.toMajor(), currency: this.currency };
  }

  static fromJSON(json: { amount: number; currency: string }): Money {
    return Money.fromMajor(json.amount, json.currency as CurrencyCode);
  }
}
```

**Migration Checklist:**
- [ ] Create `kernel/src/value-objects/money.ts`
- [ ] Export from `kernel/src/index.ts`
- [ ] Update `billing/src/domain/types.ts` to use Money
- [ ] Update `billing/src/domain/schemas.ts` with Money transformer
- [ ] Update webhook handlers to use Money
- [ ] Update credits module to use Money for topup amounts
- [ ] Remove `kernel/src/utils/money.ts` utility functions
- [ ] Update tests

---

#### 2. Email

**Duplication Found:** 6+ locations

**Current Pattern (scattered):**
```typescript
// Different normalization approaches
email.trim().toLowerCase()           // suppression.repository.ts
normalizeEmail(email)                 // users.ts (uses utility)
email.toLowerCase()                   // resetVerify.ts
z.string().trim().email()             // schemas (Zod validation)
```

**Files Affected:**
- `kernel/src/utils/normalize.ts` - normalizeEmail function
- `notify/src/data/suppression.repository.mongo.ts` - inline normalization
- `identity/src/data/users.repository.mongo.ts` - inline normalization
- `identity/src/domain/schemas.ts` - Zod schema
- `identity/src/service/users.ts` - uses normalizeEmail
- `auth/src/service/resetVerify.ts` - inline normalization

**Target Value Object:**
```typescript
// kernel/src/value-objects/email.ts

export class Email {
  private readonly normalized: string;

  private constructor(email: string) {
    const trimmed = email.trim().toLowerCase();
    if (!Email.isValidFormat(trimmed)) {
      throw new Error(`Invalid email format: ${email}`);
    }
    this.normalized = trimmed;
  }

  // Factory
  static create(email: string): Email {
    return new Email(email);
  }

  static tryCreate(email: string): Email | null {
    try {
      return new Email(email);
    } catch {
      return null;
    }
  }

  // Validation
  private static isValidFormat(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static isValid(email: string): boolean {
    return Email.isValidFormat(email.trim().toLowerCase());
  }

  // Accessors
  toString(): string {
    return this.normalized;
  }

  get value(): string {
    return this.normalized;
  }

  get domain(): string {
    return this.normalized.split('@')[1] ?? '';
  }

  get localPart(): string {
    return this.normalized.split('@')[0] ?? '';
  }

  // Comparison
  equals(other: Email): boolean {
    return this.normalized === other.normalized;
  }

  equalsString(email: string): boolean {
    return this.normalized === email.trim().toLowerCase();
  }

  // For database storage
  toSearchToken(encryptionKey: string): string {
    // Implement HMAC-based search token
    return createSearchToken(this.normalized, encryptionKey);
  }
}

// Zod integration
export const ZEmail = z.string().transform((val) => Email.create(val));
```

**Migration Checklist:**
- [ ] Create `kernel/src/value-objects/email.ts`
- [ ] Export from `kernel/src/index.ts`
- [ ] Update `identity/src/domain/schemas.ts` to use ZEmail
- [ ] Update `notify/src/data/suppression.repository.mongo.ts`
- [ ] Update `identity/src/data/users.repository.mongo.ts`
- [ ] Update `auth/src/service/resetVerify.ts`
- [ ] Remove `normalizeEmail` from `kernel/src/utils/normalize.ts`
- [ ] Update tests

---

#### 3. PhoneE164

**Duplication Found:** 4+ locations

**Current Pattern (scattered):**
```typescript
// Regex duplicated
/^\+[1-9][0-9]{7,14}$/  // In normalize.ts AND schemas

// Normalization logic
phone.trim().replace(/[\s-]/g, "")
raw.startsWith("00") ? "+" + raw.slice(2) : raw
```

**Files Affected:**
- `kernel/src/utils/normalize.ts` - normalizePhoneE164 function
- `identity/src/domain/schemas.ts` - ZPhoneE164 schema
- `auth/src/domain/schemas.ts` - phone field
- `auth/src/service/phoneStart.ts` - uses normalizePhoneE164

**Target Value Object:**
```typescript
// kernel/src/value-objects/phone.ts

export class PhoneE164 {
  private static readonly PATTERN = /^\+[1-9][0-9]{7,14}$/;
  private readonly value: string;

  private constructor(phone: string) {
    const normalized = PhoneE164.normalize(phone);
    if (!PhoneE164.PATTERN.test(normalized)) {
      throw new Error(`Invalid E.164 phone number: ${phone}`);
    }
    this.value = normalized;
  }

  // Factory
  static create(phone: string): PhoneE164 {
    return new PhoneE164(phone);
  }

  static tryCreate(phone: string): PhoneE164 | null {
    try {
      return new PhoneE164(phone);
    } catch {
      return null;
    }
  }

  // Normalization
  private static normalize(phone: string): string {
    const raw = phone.trim().replace(/[\s\-()]/g, '');
    // Handle 00 prefix (international)
    if (raw.startsWith('00')) {
      return '+' + raw.slice(2);
    }
    return raw;
  }

  // Validation
  static isValid(phone: string): boolean {
    try {
      PhoneE164.create(phone);
      return true;
    } catch {
      return false;
    }
  }

  // Accessors
  toString(): string {
    return this.value;
  }

  get countryCode(): string {
    // Extract country code (simplified - real impl needs libphonenumber)
    const match = this.value.match(/^\+(\d{1,3})/);
    return match?.[1] ?? '';
  }

  // Comparison
  equals(other: PhoneE164): boolean {
    return this.value === other.value;
  }

  // Formatting (for display)
  format(): string {
    // Basic formatting - real impl would use libphonenumber
    return this.value;
  }
}

// Zod integration
export const ZPhoneE164 = z.string().transform((val) => PhoneE164.create(val));
```

**Migration Checklist:**
- [ ] Create `kernel/src/value-objects/phone.ts`
- [ ] Export from `kernel/src/index.ts`
- [ ] Update `identity/src/domain/schemas.ts` to use new ZPhoneE164
- [ ] Update `auth/src/domain/schemas.ts`
- [ ] Update `auth/src/service/phoneStart.ts`
- [ ] Remove `normalizePhoneE164` from `kernel/src/utils/normalize.ts`
- [ ] Update tests

---

### Priority: MEDIUM

#### 4. TenantSlug

**Duplication Found:** 3 locations

**Files Affected:**
- `kernel/src/utils/slug.ts` - toSlug function
- `identity/src/domain/schemas.ts` - slug regex
- `identity/src/service/tenants.ts` - collision handling

**Target Value Object:**
```typescript
// kernel/src/value-objects/slug.ts

export class TenantSlug {
  private static readonly PATTERN = /^[a-z0-9-]{2,80}$/;
  private readonly value: string;

  private constructor(slug: string) {
    if (!TenantSlug.PATTERN.test(slug)) {
      throw new Error(`Invalid slug format: ${slug}`);
    }
    this.value = slug;
  }

  // Factory
  static create(slug: string): TenantSlug {
    return new TenantSlug(slug);
  }

  static fromName(name: string): TenantSlug {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/--+/g, '-');
    return new TenantSlug(slug || 'workspace');
  }

  // For collision handling
  withSuffix(n: number): TenantSlug {
    return new TenantSlug(`${this.value}-${n}`);
  }

  // Accessors
  toString(): string {
    return this.value;
  }

  equals(other: TenantSlug): boolean {
    return this.value === other.value;
  }
}
```

**Migration Checklist:**
- [ ] Create `kernel/src/value-objects/slug.ts`
- [ ] Update `identity/src/service/tenants.ts` to use TenantSlug
- [ ] Remove `toSlug` from `kernel/src/utils/slug.ts`
- [ ] Update schemas

---

#### 5. Credits

**Files Affected:**
- `credits/src/domain/types.ts` - LedgerEntry
- `credits/src/domain/schemas.ts` - ZGrantTokens
- `credits/src/service/grant.ts` - GrantCreditsArgs

**Target Value Object:**
```typescript
// credits/src/domain/value-objects/credit-amount.ts

export class CreditAmount {
  private constructor(private readonly value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error('Credit amount must be a non-negative integer');
    }
  }

  static create(amount: number): CreditAmount {
    return new CreditAmount(amount);
  }

  static zero(): CreditAmount {
    return new CreditAmount(0);
  }

  toNumber(): number {
    return this.value;
  }

  add(other: CreditAmount): CreditAmount {
    return new CreditAmount(this.value + other.value);
  }

  subtract(other: CreditAmount): CreditAmount {
    const result = this.value - other.value;
    if (result < 0) {
      throw new Error('Insufficient credits');
    }
    return new CreditAmount(result);
  }

  equals(other: CreditAmount): boolean {
    return this.value === other.value;
  }

  isZero(): boolean {
    return this.value === 0;
  }

  greaterThan(other: CreditAmount): boolean {
    return this.value > other.value;
  }
}
```

---

#### 6. Username

**Duplication Found:** 4 locations

**Files Affected:**
- `kernel/src/utils/normalize.ts` - normalizeUsername
- `identity/src/domain/schemas.ts` - ZUsername
- `auth/src/domain/schemas.ts` - username field

**Target Value Object:**
```typescript
// kernel/src/value-objects/username.ts

export class Username {
  private static readonly PATTERN = /^[a-z0-9_.]{3,30}$/;
  private readonly value: string;

  private constructor(username: string) {
    const normalized = username.trim().toLowerCase().replace(/^@+/, '');
    if (!Username.PATTERN.test(normalized)) {
      throw new Error(`Invalid username: ${username}`);
    }
    this.value = normalized;
  }

  static create(username: string): Username {
    return new Username(username);
  }

  toString(): string {
    return this.value;
  }

  withAtSign(): string {
    return `@${this.value}`;
  }

  equals(other: Username): boolean {
    return this.value === other.value;
  }
}
```

---

#### 7. ApiKey

**Files Affected:**
- `identity/src/service/apiKeys.ts` - create and verify logic

**Target Value Object:**
```typescript
// identity/src/domain/value-objects/api-key.ts

export class ApiKey {
  private constructor(
    private readonly token: string,
    private readonly hash: string
  ) {}

  static generate(): { apiKey: ApiKey; plainToken: string } {
    const token = randomBytes(24).toString('base64url');
    const hash = createHash('sha256').update(token).digest('hex');
    return {
      apiKey: new ApiKey(token, hash),
      plainToken: token, // Only returned once!
    };
  }

  static fromHash(hash: string): ApiKey {
    return new ApiKey('', hash);
  }

  getHash(): string {
    return this.hash;
  }

  matches(plainToken: string): boolean {
    const tokenHash = createHash('sha256').update(plainToken).digest('hex');
    return timingSafeEqual(Buffer.from(this.hash), Buffer.from(tokenHash));
  }

  // Never expose the token after creation
  toString(): string {
    return `ApiKey(hash=${this.hash.slice(0, 8)}...)`;
  }
}
```

---

#### 8. BillingPeriod

**Files Affected:**
- `billing/src/domain/types.ts` - currentPeriodEnd
- `tenants/src/domain/types.ts` - LatestSub

**Target Value Object:**
```typescript
// billing/src/domain/value-objects/billing-period.ts

export class BillingPeriod {
  private constructor(
    public readonly start: Date,
    public readonly end: Date
  ) {
    if (end < start) {
      throw new Error('Period end must be after start');
    }
  }

  static create(start: Date, end: Date): BillingPeriod {
    return new BillingPeriod(start, end);
  }

  static fromEnd(end: Date, intervalMonths: number = 1): BillingPeriod {
    const start = new Date(end);
    start.setMonth(start.getMonth() - intervalMonths);
    return new BillingPeriod(start, end);
  }

  isActive(at: Date = new Date()): boolean {
    return at >= this.start && at <= this.end;
  }

  daysRemaining(at: Date = new Date()): number {
    const diff = this.end.getTime() - at.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  isExpired(at: Date = new Date()): boolean {
    return at > this.end;
  }

  equals(other: BillingPeriod): boolean {
    return this.start.getTime() === other.start.getTime() &&
           this.end.getTime() === other.end.getTime();
  }
}
```

---

### Priority: LOW

#### 9. Password

**Note:** Less duplication, but would benefit from encapsulation.

```typescript
// auth/src/domain/value-objects/password.ts

export class Password {
  private constructor(private readonly hash: string) {}

  static async fromPlaintext(
    plaintext: string,
    hasher: (p: string) => Promise<string>
  ): Promise<Password> {
    if (plaintext.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    const hash = await hasher(plaintext);
    return new Password(hash);
  }

  static fromHash(hash: string): Password {
    return new Password(hash);
  }

  getHash(): string {
    return this.hash;
  }

  async matches(
    plaintext: string,
    verifier: (plain: string, hash: string) => Promise<boolean>
  ): Promise<boolean> {
    return verifier(plaintext, this.hash);
  }
}
```

---

## Directory Structure

After implementation:

```
packages/foundation/kernel/src/
├── value-objects/
│   ├── index.ts           # Re-exports all VOs
│   ├── money.ts           # Money VO
│   ├── email.ts           # Email VO
│   ├── phone.ts           # PhoneE164 VO
│   ├── slug.ts            # TenantSlug VO
│   └── username.ts        # Username VO
├── constants/             # Keep for simple enums/labels
└── utils/                 # Remove migrated utilities

packages/modules/*/src/domain/
├── value-objects/         # Module-specific VOs
│   └── *.ts
├── constants.ts           # Module constants
├── types.ts               # Domain types (use VOs)
└── schemas.ts             # Zod schemas (integrate VOs)
```

---

## Migration Strategy

### Phase 1: Create Value Objects (No Breaking Changes)
1. Create VO classes alongside existing utilities
2. Add Zod integration (transform functions)
3. Write comprehensive tests

### Phase 2: Gradual Migration
1. Update one module at a time
2. Replace utility calls with VO usage
3. Update types to use VOs

### Phase 3: Cleanup
1. Remove deprecated utility functions
2. Update documentation
3. Final verification

---

## Verification Commands

```bash
# Find remaining utility function usage (should decrease over time)
grep -rn "normalizeEmail\|normalizePhoneE164\|normalizeUsername\|toSlug" packages/modules/

# Find inline email normalization (should be 0)
grep -rn "\.trim()\.toLowerCase()" packages/modules/*/src/ | grep -i email

# Find scattered money patterns (should be 0)
grep -rn "amount.*currency\|currency.*amount" packages/modules/*/src/domain/types.ts
```

---

## Summary

| Priority | Value Object | Duplication | Impact |
|----------|--------------|-------------|--------|
| HIGH | Money | 5+ | Billing correctness |
| HIGH | Email | 6+ | Auth/Identity consistency |
| HIGH | PhoneE164 | 4+ | Validation consistency |
| MEDIUM | TenantSlug | 3 | Uniqueness handling |
| MEDIUM | Credits | 3 | Domain clarity |
| MEDIUM | Username | 4 | Validation consistency |
| MEDIUM | ApiKey | 2 | Security encapsulation |
| MEDIUM | BillingPeriod | 3 | Period logic |
| LOW | Password | 2 | Security encapsulation |

**Total Duplication Eliminated:** ~30+ locations
**Estimated Effort:** 2-3 weeks for full implementation
