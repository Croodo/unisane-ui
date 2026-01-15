/**
 * Notify Port
 *
 * Port interface for sending notifications.
 * Used by modules (auth, billing) to send emails, in-app notifications, webhooks.
 * Notify module implements this port, consumers depend on the interface.
 */

import type { NotificationCategory } from "../constants/notify";
import { setGlobalProvider, getGlobalProvider, hasGlobalProvider } from './global-provider';

const PROVIDER_KEY = 'notify';

/**
 * Email attachment
 */
export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

/**
 * Email send result
 */
export interface EmailResult {
  messageId: string;
  success: boolean;
}

/**
 * In-app notification action button
 */
export interface NotificationAction {
  label: string;
  url: string;
}

/**
 * In-app notification result
 */
export interface InAppResult {
  notificationId: string;
  delivered: boolean;
}

/**
 * Webhook delivery result
 */
export interface WebhookResult {
  delivered: boolean;
  webhookId?: string;
  statusCode?: number;
  error?: string;
}

/**
 * Port interface for notification operations.
 * Used by auth for verification emails, billing for receipts, etc.
 */
export interface NotifyPort {
  /**
   * Send an email notification.
   */
  sendEmail(args: {
    to: string | string[];
    template: string;
    data: Record<string, unknown>;
    options?: {
      subject?: string; // Override template subject
      cc?: string[];
      bcc?: string[];
      replyTo?: string;
      attachments?: EmailAttachment[];
    };
  }): Promise<EmailResult>;

  /**
   * Send an in-app notification.
   */
  sendInApp(args: {
    userId: string;
    scopeId?: string;
    type: string;
    title: string;
    body: string;
    category?: NotificationCategory;
    data?: Record<string, unknown>;
    actions?: NotificationAction[];
    expiresAt?: Date;
  }): Promise<InAppResult>;

  /**
   * Send a webhook notification to configured endpoints.
   */
  sendWebhook(args: {
    scopeId: string;
    event: string;
    payload: Record<string, unknown>;
  }): Promise<WebhookResult[]>;

  /**
   * Get user's notification preferences.
   */
  getPreferences?(userId: string): Promise<{
    email: boolean;
    inApp: boolean;
    categories: Record<NotificationCategory, boolean>;
  }>;

  /**
   * Update user's notification preferences.
   */
  updatePreferences?(
    userId: string,
    preferences: Partial<{
      email: boolean;
      inApp: boolean;
      categories: Partial<Record<NotificationCategory, boolean>>;
    }>
  ): Promise<void>;
}

/**
 * Set the notify provider implementation.
 * Call this at app bootstrap.
 */
export function setNotifyProvider(provider: NotifyPort): void {
  setGlobalProvider(PROVIDER_KEY, provider);
}

/**
 * Get the notify provider.
 * Throws if not configured.
 */
export function getNotifyProvider(): NotifyPort {
  const provider = getGlobalProvider<NotifyPort>(PROVIDER_KEY);
  if (!provider) {
    throw new Error(
      "NotifyPort not configured. Call setNotifyProvider() at bootstrap."
    );
  }
  return provider;
}

/**
 * Check if notify provider is configured.
 */
export function hasNotifyProvider(): boolean {
  return hasGlobalProvider(PROVIDER_KEY);
}

/**
 * Convenience function: Send email via port.
 */
export async function sendEmailViaPort(args: {
  to: string | string[];
  template: string;
  data: Record<string, unknown>;
  options?: {
    subject?: string;
    cc?: string[];
    bcc?: string[];
    replyTo?: string;
    attachments?: EmailAttachment[];
  };
}): Promise<EmailResult> {
  return getNotifyProvider().sendEmail(args);
}

/**
 * Convenience function: Send in-app notification via port.
 */
export async function sendInAppViaPort(args: {
  userId: string;
  scopeId?: string;
  type: string;
  title: string;
  body: string;
  category?: NotificationCategory;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
}): Promise<InAppResult> {
  return getNotifyProvider().sendInApp(args);
}
