# Advanced Features Documentation

> **Status:** AUTHORITATIVE
> **Last Updated:** 2025-01-06

This document covers advanced features that supplement the main [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Table of Contents

1. [Authentication Strategies](#authentication-strategies)
2. [Super-Admin Features](#super-admin-features)
3. [Notification System](#notification-system)
4. [Media Processing](#media-processing)
5. [PDF Generation](#pdf-generation)
6. [AI Provider System](#ai-provider-system)
7. [Query DSL](#query-dsl)
8. [Database Migrations](#database-migrations)
9. [Webhook Management](#webhook-management)
10. [Analytics Dashboard](#analytics-dashboard)

---

## Authentication Strategies

The auth module supports multiple authentication methods with consistent patterns.

### Password Authentication

```typescript
// auth/service/password.service.ts

import { ctx, events } from '@unisane/kernel';
import { hashPassword, verifyPassword, generateToken } from '../utils/crypto';
import { AuthRepo } from '../data';
import {
  InvalidCredentialsError,
  AccountLockedError,
  EmailNotVerifiedError,
} from '../domain/errors';

export async function signup(input: SignupInput): Promise<SignupResult> {
  const { email, password, name } = input;

  // Check for existing user
  const existing = await AuthRepo.findByEmail(email);
  if (existing) {
    throw new DuplicateError('User', email);
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await AuthRepo.createUser({
    email,
    passwordHash,
    name,
    emailVerified: false,
  });

  // Generate verification token
  const verificationToken = await generateToken('email_verification', {
    userId: user.id,
  });

  // Emit event for email sending
  await events.emit('auth.user.created', {
    version: 1,
    userId: user.id,
    email: user.email,
    verificationToken,
  });

  return { userId: user.id, requiresVerification: true };
}

export async function signin(input: SigninInput): Promise<SigninResult> {
  const { email, password } = input;

  const user = await AuthRepo.findByEmail(email);
  if (!user) {
    throw new InvalidCredentialsError();
  }

  // Check account lock
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AccountLockedError(user.lockedUntil);
  }

  // Verify password
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    // Increment failed attempts
    await AuthRepo.incrementFailedAttempts(user.id);
    throw new InvalidCredentialsError();
  }

  // Check email verification (configurable)
  if (!user.emailVerified && config.requireEmailVerification) {
    throw new EmailNotVerifiedError();
  }

  // Reset failed attempts
  await AuthRepo.resetFailedAttempts(user.id);

  // Create session
  const session = await createSession(user);

  return {
    session,
    user: sanitizeUser(user),
  };
}
```

### OTP (Email/Magic Link) Authentication

```typescript
// auth/service/otp.service.ts

import { ctx, events, cache } from '@unisane/kernel';
import { generateOTP, generateSecureToken } from '../utils/crypto';
import { OTPExpiredError, OTPInvalidError, OTPRateLimitError } from '../domain/errors';

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const OTP_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const OTP_MAX_ATTEMPTS = 3;

export async function otpStart(input: OTPStartInput): Promise<OTPStartResult> {
  const { email, type } = input; // type: 'code' | 'link'

  // Rate limiting
  const rateLimitKey = `otp:ratelimit:${email}`;
  const recentAttempts = await cache.get<number>(rateLimitKey);
  if (recentAttempts && recentAttempts >= 3) {
    throw new OTPRateLimitError();
  }

  // Find or create user
  let user = await AuthRepo.findByEmail(email);
  if (!user) {
    // Create passwordless user
    user = await AuthRepo.createUser({
      email,
      passwordHash: null, // No password for OTP-only users
      emailVerified: true, // Verified by OTP
    });
  }

  // Generate OTP
  const code = type === 'code' ? generateOTP(6) : null;
  const token = generateSecureToken();

  // Store OTP
  const otpKey = `otp:${token}`;
  await cache.set(otpKey, {
    userId: user.id,
    email,
    code,
    attempts: 0,
    createdAt: Date.now(),
  }, OTP_EXPIRY_MS);

  // Increment rate limit
  await cache.set(rateLimitKey, (recentAttempts || 0) + 1, OTP_RATE_LIMIT_WINDOW_MS);

  // Emit event for email
  if (type === 'code') {
    await events.emit('auth.otp.requested', {
      version: 1,
      email,
      code,
      expiresIn: OTP_EXPIRY_MS,
    });
  } else {
    await events.emit('auth.magic_link.requested', {
      version: 1,
      email,
      token,
      expiresIn: OTP_EXPIRY_MS,
    });
  }

  return { token, expiresIn: OTP_EXPIRY_MS };
}

export async function otpVerify(input: OTPVerifyInput): Promise<OTPVerifyResult> {
  const { token, code } = input;

  const otpKey = `otp:${token}`;
  const otpData = await cache.get<OTPData>(otpKey);

  if (!otpData) {
    throw new OTPExpiredError();
  }

  // Check expiry
  if (Date.now() - otpData.createdAt > OTP_EXPIRY_MS) {
    await cache.del(otpKey);
    throw new OTPExpiredError();
  }

  // For code-based OTP, verify code
  if (otpData.code && otpData.code !== code) {
    otpData.attempts++;

    if (otpData.attempts >= OTP_MAX_ATTEMPTS) {
      await cache.del(otpKey);
      throw new OTPInvalidError('Maximum attempts exceeded');
    }

    await cache.set(otpKey, otpData, OTP_EXPIRY_MS - (Date.now() - otpData.createdAt));
    throw new OTPInvalidError();
  }

  // Delete OTP (one-time use)
  await cache.del(otpKey);

  // Create session
  const user = await AuthRepo.findById(otpData.userId);
  const session = await createSession(user!);

  return {
    session,
    user: sanitizeUser(user!),
  };
}
```

### Phone Authentication

```typescript
// auth/service/phone.service.ts

import { ctx, events, cache } from '@unisane/kernel';
import { generateOTP } from '../utils/crypto';
import { PhoneOTPExpiredError, PhoneOTPInvalidError, PhoneRateLimitError } from '../domain/errors';

const PHONE_OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const PHONE_OTP_LENGTH = 6;

export interface PhoneStartInput {
  phone: string;
  countryCode: string;
}

export interface PhoneVerifyInput {
  token: string;
  code: string;
}

export async function phoneStart(input: PhoneStartInput): Promise<{ token: string; expiresIn: number }> {
  const { phone, countryCode } = input;
  const fullPhone = `${countryCode}${phone}`;

  // Rate limiting (stricter for SMS due to cost)
  const rateLimitKey = `phone:ratelimit:${fullPhone}`;
  const recentAttempts = await cache.get<number>(rateLimitKey);
  if (recentAttempts && recentAttempts >= 2) {
    throw new PhoneRateLimitError();
  }

  // Find or create user by phone
  let user = await AuthRepo.findByPhone(fullPhone);
  if (!user) {
    user = await AuthRepo.createUser({
      phone: fullPhone,
      passwordHash: null,
      phoneVerified: true,
    });
  }

  // Generate OTP and token
  const code = generateOTP(PHONE_OTP_LENGTH);
  const token = generateSecureToken();

  // Store OTP data
  const otpKey = `phone:otp:${token}`;
  await cache.set(otpKey, {
    userId: user.id,
    phone: fullPhone,
    code,
    attempts: 0,
    createdAt: Date.now(),
  }, PHONE_OTP_EXPIRY_MS);

  // Increment rate limit (longer window for SMS)
  await cache.set(rateLimitKey, (recentAttempts || 0) + 1, 5 * 60 * 1000); // 5 min window

  // Emit event for SMS sending
  await events.emit('auth.phone_otp.requested', {
    version: 1,
    phone: fullPhone,
    code,
    expiresIn: PHONE_OTP_EXPIRY_MS,
  });

  return { token, expiresIn: PHONE_OTP_EXPIRY_MS };
}

export async function phoneVerify(input: PhoneVerifyInput): Promise<PhoneVerifyResult> {
  const { token, code } = input;

  const otpKey = `phone:otp:${token}`;
  const otpData = await cache.get<PhoneOTPData>(otpKey);

  if (!otpData) {
    throw new PhoneOTPExpiredError();
  }

  // Check expiry
  if (Date.now() - otpData.createdAt > PHONE_OTP_EXPIRY_MS) {
    await cache.del(otpKey);
    throw new PhoneOTPExpiredError();
  }

  // Verify code
  if (otpData.code !== code) {
    otpData.attempts++;

    if (otpData.attempts >= 3) {
      await cache.del(otpKey);
      throw new PhoneOTPInvalidError('Maximum attempts exceeded');
    }

    await cache.set(otpKey, otpData, PHONE_OTP_EXPIRY_MS - (Date.now() - otpData.createdAt));
    throw new PhoneOTPInvalidError();
  }

  // Delete OTP
  await cache.del(otpKey);

  // Create session
  const user = await AuthRepo.findById(otpData.userId);
  const session = await createSession(user!);

  return {
    session,
    user: sanitizeUser(user!),
  };
}
```

### SMS Provider Interface

```typescript
// platform/providers/sms/types.ts

export interface SMSProvider {
  send(input: SendSMSInput): Promise<SendSMSResult>;
  getDeliveryStatus(messageId: string): Promise<DeliveryStatus>;
}

export interface SendSMSInput {
  to: string;
  body: string;
  from?: string;
}

export interface SendSMSResult {
  messageId: string;
  status: 'queued' | 'sent' | 'failed';
}

// platform/providers/sms/twilio.ts

import Twilio from 'twilio';
import type { SMSProvider, SendSMSInput } from './types';

export function createTwilioProvider(
  accountSid: string,
  authToken: string,
  fromNumber: string
): SMSProvider {
  const client = Twilio(accountSid, authToken);

  return {
    async send(input: SendSMSInput) {
      const message = await client.messages.create({
        body: input.body,
        to: input.to,
        from: input.from || fromNumber,
      });

      return {
        messageId: message.sid,
        status: message.status === 'queued' ? 'queued' : 'sent',
      };
    },

    async getDeliveryStatus(messageId: string) {
      const message = await client.messages(messageId).fetch();
      return {
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
      };
    },
  };
}
```

### Password Reset Flow

```typescript
// auth/service/reset.service.ts

export async function resetStart(input: ResetStartInput): Promise<void> {
  const { email } = input;

  const user = await AuthRepo.findByEmail(email);

  // Always return success (security: don't reveal if email exists)
  if (!user) {
    return;
  }

  // Generate reset token
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Store reset token
  await AuthRepo.createResetToken({
    userId: user.id,
    token: await hashToken(token),
    expiresAt,
  });

  // Emit event for email
  await events.emit('auth.password_reset.requested', {
    version: 1,
    email: user.email,
    token, // unhashed for email
    expiresAt,
  });
}

export async function resetVerify(input: ResetVerifyInput): Promise<ResetVerifyResult> {
  const { token, newPassword } = input;

  // Find token
  const resetToken = await AuthRepo.findResetToken(await hashToken(token));

  if (!resetToken) {
    throw new InvalidResetTokenError();
  }

  if (resetToken.expiresAt < new Date()) {
    await AuthRepo.deleteResetToken(resetToken.id);
    throw new ResetTokenExpiredError();
  }

  // Update password
  const passwordHash = await hashPassword(newPassword);
  await AuthRepo.updateUser(resetToken.userId, { passwordHash });

  // Delete token (one-time use)
  await AuthRepo.deleteResetToken(resetToken.id);

  // Revoke all sessions (security)
  await AuthRepo.revokeAllSessions(resetToken.userId);

  // Emit event
  await events.emit('auth.password.changed', {
    version: 1,
    userId: resetToken.userId,
  });

  return { success: true };
}
```

### Session Management

```typescript
// auth/service/session.service.ts

import { cache } from '@unisane/kernel';
import { generateSecureToken, signJWT } from '../utils/crypto';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createSession(user: User): Promise<Session> {
  const sessionId = generateSecureToken();

  const session: Session = {
    id: sessionId,
    userId: user.id,
    tenantId: user.defaultTenantId,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    lastActiveAt: new Date(),
  };

  // Store session
  await AuthRepo.createSession(session);

  // Generate JWT for stateless validation
  const token = signJWT({
    sub: user.id,
    sid: sessionId,
    tid: user.defaultTenantId,
    exp: Math.floor(session.expiresAt.getTime() / 1000),
  });

  return {
    ...session,
    token,
  };
}

export async function validateSession(sessionId: string): Promise<Session | null> {
  const session = await AuthRepo.findSession(sessionId);

  if (!session) {
    return null;
  }

  // Check expiry
  if (session.expiresAt < new Date()) {
    await AuthRepo.deleteSession(sessionId);
    return null;
  }

  // Check if revoked (sessionsRevokedAt check)
  const user = await AuthRepo.findById(session.userId);
  if (user?.sessionsRevokedAt && session.createdAt < user.sessionsRevokedAt) {
    await AuthRepo.deleteSession(sessionId);
    return null;
  }

  // Update last active (throttled)
  const shouldUpdate = Date.now() - session.lastActiveAt.getTime() > 5 * 60 * 1000;
  if (shouldUpdate) {
    await AuthRepo.updateSession(sessionId, { lastActiveAt: new Date() });
  }

  return session;
}

export async function revokeAllSessions(userId: string): Promise<void> {
  // Set revocation timestamp (invalidates all sessions created before this time)
  await AuthRepo.updateUser(userId, {
    sessionsRevokedAt: new Date(),
  });

  // Optionally, also delete session records
  await AuthRepo.deleteUserSessions(userId);
}
```

---

## Super-Admin Features

### Tenant Impersonation

Super-admins can impersonate tenants for debugging and support purposes.

```typescript
// tenants/service/impersonation.service.ts

import { ctx, events, audit, logger } from '@unisane/kernel';
import { ForbiddenError, NotFoundError } from '@unisane/kernel/errors';
import { SUPER_ADMIN_ROLE } from '../domain/constants';

export interface ImpersonationSession {
  originalUserId: string;
  originalTenantId: string;
  impersonatedTenantId: string;
  reason: string;
  startedAt: Date;
  expiresAt: Date;
}

const IMPERSONATION_MAX_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function startImpersonation(input: StartImpersonationInput): Promise<ImpersonationSession> {
  const { targetTenantId, reason } = input;
  const context = ctx.get();

  // Verify super-admin
  if (context.role !== SUPER_ADMIN_ROLE) {
    throw new ForbiddenError('Only super-admins can impersonate tenants');
  }

  // Verify target tenant exists
  const tenant = await TenantsRepo.findById(targetTenantId);
  if (!tenant) {
    throw new NotFoundError('Tenant', targetTenantId);
  }

  // Create impersonation session
  const session: ImpersonationSession = {
    originalUserId: context.userId!,
    originalTenantId: context.tenantId!,
    impersonatedTenantId: targetTenantId,
    reason,
    startedAt: new Date(),
    expiresAt: new Date(Date.now() + IMPERSONATION_MAX_DURATION_MS),
  };

  // Store session in cache
  const sessionKey = `impersonation:${context.userId}`;
  await cache.set(sessionKey, session, IMPERSONATION_MAX_DURATION_MS);

  // Audit log (CRITICAL)
  await audit.log({
    action: 'tenant.impersonation.started',
    actor: {
      userId: context.userId!,
      role: SUPER_ADMIN_ROLE,
    },
    target: {
      type: 'tenant',
      id: targetTenantId,
    },
    details: {
      reason,
      expiresAt: session.expiresAt,
    },
    severity: 'high',
  });

  // Emit event for monitoring/alerting
  await events.emit('admin.impersonation.started', {
    version: 1,
    adminUserId: context.userId!,
    targetTenantId,
    reason,
    startedAt: session.startedAt,
    expiresAt: session.expiresAt,
  });

  logger.warn('Tenant impersonation started', {
    adminUserId: context.userId,
    targetTenantId,
    reason,
  });

  return session;
}

export async function endImpersonation(): Promise<void> {
  const context = ctx.get();
  const sessionKey = `impersonation:${context.userId}`;

  const session = await cache.get<ImpersonationSession>(sessionKey);
  if (!session) {
    return; // No active impersonation
  }

  // Delete session
  await cache.del(sessionKey);

  // Audit log
  await audit.log({
    action: 'tenant.impersonation.ended',
    actor: {
      userId: context.userId!,
      role: SUPER_ADMIN_ROLE,
    },
    target: {
      type: 'tenant',
      id: session.impersonatedTenantId,
    },
    details: {
      duration: Date.now() - session.startedAt.getTime(),
    },
    severity: 'high',
  });

  // Emit event
  await events.emit('admin.impersonation.ended', {
    version: 1,
    adminUserId: context.userId!,
    targetTenantId: session.impersonatedTenantId,
    duration: Date.now() - session.startedAt.getTime(),
  });
}

export async function getActiveImpersonation(userId: string): Promise<ImpersonationSession | null> {
  const sessionKey = `impersonation:${userId}`;
  return cache.get<ImpersonationSession>(sessionKey);
}
```

### Gateway Integration for Impersonation

```typescript
// gateway/src/auth/impersonation.ts

import { ctx } from '@unisane/kernel';
import { getActiveImpersonation } from '@unisane/tenants';

/**
 * Middleware to apply impersonation context if active.
 * Must run AFTER authentication but BEFORE authorization.
 */
export async function applyImpersonationContext(): Promise<void> {
  const context = ctx.get();

  if (!context.userId) {
    return;
  }

  const impersonation = await getActiveImpersonation(context.userId);

  if (impersonation) {
    // Check if expired
    if (impersonation.expiresAt < new Date()) {
      await endImpersonation();
      return;
    }

    // Switch tenant context
    ctx.set({
      tenantId: impersonation.impersonatedTenantId,
      isImpersonating: true,
      originalTenantId: impersonation.originalTenantId,
    });
  }
}
```

### Super-Admin Permission Overlays

```typescript
// identity/service/permissions.service.ts

import { ctx } from '@unisane/kernel';
import { SUPER_ADMIN_ROLE, GLOBAL_PERMISSION_OVERLAY } from '../domain/constants';

/**
 * Compute effective permissions including global overlays for super-admins.
 */
export function computeEffectivePermissions(
  basePermissions: string[],
  role: string
): string[] {
  // Super-admins get all permissions
  if (role === SUPER_ADMIN_ROLE) {
    return ['*']; // Wildcard for all permissions
  }

  // Apply global overlays (platform-wide permission modifications)
  const overlays = GLOBAL_PERMISSION_OVERLAY[role] || [];

  return [...new Set([...basePermissions, ...overlays])];
}

/**
 * Check if current user has super-admin access.
 */
export function isSuperAdmin(): boolean {
  const context = ctx.tryGet();
  return context?.role === SUPER_ADMIN_ROLE;
}

/**
 * Guard function for super-admin only operations.
 */
export function assertSuperAdmin(): void {
  if (!isSuperAdmin()) {
    throw new ForbiddenError('Super-admin access required');
  }
}
```

---

## Notification System

### In-App Notifications (Real-time)

```typescript
// notify/service/inapp.service.ts

import { ctx, events, cache, logger } from '@unisane/kernel';
import { NotifyRepo } from '../data';

export interface InAppNotification {
  id: string;
  userId: string;
  tenantId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

/**
 * Send an in-app notification.
 * Stores in DB and publishes to Redis for real-time delivery.
 */
export async function sendInAppNotification(input: SendInAppInput): Promise<InAppNotification> {
  const { userId, type, title, body, data } = input;
  const context = ctx.get();

  // Create notification record
  const notification = await NotifyRepo.createNotification({
    userId,
    tenantId: context.tenantId!,
    type,
    title,
    body,
    data,
    read: false,
    createdAt: new Date(),
  });

  // Publish to Redis pub/sub for real-time delivery
  const channel = `notifications:${userId}`;
  await publishToChannel(channel, {
    type: 'NEW_NOTIFICATION',
    payload: notification,
  });

  logger.debug('In-app notification sent', {
    notificationId: notification.id,
    userId,
    type,
  });

  return notification;
}

/**
 * Get notification stream for real-time updates.
 * Returns an async iterator for Server-Sent Events.
 */
export async function* inAppNotificationStream(userId: string): AsyncGenerator<InAppNotification> {
  const channel = `notifications:${userId}`;

  // Subscribe to Redis channel
  const subscriber = await subscribeToChannel(channel);

  try {
    for await (const message of subscriber) {
      if (message.type === 'NEW_NOTIFICATION') {
        yield message.payload as InAppNotification;
      }
    }
  } finally {
    await subscriber.unsubscribe();
  }
}

/**
 * Mark notifications as read.
 */
export async function markAsRead(notificationIds: string[]): Promise<void> {
  const context = ctx.get();

  await NotifyRepo.markAsRead(notificationIds, context.userId!);
}

/**
 * Get user notifications with pagination.
 */
export async function getUserNotifications(
  userId: string,
  options: { limit?: number; cursor?: string; unreadOnly?: boolean }
): Promise<{ notifications: InAppNotification[]; nextCursor?: string }> {
  return NotifyRepo.findByUser(userId, options);
}

/**
 * Get unread count for badge display.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return NotifyRepo.countUnread(userId);
}
```

### Redis Pub/Sub Integration

```typescript
// notify/data/pubsub.ts

import { Redis } from 'ioredis';
import { env } from '@/platform/config/env';

let publisher: Redis | null = null;
let subscriberPool: Map<string, Redis> = new Map();

export function getPublisher(): Redis {
  if (!publisher) {
    publisher = new Redis(env.REDIS_URL);
  }
  return publisher;
}

export async function publishToChannel(channel: string, message: unknown): Promise<void> {
  const pub = getPublisher();
  await pub.publish(channel, JSON.stringify(message));
}

export async function* subscribeToChannel(channel: string): AsyncGenerator<any> {
  const subscriber = new Redis(env.REDIS_URL);
  subscriberPool.set(channel, subscriber);

  await subscriber.subscribe(channel);

  const messageQueue: unknown[] = [];
  let resolver: ((value: unknown) => void) | null = null;

  subscriber.on('message', (ch, message) => {
    if (ch === channel) {
      const parsed = JSON.parse(message);
      if (resolver) {
        resolver(parsed);
        resolver = null;
      } else {
        messageQueue.push(parsed);
      }
    }
  });

  try {
    while (true) {
      if (messageQueue.length > 0) {
        yield messageQueue.shift();
      } else {
        yield await new Promise((resolve) => {
          resolver = resolve;
        });
      }
    }
  } finally {
    await subscriber.unsubscribe(channel);
    subscriber.disconnect();
    subscriberPool.delete(channel);
  }
}
```

### Suppression List Management

```typescript
// notify/service/suppression.service.ts

import { ctx, logger } from '@unisane/kernel';
import { SuppressionRepo } from '../data';

export type SuppressionReason =
  | 'hard_bounce'
  | 'complaint'
  | 'unsubscribe'
  | 'manual';

export interface SuppressionEntry {
  email: string;
  reason: SuppressionReason;
  source: string;
  createdAt: Date;
}

/**
 * Add email to suppression list.
 * Called automatically on bounces/complaints from email provider webhooks.
 */
export async function addToSuppressionList(
  email: string,
  reason: SuppressionReason,
  source: string
): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if already suppressed
  const existing = await SuppressionRepo.findByEmail(normalizedEmail);
  if (existing) {
    logger.debug('Email already suppressed', { email: normalizedEmail });
    return;
  }

  await SuppressionRepo.create({
    email: normalizedEmail,
    reason,
    source,
    createdAt: new Date(),
  });

  logger.info('Email added to suppression list', {
    email: normalizedEmail,
    reason,
    source,
  });
}

/**
 * Remove email from suppression list.
 * Use with caution - should typically only be done manually.
 */
export async function removeFromSuppressionList(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();

  const deleted = await SuppressionRepo.delete(normalizedEmail);

  if (deleted) {
    logger.info('Email removed from suppression list', { email: normalizedEmail });
  }

  return deleted;
}

/**
 * Check if email is suppressed before sending.
 */
export async function isEmailSuppressed(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  const entry = await SuppressionRepo.findByEmail(normalizedEmail);
  return entry !== null;
}

/**
 * Get suppression entry details.
 */
export async function getSuppressionEntry(email: string): Promise<SuppressionEntry | null> {
  return SuppressionRepo.findByEmail(email.toLowerCase().trim());
}

/**
 * List all suppressed emails (admin function).
 */
export async function listSuppressionList(
  options: { limit?: number; cursor?: string; reason?: SuppressionReason }
): Promise<{ entries: SuppressionEntry[]; nextCursor?: string }> {
  return SuppressionRepo.list(options);
}
```

### User Notification Preferences

```typescript
// notify/service/preferences.service.ts

import { ctx } from '@unisane/kernel';
import { PreferencesRepo } from '../data';

export interface NotificationPreferences {
  email: {
    marketing: boolean;
    product: boolean;
    billing: boolean;
    security: boolean;
  };
  inApp: {
    enabled: boolean;
    categories: string[];
  };
  push: {
    enabled: boolean;
    categories: string[];
  };
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email: {
    marketing: false,
    product: true,
    billing: true,
    security: true,
  },
  inApp: {
    enabled: true,
    categories: ['*'],
  },
  push: {
    enabled: false,
    categories: [],
  },
};

export async function getUserPreferences(userId: string): Promise<NotificationPreferences> {
  const stored = await PreferencesRepo.findByUserId(userId);
  return stored || DEFAULT_PREFERENCES;
}

export async function updateUserPreferences(
  userId: string,
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const current = await getUserPreferences(userId);

  const updated: NotificationPreferences = {
    email: { ...current.email, ...updates.email },
    inApp: { ...current.inApp, ...updates.inApp },
    push: { ...current.push, ...updates.push },
  };

  await PreferencesRepo.upsert(userId, updated);

  return updated;
}

/**
 * Check if user should receive a specific notification type.
 */
export async function shouldSendNotification(
  userId: string,
  channel: 'email' | 'inApp' | 'push',
  category: string
): Promise<boolean> {
  const prefs = await getUserPreferences(userId);

  if (channel === 'email') {
    return prefs.email[category as keyof typeof prefs.email] ?? false;
  }

  if (channel === 'inApp') {
    if (!prefs.inApp.enabled) return false;
    return prefs.inApp.categories.includes('*') || prefs.inApp.categories.includes(category);
  }

  if (channel === 'push') {
    if (!prefs.push.enabled) return false;
    return prefs.push.categories.includes('*') || prefs.push.categories.includes(category);
  }

  return false;
}
```

---

## Media Processing

### Image Transformation Pipeline

```typescript
// media/service/transform.service.ts

import sharp, { Sharp, FitEnum, FormatEnum } from 'sharp';
import { ctx, logger, cache } from '@unisane/kernel';
import { StorageRepo } from '@unisane/storage';
import { MediaRepo } from '../data';

export interface TransformOptions {
  width?: number;
  height?: number;
  fit?: keyof FitEnum;
  format?: keyof FormatEnum;
  quality?: number;
  blur?: number;
  grayscale?: boolean;
  rotate?: number;
}

export interface TransformPreset {
  name: string;
  options: TransformOptions;
}

// Pre-defined presets for common use cases
export const PRESETS: Record<string, TransformPreset> = {
  thumbnail: {
    name: 'thumbnail',
    options: { width: 150, height: 150, fit: 'cover', format: 'webp', quality: 80 },
  },
  avatar: {
    name: 'avatar',
    options: { width: 200, height: 200, fit: 'cover', format: 'webp', quality: 85 },
  },
  preview: {
    name: 'preview',
    options: { width: 400, height: 400, fit: 'inside', format: 'webp', quality: 85 },
  },
  og_image: {
    name: 'og_image',
    options: { width: 1200, height: 630, fit: 'cover', format: 'png', quality: 90 },
  },
  full_hd: {
    name: 'full_hd',
    options: { width: 1920, height: 1080, fit: 'inside', format: 'webp', quality: 90 },
  },
};

/**
 * Check if Sharp is available (requires native dependencies).
 */
export function isSharpAvailable(): boolean {
  try {
    sharp();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get image metadata without fully loading the image.
 */
export async function getImageMetadata(input: Buffer | string): Promise<ImageMetadata> {
  const image = typeof input === 'string'
    ? sharp(await fetchImageBuffer(input))
    : sharp(input);

  const metadata = await image.metadata();

  return {
    width: metadata.width!,
    height: metadata.height!,
    format: metadata.format!,
    size: metadata.size,
    hasAlpha: metadata.hasAlpha ?? false,
    orientation: metadata.orientation,
    exif: metadata.exif,
  };
}

/**
 * Transform an image with custom options.
 */
export async function transformImage(
  input: Buffer | string,
  options: TransformOptions
): Promise<Buffer> {
  const inputBuffer = typeof input === 'string'
    ? await fetchImageBuffer(input)
    : input;

  let image = sharp(inputBuffer);

  // Apply transformations
  if (options.rotate) {
    image = image.rotate(options.rotate);
  }

  if (options.width || options.height) {
    image = image.resize({
      width: options.width,
      height: options.height,
      fit: options.fit || 'inside',
      withoutEnlargement: true,
    });
  }

  if (options.grayscale) {
    image = image.grayscale();
  }

  if (options.blur && options.blur > 0) {
    image = image.blur(options.blur);
  }

  // Output format
  const format = options.format || 'webp';
  const quality = options.quality || 80;

  switch (format) {
    case 'webp':
      image = image.webp({ quality });
      break;
    case 'jpeg':
    case 'jpg':
      image = image.jpeg({ quality });
      break;
    case 'png':
      image = image.png({ quality });
      break;
    case 'avif':
      image = image.avif({ quality });
      break;
  }

  return image.toBuffer();
}

/**
 * Transform image using a preset.
 */
export async function transformWithPreset(
  input: Buffer | string,
  presetName: string
): Promise<Buffer> {
  const preset = PRESETS[presetName];
  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}`);
  }

  return transformImage(input, preset.options);
}

/**
 * Generate multiple image variants at once.
 */
export async function generateVariants(
  input: Buffer | string,
  presetNames: string[]
): Promise<Map<string, Buffer>> {
  const results = new Map<string, Buffer>();

  // Process in parallel
  await Promise.all(
    presetNames.map(async (presetName) => {
      const buffer = await transformWithPreset(input, presetName);
      results.set(presetName, buffer);
    })
  );

  return results;
}

/**
 * Optimize image for web delivery.
 */
export async function optimizeImage(
  input: Buffer | string,
  targetFormat: 'webp' | 'avif' = 'webp',
  maxWidth: number = 2000
): Promise<Buffer> {
  const inputBuffer = typeof input === 'string'
    ? await fetchImageBuffer(input)
    : input;

  const metadata = await sharp(inputBuffer).metadata();

  let image = sharp(inputBuffer);

  // Resize if too large
  if (metadata.width && metadata.width > maxWidth) {
    image = image.resize({ width: maxWidth, withoutEnlargement: true });
  }

  // Convert to target format with optimal settings
  if (targetFormat === 'webp') {
    return image.webp({ quality: 85, effort: 4 }).toBuffer();
  } else {
    return image.avif({ quality: 80, effort: 4 }).toBuffer();
  }
}

// Helper to fetch image from URL
async function fetchImageBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}
```

### Avatar Generation

```typescript
// media/service/avatar.service.ts

import { createHash } from 'crypto';

interface AvatarOptions {
  size?: number;
  background?: string;
  color?: string;
  rounded?: boolean;
}

/**
 * Generate SVG avatar with initials.
 */
export function generateAvatarSvg(
  name: string,
  options: AvatarOptions = {}
): string {
  const {
    size = 100,
    background = generateBackgroundColor(name),
    color = '#ffffff',
    rounded = true,
  } = options;

  const initials = getInitials(name);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${rounded
        ? `<circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${background}"/>`
        : `<rect width="${size}" height="${size}" fill="${background}"/>`
      }
      <text
        x="50%"
        y="50%"
        dominant-baseline="central"
        text-anchor="middle"
        fill="${color}"
        font-family="system-ui, sans-serif"
        font-size="${size * 0.4}"
        font-weight="600"
      >${initials}</text>
    </svg>
  `.trim();

  return svg;
}

/**
 * Get avatar URL (for external avatar service or generated).
 */
export function getAvatarUrl(
  user: { id: string; name?: string; email: string; avatar?: string },
  size: number = 100
): string {
  // User has custom avatar
  if (user.avatar) {
    return user.avatar;
  }

  // Generate gravatar URL as fallback
  const hash = createHash('md5').update(user.email.toLowerCase().trim()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=mp`;
}

function getInitials(name: string): string {
  if (!name) return '?';

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function generateBackgroundColor(seed: string): string {
  // Generate consistent color based on name
  const colors = [
    '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e',
    '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50',
    '#f1c40f', '#e67e22', '#e74c3c', '#f39c12', '#d35400',
  ];

  const hash = createHash('md5').update(seed).digest('hex');
  const index = parseInt(hash.slice(0, 8), 16) % colors.length;

  return colors[index];
}
```

---

## PDF Generation

### PDF Rendering System

```typescript
// pdf/service/render.service.ts

import { ctx, logger } from '@unisane/kernel';
import { getStorageProvider } from '@/platform/providers/storage';

// PDF generation can use different engines
export type PDFEngine = 'puppeteer' | 'react-pdf' | 'pdfkit';

export interface PDFTemplate {
  name: string;
  engine: PDFEngine;
  template: string; // HTML template or component path
  defaultData?: Record<string, unknown>;
}

export interface RenderPDFInput {
  template: string;
  data: Record<string, unknown>;
  options?: PDFRenderOptions;
}

export interface PDFRenderOptions {
  format?: 'A4' | 'Letter' | 'Legal';
  landscape?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  headerTemplate?: string;
  footerTemplate?: string;
  displayHeaderFooter?: boolean;
}

// Template registry
const templates: Map<string, PDFTemplate> = new Map();

/**
 * Register a PDF template.
 */
export function registerTemplate(template: PDFTemplate): void {
  templates.set(template.name, template);
}

/**
 * Render PDF from template.
 */
export async function renderPdf(input: RenderPDFInput): Promise<Buffer> {
  const { template: templateName, data, options } = input;

  const template = templates.get(templateName);
  if (!template) {
    throw new Error(`Template not found: ${templateName}`);
  }

  const mergedData = { ...template.defaultData, ...data };

  switch (template.engine) {
    case 'puppeteer':
      return renderWithPuppeteer(template.template, mergedData, options);
    case 'react-pdf':
      return renderWithReactPDF(template.template, mergedData, options);
    case 'pdfkit':
      return renderWithPDFKit(template.template, mergedData, options);
    default:
      throw new Error(`Unknown PDF engine: ${template.engine}`);
  }
}

/**
 * Render HTML to PDF using Puppeteer.
 */
async function renderWithPuppeteer(
  htmlTemplate: string,
  data: Record<string, unknown>,
  options?: PDFRenderOptions
): Promise<Buffer> {
  // Dynamic import to avoid loading Puppeteer unless needed
  const puppeteer = await import('puppeteer');

  const html = interpolateTemplate(htmlTemplate, data);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: options?.format || 'A4',
      landscape: options?.landscape || false,
      margin: options?.margin || {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm',
      },
      displayHeaderFooter: options?.displayHeaderFooter || false,
      headerTemplate: options?.headerTemplate,
      footerTemplate: options?.footerTemplate,
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * Simple template interpolation.
 */
function interpolateTemplate(
  template: string,
  data: Record<string, unknown>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return String(data[key] ?? '');
  });
}

// Pre-defined templates
registerTemplate({
  name: 'invoice',
  engine: 'puppeteer',
  template: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: system-ui, sans-serif; padding: 40px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .invoice-title { font-size: 24px; font-weight: bold; }
        .invoice-number { color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-number">#{{invoiceNumber}}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {{lineItems}}
        </tbody>
      </table>
      <div class="total">Total: {{currency}}{{total}}</div>
    </body>
    </html>
  `,
});
```

---

## AI Provider System

### AI Provider Abstraction

```typescript
// platform/providers/ai/types.ts

export interface AIProvider {
  // Text generation
  generateText(input: GenerateTextInput): Promise<GenerateTextResult>;

  // Structured output
  generateJSON<T>(input: GenerateJSONInput<T>): Promise<T>;

  // Embeddings
  generateEmbeddings(input: GenerateEmbeddingsInput): Promise<number[][]>;

  // Streaming
  streamText(input: GenerateTextInput): AsyncGenerator<string>;
}

export interface GenerateTextInput {
  model?: string;
  prompt?: string;
  messages?: Message[];
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateTextResult {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  finishReason: 'stop' | 'length' | 'content_filter';
}

export interface GenerateJSONInput<T> {
  model?: string;
  prompt: string;
  schema: z.ZodSchema<T>;
  maxTokens?: number;
}

export interface GenerateEmbeddingsInput {
  model?: string;
  texts: string[];
}
```

### OpenAI Provider

```typescript
// platform/providers/ai/openai.ts

import OpenAI from 'openai';
import { z } from 'zod';
import type { AIProvider, GenerateTextInput, GenerateTextResult } from './types';

export function createOpenAIProvider(apiKey: string): AIProvider {
  const client = new OpenAI({ apiKey });

  return {
    async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
      const messages = input.messages || [{ role: 'user', content: input.prompt! }];

      const response = await client.chat.completions.create({
        model: input.model || 'gpt-4o',
        messages,
        max_tokens: input.maxTokens,
        temperature: input.temperature,
        stop: input.stopSequences,
      });

      const choice = response.choices[0];

      return {
        text: choice.message.content || '',
        usage: {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
        },
        finishReason: mapFinishReason(choice.finish_reason),
      };
    },

    async generateJSON<T>(input: GenerateJSONInput<T>): Promise<T> {
      const response = await client.chat.completions.create({
        model: input.model || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You must respond with valid JSON only. No explanations.',
          },
          { role: 'user', content: input.prompt },
        ],
        max_tokens: input.maxTokens,
        response_format: { type: 'json_object' },
      });

      const text = response.choices[0].message.content || '{}';
      const parsed = JSON.parse(text);

      return input.schema.parse(parsed);
    },

    async generateEmbeddings(input: GenerateEmbeddingsInput): Promise<number[][]> {
      const response = await client.embeddings.create({
        model: input.model || 'text-embedding-3-small',
        input: input.texts,
      });

      return response.data.map((d) => d.embedding);
    },

    async *streamText(input: GenerateTextInput): AsyncGenerator<string> {
      const messages = input.messages || [{ role: 'user', content: input.prompt! }];

      const stream = await client.chat.completions.create({
        model: input.model || 'gpt-4o',
        messages,
        max_tokens: input.maxTokens,
        temperature: input.temperature,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    },
  };
}

function mapFinishReason(reason: string): 'stop' | 'length' | 'content_filter' {
  switch (reason) {
    case 'stop':
      return 'stop';
    case 'length':
      return 'length';
    case 'content_filter':
      return 'content_filter';
    default:
      return 'stop';
  }
}
```

### Anthropic Provider

```typescript
// platform/providers/ai/anthropic.ts

import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, GenerateTextInput, GenerateTextResult } from './types';

export function createAnthropicProvider(apiKey: string): AIProvider {
  const client = new Anthropic({ apiKey });

  return {
    async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
      const messages = input.messages?.filter((m) => m.role !== 'system') || [
        { role: 'user', content: input.prompt! },
      ];

      const systemMessage = input.messages?.find((m) => m.role === 'system')?.content;

      const response = await client.messages.create({
        model: input.model || 'claude-3-5-sonnet-20241022',
        max_tokens: input.maxTokens || 4096,
        system: systemMessage,
        messages: messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        temperature: input.temperature,
        stop_sequences: input.stopSequences,
      });

      const textBlock = response.content.find((c) => c.type === 'text');

      return {
        text: textBlock?.type === 'text' ? textBlock.text : '',
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
        finishReason: mapStopReason(response.stop_reason),
      };
    },

    async generateJSON<T>(input: GenerateJSONInput<T>): Promise<T> {
      const response = await client.messages.create({
        model: input.model || 'claude-3-5-sonnet-20241022',
        max_tokens: input.maxTokens || 4096,
        system: 'You must respond with valid JSON only. No explanations or markdown.',
        messages: [{ role: 'user', content: input.prompt }],
      });

      const textBlock = response.content.find((c) => c.type === 'text');
      const text = textBlock?.type === 'text' ? textBlock.text : '{}';
      const parsed = JSON.parse(text);

      return input.schema.parse(parsed);
    },

    async generateEmbeddings(): Promise<number[][]> {
      throw new Error('Anthropic does not support embeddings. Use OpenAI for embeddings.');
    },

    async *streamText(input: GenerateTextInput): AsyncGenerator<string> {
      const messages = input.messages?.filter((m) => m.role !== 'system') || [
        { role: 'user', content: input.prompt! },
      ];

      const systemMessage = input.messages?.find((m) => m.role === 'system')?.content;

      const stream = await client.messages.stream({
        model: input.model || 'claude-3-5-sonnet-20241022',
        max_tokens: input.maxTokens || 4096,
        system: systemMessage,
        messages: messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield event.delta.text;
        }
      }
    },
  };
}

function mapStopReason(reason: string | null): 'stop' | 'length' | 'content_filter' {
  switch (reason) {
    case 'end_turn':
      return 'stop';
    case 'max_tokens':
      return 'length';
    default:
      return 'stop';
  }
}
```

### AI Module Service

```typescript
// ai/service/generate.service.ts

import { ctx, logger, events } from '@unisane/kernel';
import { incrementUsage } from '@unisane/usage';
import { consumeCredits } from '@unisane/credits';
import { getAIProvider } from '@/platform/providers/ai';

export interface GenerateContentInput {
  prompt: string;
  model?: string;
  maxTokens?: number;
  trackUsage?: boolean;
}

export async function generateContent(input: GenerateContentInput): Promise<string> {
  const { prompt, model, maxTokens, trackUsage = true } = input;
  const context = ctx.get();

  const provider = getAIProvider();

  const result = await provider.generateText({
    prompt,
    model,
    maxTokens,
  });

  // Track usage and costs
  if (trackUsage && context.tenantId) {
    const totalTokens = result.usage.inputTokens + result.usage.outputTokens;

    // Track token usage
    await incrementUsage({
      metric: 'ai_tokens',
      value: totalTokens,
    });

    // Calculate and consume credits (example: 1 credit per 1000 tokens)
    const creditsUsed = Math.ceil(totalTokens / 1000);
    if (creditsUsed > 0) {
      await consumeCredits({
        amount: creditsUsed,
        reason: 'AI generation',
        metadata: {
          model: model || 'default',
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
        },
      });
    }

    logger.info('AI generation completed', {
      model,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      creditsUsed,
    });
  }

  return result.text;
}
```

---

## Query DSL

### MongoDB Query Builder

```typescript
// gateway/src/query/builder.ts

import { Filter, Sort } from 'mongodb';

export interface QueryParams {
  filter?: Record<string, string | string[]>;
  sort?: string;
  page?: number;
  limit?: number;
  search?: string;
  searchFields?: string[];
}

export interface ParsedQuery<T> {
  filter: Filter<T>;
  sort: Sort;
  skip: number;
  limit: number;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parse query parameters into MongoDB query.
 */
export function parseQuery<T>(params: QueryParams): ParsedQuery<T> {
  const filter = buildFilter<T>(params.filter, params.search, params.searchFields);
  const sort = buildSort(params.sort);
  const limit = Math.min(params.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const skip = ((params.page || 1) - 1) * limit;

  return { filter, sort, skip, limit };
}

/**
 * Build MongoDB filter from query params.
 *
 * Supports:
 * - Exact match: ?status=active
 * - Multiple values (OR): ?status=active,pending
 * - Greater than: ?createdAt[gte]=2024-01-01
 * - Less than: ?createdAt[lte]=2024-12-31
 * - Contains (array): ?tags[contains]=featured
 * - Not equal: ?status[ne]=deleted
 */
function buildFilter<T>(
  params?: Record<string, string | string[]>,
  search?: string,
  searchFields?: string[]
): Filter<T> {
  const conditions: Filter<T>[] = [];

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      const condition = parseFilterValue(key, value);
      if (condition) {
        conditions.push(condition as Filter<T>);
      }
    }
  }

  // Text search
  if (search && searchFields?.length) {
    const searchConditions = searchFields.map((field) => ({
      [field]: { $regex: escapeRegex(search), $options: 'i' },
    }));
    conditions.push({ $or: searchConditions } as Filter<T>);
  }

  if (conditions.length === 0) {
    return {} as Filter<T>;
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return { $and: conditions } as Filter<T>;
}

function parseFilterValue(key: string, value: string | string[]): Filter<any> | null {
  // Handle operators in key like "createdAt[gte]"
  const operatorMatch = key.match(/^(\w+)\[(\w+)\]$/);

  if (operatorMatch) {
    const [, field, operator] = operatorMatch;
    return buildOperatorCondition(field, operator, value);
  }

  // Simple equality or IN condition
  if (Array.isArray(value) || (typeof value === 'string' && value.includes(','))) {
    const values = Array.isArray(value) ? value : value.split(',');
    return { [key]: { $in: values.map(parseValue) } };
  }

  return { [key]: parseValue(value as string) };
}

function buildOperatorCondition(
  field: string,
  operator: string,
  value: string | string[]
): Filter<any> | null {
  const parsedValue = parseValue(Array.isArray(value) ? value[0] : value);

  switch (operator) {
    case 'gte':
      return { [field]: { $gte: parsedValue } };
    case 'gt':
      return { [field]: { $gt: parsedValue } };
    case 'lte':
      return { [field]: { $lte: parsedValue } };
    case 'lt':
      return { [field]: { $lt: parsedValue } };
    case 'ne':
      return { [field]: { $ne: parsedValue } };
    case 'contains':
      return { [field]: { $in: [parsedValue] } };
    case 'regex':
      return { [field]: { $regex: String(parsedValue), $options: 'i' } };
    default:
      return null;
  }
}

function parseValue(value: string): string | number | boolean | Date {
  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return parseFloat(value);
  }

  // ISO Date
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return value;
}

/**
 * Build sort object from string.
 *
 * Supports:
 * - Single field: ?sort=createdAt
 * - Descending: ?sort=-createdAt
 * - Multiple: ?sort=-createdAt,name
 */
function buildSort(sortParam?: string): Sort {
  if (!sortParam) {
    return { createdAt: -1 }; // Default sort
  }

  const sort: Sort = {};
  const fields = sortParam.split(',');

  for (const field of fields) {
    if (field.startsWith('-')) {
      sort[field.slice(1)] = -1;
    } else {
      sort[field] = 1;
    }
  }

  return sort;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```

---

## Database Migrations

### Migration System

```typescript
// core/db/migrations/runner.ts

import { Db } from 'mongodb';
import { logger } from '@unisane/kernel';

export interface Migration {
  version: number;
  name: string;
  up: (db: Db) => Promise<void>;
  down?: (db: Db) => Promise<void>;
}

const MIGRATIONS_COLLECTION = '_migrations';

export async function runMigrations(db: Db, migrations: Migration[]): Promise<void> {
  // Ensure migrations collection exists
  const migrationsCol = db.collection(MIGRATIONS_COLLECTION);

  // Get applied migrations
  const applied = await migrationsCol.find().toArray();
  const appliedVersions = new Set(applied.map((m) => m.version));

  // Sort migrations by version
  const sortedMigrations = [...migrations].sort((a, b) => a.version - b.version);

  // Apply pending migrations
  for (const migration of sortedMigrations) {
    if (appliedVersions.has(migration.version)) {
      continue;
    }

    logger.info(`Running migration: ${migration.version} - ${migration.name}`);

    const startTime = Date.now();

    try {
      await migration.up(db);

      await migrationsCol.insertOne({
        version: migration.version,
        name: migration.name,
        appliedAt: new Date(),
        duration: Date.now() - startTime,
      });

      logger.info(`Migration completed: ${migration.version} - ${migration.name}`, {
        duration: Date.now() - startTime,
      });
    } catch (error) {
      logger.error(`Migration failed: ${migration.version} - ${migration.name}`, { error });
      throw error;
    }
  }
}

export async function rollbackMigration(
  db: Db,
  migrations: Migration[],
  targetVersion?: number
): Promise<void> {
  const migrationsCol = db.collection(MIGRATIONS_COLLECTION);

  // Get applied migrations in reverse order
  const applied = await migrationsCol
    .find()
    .sort({ version: -1 })
    .toArray();

  for (const record of applied) {
    if (targetVersion !== undefined && record.version <= targetVersion) {
      break;
    }

    const migration = migrations.find((m) => m.version === record.version);

    if (!migration) {
      logger.warn(`Migration not found for version: ${record.version}`);
      continue;
    }

    if (!migration.down) {
      throw new Error(`Migration ${migration.version} does not support rollback`);
    }

    logger.info(`Rolling back migration: ${migration.version} - ${migration.name}`);

    await migration.down(db);

    await migrationsCol.deleteOne({ version: migration.version });

    logger.info(`Rollback completed: ${migration.version} - ${migration.name}`);

    // Only rollback one if no target specified
    if (targetVersion === undefined) {
      break;
    }
  }
}

export async function getMigrationStatus(
  db: Db,
  migrations: Migration[]
): Promise<MigrationStatus[]> {
  const migrationsCol = db.collection(MIGRATIONS_COLLECTION);
  const applied = await migrationsCol.find().toArray();
  const appliedMap = new Map(applied.map((m) => [m.version, m]));

  return migrations.map((migration) => {
    const record = appliedMap.get(migration.version);
    return {
      version: migration.version,
      name: migration.name,
      applied: !!record,
      appliedAt: record?.appliedAt,
    };
  });
}

interface MigrationStatus {
  version: number;
  name: string;
  applied: boolean;
  appliedAt?: Date;
}
```

### Example Migrations

```typescript
// core/db/migrations/index.ts

import { Migration } from './runner';

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'create-users-indexes',
    async up(db) {
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('users').createIndex({ tenantId: 1 });
      await db.collection('users').createIndex({ createdAt: -1 });
    },
    async down(db) {
      await db.collection('users').dropIndex('email_1');
      await db.collection('users').dropIndex('tenantId_1');
      await db.collection('users').dropIndex('createdAt_-1');
    },
  },
  {
    version: 2,
    name: 'create-tenants-indexes',
    async up(db) {
      await db.collection('tenants').createIndex({ slug: 1 }, { unique: true });
      await db.collection('tenants').createIndex({ ownerId: 1 });
    },
  },
  {
    version: 3,
    name: 'add-subscription-status-index',
    async up(db) {
      await db.collection('subscriptions').createIndex({
        tenantId: 1,
        status: 1,
      });
    },
  },
];
```

---

## Webhook Management

### Webhook Replay System

```typescript
// webhooks/service/replay.service.ts

import { ctx, logger, events } from '@unisane/kernel';
import { WebhooksRepo } from '../data';

export interface ReplayInput {
  webhookId: string;
  reason?: string;
}

export interface ReplayResult {
  webhookId: string;
  status: 'queued' | 'delivered' | 'failed';
  deliveredAt?: Date;
  error?: string;
}

/**
 * Replay a webhook event.
 * Re-delivers the original payload to the configured endpoint.
 */
export async function replayWebhook(input: ReplayInput): Promise<ReplayResult> {
  const { webhookId, reason } = input;
  const context = ctx.get();

  // Get original webhook record
  const webhook = await WebhooksRepo.findById(webhookId);
  if (!webhook) {
    throw new NotFoundError('Webhook', webhookId);
  }

  // Verify tenant access
  if (webhook.tenantId !== context.tenantId) {
    throw new ForbiddenError('Cannot replay webhook from another tenant');
  }

  // Create replay record
  const replay = await WebhooksRepo.createReplay({
    originalWebhookId: webhookId,
    tenantId: context.tenantId!,
    reason: reason || 'Manual replay',
    requestedBy: context.userId!,
    requestedAt: new Date(),
    status: 'pending',
  });

  // Queue for delivery
  await events.emit('webhooks.replay.requested', {
    version: 1,
    replayId: replay.id,
    originalWebhookId: webhookId,
    payload: webhook.payload,
    endpoint: webhook.endpoint,
  });

  logger.info('Webhook replay queued', {
    webhookId,
    replayId: replay.id,
    reason,
  });

  return {
    webhookId,
    status: 'queued',
  };
}

/**
 * Bulk replay webhooks by criteria.
 */
export async function bulkReplayWebhooks(input: BulkReplayInput): Promise<BulkReplayResult> {
  const { filter, reason } = input;
  const context = ctx.get();

  // Find webhooks matching criteria
  const webhooks = await WebhooksRepo.find({
    ...filter,
    tenantId: context.tenantId!,
    direction: 'outbound',
    status: 'failed', // Only replay failed webhooks
  });

  const results: ReplayResult[] = [];

  for (const webhook of webhooks) {
    try {
      const result = await replayWebhook({
        webhookId: webhook.id,
        reason: reason || 'Bulk replay',
      });
      results.push(result);
    } catch (error) {
      results.push({
        webhookId: webhook.id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    total: webhooks.length,
    queued: results.filter((r) => r.status === 'queued').length,
    failed: results.filter((r) => r.status === 'failed').length,
    results,
  };
}

interface BulkReplayInput {
  filter: {
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
  };
  reason?: string;
}

interface BulkReplayResult {
  total: number;
  queued: number;
  failed: number;
  results: ReplayResult[];
}
```

---

## Analytics Dashboard

### Analytics Implementation

```typescript
// analytics/service/dashboard.service.ts (PRO)

import { ctx, cache, logger } from '@unisane/kernel';
import { AnalyticsRepo } from '../data';

export interface DashboardMetrics {
  overview: OverviewMetrics;
  revenue: RevenueMetrics;
  usage: UsageMetrics;
  growth: GrowthMetrics;
}

export interface OverviewMetrics {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  activeUsers: number;
  mrr: number;
  arr: number;
}

export interface RevenueMetrics {
  currentMrr: number;
  previousMrr: number;
  mrrGrowth: number;
  byPlan: { plan: string; mrr: number; count: number }[];
  byPeriod: { date: string; mrr: number }[];
}

export interface UsageMetrics {
  apiCalls: TimeSeriesData;
  storageUsed: TimeSeriesData;
  aiTokens: TimeSeriesData;
  topEndpoints: { endpoint: string; count: number }[];
}

export interface GrowthMetrics {
  newSignups: TimeSeriesData;
  churnRate: number;
  netRevenue: number;
  ltv: number;
}

interface TimeSeriesData {
  current: number;
  previous: number;
  change: number;
  series: { date: string; value: number }[];
}

const DASHBOARD_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get admin analytics dashboard.
 */
export async function getAdminAnalyticsDashboard(
  options: { startDate?: Date; endDate?: Date } = {}
): Promise<DashboardMetrics> {
  const cacheKey = `analytics:dashboard:${options.startDate?.toISOString()}:${options.endDate?.toISOString()}`;

  // Check cache
  const cached = await cache.get<DashboardMetrics>(cacheKey);
  if (cached) {
    return cached;
  }

  const endDate = options.endDate || new Date();
  const startDate = options.startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Compute metrics in parallel
  const [overview, revenue, usage, growth] = await Promise.all([
    computeOverviewMetrics(),
    computeRevenueMetrics(startDate, endDate),
    computeUsageMetrics(startDate, endDate),
    computeGrowthMetrics(startDate, endDate),
  ]);

  const dashboard: DashboardMetrics = { overview, revenue, usage, growth };

  // Cache result
  await cache.set(cacheKey, dashboard, DASHBOARD_CACHE_TTL);

  return dashboard;
}

async function computeOverviewMetrics(): Promise<OverviewMetrics> {
  const [tenantStats, userStats, subscriptionStats] = await Promise.all([
    AnalyticsRepo.getTenantStats(),
    AnalyticsRepo.getUserStats(),
    AnalyticsRepo.getSubscriptionStats(),
  ]);

  return {
    totalTenants: tenantStats.total,
    activeTenants: tenantStats.active,
    totalUsers: userStats.total,
    activeUsers: userStats.active,
    mrr: subscriptionStats.mrr,
    arr: subscriptionStats.mrr * 12,
  };
}

async function computeRevenueMetrics(startDate: Date, endDate: Date): Promise<RevenueMetrics> {
  const [currentMrr, previousMrr, byPlan, byPeriod] = await Promise.all([
    AnalyticsRepo.getMRR(endDate),
    AnalyticsRepo.getMRR(new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()))),
    AnalyticsRepo.getMRRByPlan(),
    AnalyticsRepo.getMRRTimeSeries(startDate, endDate),
  ]);

  return {
    currentMrr,
    previousMrr,
    mrrGrowth: previousMrr > 0 ? ((currentMrr - previousMrr) / previousMrr) * 100 : 0,
    byPlan,
    byPeriod,
  };
}

async function computeUsageMetrics(startDate: Date, endDate: Date): Promise<UsageMetrics> {
  const previousStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));

  const [currentApiCalls, previousApiCalls, apiCallsSeries] = await Promise.all([
    AnalyticsRepo.getUsageSum('api_calls', startDate, endDate),
    AnalyticsRepo.getUsageSum('api_calls', previousStartDate, startDate),
    AnalyticsRepo.getUsageTimeSeries('api_calls', startDate, endDate),
  ]);

  const [currentStorage, previousStorage, storageSeries] = await Promise.all([
    AnalyticsRepo.getUsageSum('storage_bytes', startDate, endDate),
    AnalyticsRepo.getUsageSum('storage_bytes', previousStartDate, startDate),
    AnalyticsRepo.getUsageTimeSeries('storage_bytes', startDate, endDate),
  ]);

  const [currentAiTokens, previousAiTokens, aiTokensSeries] = await Promise.all([
    AnalyticsRepo.getUsageSum('ai_tokens', startDate, endDate),
    AnalyticsRepo.getUsageSum('ai_tokens', previousStartDate, startDate),
    AnalyticsRepo.getUsageTimeSeries('ai_tokens', startDate, endDate),
  ]);

  const topEndpoints = await AnalyticsRepo.getTopEndpoints(startDate, endDate, 10);

  return {
    apiCalls: {
      current: currentApiCalls,
      previous: previousApiCalls,
      change: previousApiCalls > 0 ? ((currentApiCalls - previousApiCalls) / previousApiCalls) * 100 : 0,
      series: apiCallsSeries,
    },
    storageUsed: {
      current: currentStorage,
      previous: previousStorage,
      change: previousStorage > 0 ? ((currentStorage - previousStorage) / previousStorage) * 100 : 0,
      series: storageSeries,
    },
    aiTokens: {
      current: currentAiTokens,
      previous: previousAiTokens,
      change: previousAiTokens > 0 ? ((currentAiTokens - previousAiTokens) / previousAiTokens) * 100 : 0,
      series: aiTokensSeries,
    },
    topEndpoints,
  };
}

async function computeGrowthMetrics(startDate: Date, endDate: Date): Promise<GrowthMetrics> {
  const previousStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));

  const [currentSignups, previousSignups, signupsSeries] = await Promise.all([
    AnalyticsRepo.getSignupCount(startDate, endDate),
    AnalyticsRepo.getSignupCount(previousStartDate, startDate),
    AnalyticsRepo.getSignupsTimeSeries(startDate, endDate),
  ]);

  const [churnRate, netRevenue, ltv] = await Promise.all([
    AnalyticsRepo.getChurnRate(startDate, endDate),
    AnalyticsRepo.getNetRevenue(startDate, endDate),
    AnalyticsRepo.getLTV(),
  ]);

  return {
    newSignups: {
      current: currentSignups,
      previous: previousSignups,
      change: previousSignups > 0 ? ((currentSignups - previousSignups) / previousSignups) * 100 : 0,
      series: signupsSeries,
    },
    churnRate,
    netRevenue,
    ltv,
  };
}
```

---

## Summary

This document covers all advanced features that were identified as gaps in the main architecture documentation:

| Feature | Status |
|---------|--------|
| Phone Authentication | Documented |
| Tenant Impersonation | Documented |
| In-app Notifications | Documented |
| Suppression List | Documented |
| Image Transformation | Documented |
| PDF Generation | Documented |
| AI Provider System | Documented |
| Query DSL | Documented |
| Database Migrations | Documented |
| Webhook Replay | Documented |
| Analytics Dashboard | Documented |

All features maintain consistency with the main architecture patterns and integrate with the kernel layer (ctx, events, cache, logger).
