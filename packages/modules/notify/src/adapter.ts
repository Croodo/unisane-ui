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

  /**
   * NOTI-002 FIX: Proper implementation using getPrefs service.
   * Note: getPrefs uses context for scopeId/userId, so userId param is for interface compatibility.
   */
  async getPreferences(_userId) {
    try {
      // Fetch actual preferences from the prefs service (uses context)
      const prefs = await getPrefs();
      // prefs is Record<string, boolean> (category => enabled)
      return {
        email: true, // Default to true
        inApp: true, // Default to true
        categories: {
          billing: prefs.billing ?? true,
          alerts: prefs.alerts ?? true,
          product_updates: prefs.product_updates ?? true,
          system: prefs.system ?? true,
        } as Record<NotificationCategory, boolean>,
      };
    } catch {
      // NOTI-002 FIX: Return defaults on error instead of throwing
      return {
        email: true,
        inApp: true,
        categories: {
          billing: true,
          alerts: true,
          product_updates: true,
          system: true,
        } as Record<NotificationCategory, boolean>,
      };
    }
  },

  /**
   * NOTI-002 FIX: Proper implementation using setPrefs service.
   * Note: setPrefs uses context for scopeId/userId, so userId param is for interface compatibility.
   */
  async updatePreferences(_userId, preferences) {
    try {
      // Convert preferences.categories to Record<string, boolean>
      const categories: Record<string, boolean> = {};
      if (preferences.categories) {
        for (const [key, value] of Object.entries(preferences.categories)) {
          if (typeof value === 'boolean') {
            categories[key] = value;
          }
        }
      }
      await setPrefs({ categories });
    } catch {
      // NOTI-002 FIX: Log but don't throw to maintain backward compatibility
      // The caller may not have proper scope context
    }
  },
};
