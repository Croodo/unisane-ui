# @unisane/auth

Authentication flows: password, OTP, password reset, phone verification.

## Layer

**Layer 3 - Core**

## Overview

The auth module provides authentication primitives:

- Password-based signup/signin with scrypt hashing
- OTP (one-time password) email authentication
- Password reset flow with secure tokens
- Phone number verification
- Session management and CSRF protection
- Account lockout after failed attempts

## Installation

```bash
pnpm add @unisane/auth
```

## Usage

### Password Signup

```typescript
import { signup } from '@unisane/auth';

const { userId } = await signup({
  email: 'user@example.com',
  password: 'securePassword123',
  displayName: 'John Doe',
});
```

### Password Signin

```typescript
import { signin } from '@unisane/auth';

const { userId } = await signin({
  email: 'user@example.com',
  password: 'securePassword123',
});
```

### OTP Flow

```typescript
import { otpStart, otpVerify } from '@unisane/auth';

// Start OTP flow (sends email)
await otpStart({
  email: 'user@example.com',
  codeLen: 6,
  ttlSec: 300,
});

// Verify OTP code
const { userId } = await otpVerify({
  email: 'user@example.com',
  code: '123456',
});
```

### Password Reset

```typescript
import { resetStart, resetVerify } from '@unisane/auth';

// Start reset flow (sends email with token)
await resetStart({ email: 'user@example.com' });

// Verify and set new password
await resetVerify({
  email: 'user@example.com',
  token: 'reset-token-from-email',
  newPassword: 'newSecurePassword456',
});
```

### Phone Verification

```typescript
import { phoneStart, phoneVerify } from '@unisane/auth';

// Start phone verification (sends SMS)
await phoneStart({ userId: 'user_123', phone: '+15551234567' });

// Verify phone code
await phoneVerify({ userId: 'user_123', code: '123456' });
```

### Cache Keys

```typescript
import { authKeys } from '@unisane/auth';
import { kv } from '@unisane/kernel';

// Use standardized cache keys
const otpKey = authKeys.otpCode('user@example.com');
const sessionKey = authKeys.sessionById('session_123');
```

### Events

```typescript
import { events } from '@unisane/kernel';
import { AUTH_EVENTS } from '@unisane/auth';

events.on(AUTH_EVENTS.SIGNUP_COMPLETED, async ({ payload }) => {
  console.log('New signup:', payload.userId);
});

events.on(AUTH_EVENTS.SIGNIN_FAILED, async ({ payload }) => {
  console.log('Failed login attempt:', payload.email);
});

events.on(AUTH_EVENTS.ACCOUNT_LOCKED, async ({ payload }) => {
  console.log('Account locked:', payload.userId);
});
```

## Exports

### Services

| Function | Description |
|----------|-------------|
| `signup` | Create account with password |
| `signin` | Authenticate with password |
| `signout` | End user session |
| `otpStart` | Send OTP code via email |
| `otpVerify` | Verify OTP code |
| `resetStart` | Send password reset email |
| `resetVerify` | Verify reset token and set password |
| `phoneStart` | Send phone verification SMS |
| `phoneVerify` | Verify phone code |

### Factory Functions

| Function | Description |
|----------|-------------|
| `signupFactory` | Configurable signup handler |
| `signinFactory` | Configurable signin handler |
| `signoutFactory` | Configurable signout handler |
| `otpStartFactory` | Configurable OTP start handler |
| `otpVerifyFactory` | Configurable OTP verify handler |
| `resetStartFactory` | Configurable reset start handler |
| `resetVerifyFactory` | Configurable reset verify handler |
| `csrfFactory` | CSRF token handler factory |
| `tokenExchangeFactory` | Token exchange handler factory |

### Types

| Type | Description |
|------|-------------|
| `AuthCredentialView` | Credential record view |
| `ExchangeInput` | Token exchange input |
| `ExchangeResult` | Token exchange result |

### Constants

| Constant | Description |
|----------|-------------|
| `AUTH_EVENTS` | Event names |
| `AUTH_DEFAULTS` | Default values (OTP length, expiry, etc.) |
| `AUTH_COLLECTIONS` | Collection names |

### Error Classes

| Error | Description |
|-------|-------------|
| `InvalidCredentialsError` | Wrong email/password |
| `AccountLockedError` | Too many failed attempts |
| `OtpExpiredError` | OTP code expired |
| `OtpInvalidError` | Wrong OTP code |
| `OtpRateLimitError` | Too many OTP requests |
| `ResetTokenExpiredError` | Reset token expired |
| `ResetTokenInvalidError` | Invalid reset token |
| `CsrfMismatchError` | CSRF validation failed |
| `PhoneVerificationExpiredError` | Phone code expired |
| `PhoneVerificationInvalidError` | Wrong phone code |
| `PasswordTooWeakError` | Password doesn't meet requirements |

## Architecture

### Tenant Scoping Design

Auth credentials are **NOT tenant-scoped** - this is intentional:

- Authentication happens before tenant context is established
- A user's credentials are global (same password across all tenants)
- `tenantFilter()` is N/A for auth operations
- After authentication, tenant context is established via membership

### Security Features

1. **Password Hashing** - scrypt with unique salts
2. **Account Lockout** - Automatic lockout after failed attempts
3. **CSRF Protection** - Token-based CSRF validation
4. **Secure Tokens** - Cryptographically random reset tokens
5. **Rate Limiting** - OTP and reset request throttling

### Data Model

```typescript
// Auth Credential (password-based)
{
  id: string,
  userId: string,        // Reference to user
  emailNorm: string,     // Normalized email (unique)
  algo: 'scrypt',        // Hash algorithm
  salt: string,          // Base64 salt
  hash: string,          // Base64 hash
  passwordChangedAt: Date,
  failedLogins: number,  // Failed attempt counter
  lockedUntil?: Date,    // Account lockout expiry
}
```

## Dependencies

- `@unisane/kernel` - Core utilities, KV store, events
- `@unisane/identity` - User management, email normalization
- `@unisane/gateway` - Error responses

## Related Modules

- `@unisane/identity` - User and session management
- `@unisane/sso` - OAuth/SSO providers
- `@unisane/notify` - Email/SMS delivery
