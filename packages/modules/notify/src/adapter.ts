/**
 * Notify Port Adapter
 *
 * Implements NotifyPort interface from kernel.
 * Wraps the existing notify module service functions.
 * Used by auth/billing modules for notifications via the kernel port.
 */

import type {
  NotifyPort,
  EmailResult,
  InAppResult,
  WebhookResult,
  NotificationCategory,
} from "@unisane/kernel";
import { runWithScopeContext } from "@unisane/kernel";
import { sendEmail } from "./service/email";
import { sendInapp } from "./service/inapp";
import { getPrefs, setPrefs } from "./service/prefs";

/**
 * NotifyPort implementation that wraps the notify module services.
 */
export const notifyAdapter: NotifyPort = {
  async sendEmail(args) {
    // Call the email service
    const result = await sendEmail({
      to: { email: Array.isArray(args.to) ? args.to[0]! : args.to },
      template: args.template,
      props: args.data,
      ...(args.options?.subject ? { subject: args.options.subject } : {}),
    });

    const emailResult: EmailResult = {
      messageId: result.sent && result.messageId ? result.messageId : "",
      success: result.sent,
    };

    return emailResult;
  },

  async sendInApp(args) {
    // Run within scope context
    return runWithScopeContext(
      {
        scope: { type: "tenant", id: args.scopeId ?? "" },
        userId: args.userId,
      },
      async () => {
        const result = await sendInapp({
          targetScopeUserId: args.userId,
          title: args.title,
          body: args.body,
          category: args.category ?? null,
          data: args.data,
        });

        const inAppResult: InAppResult = {
          notificationId: result.id,
          delivered: true,
        };

        return inAppResult;
      }
    );
  },

  async sendWebhook(args) {
    // Webhook functionality would be implemented via webhooks module
    // For now, return empty array as webhook delivery is handled separately
    const results: WebhookResult[] = [];
    return results;
  },

  async getPreferences(userId) {
    // Would need scope context to fetch preferences
    // Return default preferences for now
    const defaultPrefs = {
      email: true,
      inApp: true,
      categories: {
        billing: true,
        alerts: true,
        product_updates: true,
        system: true,
      } as Record<NotificationCategory, boolean>,
    };

    return defaultPrefs;
  },

  async updatePreferences(userId, preferences) {
    // Would need scope context to update preferences
    // Preferences are stored per-user in settings
    // This is a stub - actual implementation needs context setup
  },
};
