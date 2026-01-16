import {
  getScopeId,
  getScopeUserId,
  SETTINGS_NS,
  events,
  getSetting,
  patchSetting,
  canOptOutOfCategory,
  OPT_OUT_ALLOWED_CATEGORIES,
} from '@unisane/kernel';
import type { NotificationCategory } from '@unisane/kernel';
import { NOTIFY_EVENTS } from '../domain/constants';

function keyFor(userId: string) {
  return `prefs:${userId}`;
}

import type { GetPrefsArgs, SetPrefsArgs } from "../domain/types";
export type { GetPrefsArgs, SetPrefsArgs };

/**
 * Email preferences for a user.
 * Categories set to false mean the user has opted out.
 */
export interface EmailPreferences {
  /** User ID */
  userId: string;
  /** Categories the user has opted out of */
  optedOut: NotificationCategory[];
  /** Last update timestamp */
  updatedAt?: Date;
}

// ════════════════════════════════════════════════════════════════════════════
// Preferences (Context-based)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get user's notification preferences (using context).
 */
export async function getPrefs(_args?: GetPrefsArgs): Promise<Record<string, boolean>> {
  const scopeId = getScopeId();
  const userId = getScopeUserId();
  const row = await getSetting({ scopeId, ns: SETTINGS_NS.NOTIFY, key: keyFor(userId) });
  const value = (row?.value ?? {}) as Record<string, boolean>;
  return value;
}

/**
 * Set user's notification preferences (using context).
 */
export async function setPrefs(args: SetPrefsArgs) {
  const scopeId = getScopeId();
  const userId = getScopeUserId();
  const res = await patchSetting({
    scopeId,
    ns: SETTINGS_NS.NOTIFY,
    key: keyFor(userId),
    value: args.categories,
  });
  await events.emit(NOTIFY_EVENTS.PREFS_UPDATED, { scopeId, userId, categories: args.categories });
  return { ok: true as const, version: res.version };
}

// ════════════════════════════════════════════════════════════════════════════
// Preferences (Explicit IDs - for system/background use)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get user's notification preferences by explicit IDs.
 * Useful when context is not available (e.g., in background jobs, email sending).
 */
export async function getPrefsForUser(
  scopeId: string,
  userId: string
): Promise<EmailPreferences> {
  const row = await getSetting({ scopeId, ns: SETTINGS_NS.NOTIFY, key: keyFor(userId) });
  const value = (row?.value ?? {}) as Record<string, boolean>;

  // Convert to opted-out list (false = opted out)
  const optedOut: NotificationCategory[] = [];
  for (const category of OPT_OUT_ALLOWED_CATEGORIES) {
    if (value[category] === false) {
      optedOut.push(category);
    }
  }

  return {
    userId,
    optedOut,
    updatedAt: undefined, // getSetting doesn't return updatedAt
  };
}

/**
 * Check if a user has opted out of a specific category.
 *
 * @param scopeId - Tenant ID
 * @param userId - User ID
 * @param category - Notification category to check
 * @returns true if user has opted out, false if they should receive emails
 */
export async function hasOptedOut(
  scopeId: string,
  userId: string,
  category: NotificationCategory
): Promise<boolean> {
  // System/transactional categories cannot be opted out
  if (!canOptOutOfCategory(category)) {
    return false;
  }

  const prefs = await getPrefsForUser(scopeId, userId);
  return prefs.optedOut.includes(category);
}

/**
 * Update user's preferences by explicit IDs.
 * Only allows opting out of allowed categories.
 *
 * @param scopeId - Tenant ID
 * @param userId - User ID
 * @param optOut - Categories to opt out of
 * @param optIn - Categories to opt back into
 */
export async function updatePrefsForUser(
  scopeId: string,
  userId: string,
  optOut: NotificationCategory[],
  optIn: NotificationCategory[]
): Promise<EmailPreferences> {
  // Validate categories - only allow opting out of allowed categories
  for (const cat of [...optOut, ...optIn]) {
    if (!canOptOutOfCategory(cat)) {
      throw new Error(`Cannot change preference for category: ${cat}`);
    }
  }

  // Get current preferences
  const current = await getPrefsForUser(scopeId, userId);
  const newOptedOut = new Set(current.optedOut);

  for (const cat of optOut) {
    newOptedOut.add(cat);
  }
  for (const cat of optIn) {
    newOptedOut.delete(cat);
  }

  // Convert to storage format (true = subscribed, false = opted out)
  const value: Record<string, boolean> = {};
  for (const cat of OPT_OUT_ALLOWED_CATEGORIES) {
    value[cat] = !newOptedOut.has(cat);
  }

  await patchSetting({
    scopeId,
    ns: SETTINGS_NS.NOTIFY,
    key: keyFor(userId),
    value,
  });

  await events.emit(NOTIFY_EVENTS.PREFS_UPDATED, { scopeId, userId, categories: value });

  return {
    userId,
    optedOut: Array.from(newOptedOut),
    updatedAt: new Date(),
  };
}
