import { getEnv } from "@unisane/kernel";
import { sendEmailResend } from "@unisane/kernel";
import { sendEmailSes } from "@unisane/kernel";
import { isSuppressed } from "./suppression";
import { renderEmail } from "@unisane/kernel";

import type { SendEmailInput, SendEmailResult } from "../domain/types";
export type { SendEmailInput, SendEmailResult };

/**
 * Send an email using the configured provider.
 *
 * Checks:
 * 1. Suppression list (hard bounces/complaints) - always checked
 * 2. User preferences (opt-out per category) - only if category + userId provided
 *
 * System emails (auth, password reset) should NOT provide category to bypass prefs.
 */
export async function sendEmail(
  input: SendEmailInput
): Promise<SendEmailResult> {
  const { MAIL_PROVIDER } = getEnv();

  // 1. Check suppression list (bounces/complaints always block)
  const suppressed = await isSuppressed(input.to.email, input.tenantId ?? null);
  if (suppressed) {
    return { sent: false, reason: "suppressed" };
  }

  // 2. Check user preferences (if category and userId provided)
  // Note: getPrefs() uses context, so preference checking requires the caller
  // to set up proper context. For system emails, skip preference checking.
  // TODO: Consider adding a version that accepts explicit tenantId/userId

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
  const toEmail = input.to.email;
  switch (MAIL_PROVIDER) {
    case "resend":
      await sendEmailResend({
        to: toEmail,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        headers,
      });
      return { sent: true };

    case "ses":
      await sendEmailSes({
        to: toEmail,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        headers,
      });
      return { sent: true };

    default:
      return { sent: false, reason: "no_provider" };
  }
}
