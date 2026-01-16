import { sendEmail as sendEmailKernel } from "@unisane/kernel";
import { isSuppressed } from "./suppression";
import { renderEmail } from "@unisane/kernel";
import { hasOptedOut } from "./prefs";

import type { SendEmailInput, SendEmailResult } from "../domain/types";
export type { SendEmailInput, SendEmailResult };

/**
 * Send an email using the configured provider.
 *
 * Checks:
 * 1. Suppression list (hard bounces/complaints) - always checked
 * 2. User preferences (opt-out per category) - only if category + userId + scopeId provided
 *
 * System emails (auth, password reset) should NOT provide category to bypass prefs.
 */
export async function sendEmail(
  input: SendEmailInput
): Promise<SendEmailResult> {
  // 1. Check suppression list (bounces/complaints always block)
  const suppressed = await isSuppressed(input.to.email, input.scopeId ?? null);
  if (suppressed) {
    return { sent: false, reason: "suppressed" };
  }

  // 2. Check user preferences (if category, userId, and scopeId provided)
  // System/transactional emails automatically pass (canOptOutOfCategory returns false)
  if (input.category && input.userId && input.scopeId) {
    const optedOut = await hasOptedOut(input.scopeId, input.userId, input.category);
    if (optedOut) {
      return { sent: false, reason: "opted_out" };
    }
  }

  // 3. Render email template
  const rendered = await renderEmail(
    input.template,
    input.props ?? {}
  );

  // 4. Build headers
  const headers = {
    ...(input.headers ?? {}),
    "X-Template": input.template,
    ...(input.category ? { "X-Category": input.category } : {}),
  };

  // 5. Send via configured provider
  const result = await sendEmailKernel({
    to: input.to.email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    headers,
  });

  if (!result.success) {
    return { sent: false, reason: "provider_error", error: result.error };
  }

  return { sent: true, messageId: result.messageId };
}
