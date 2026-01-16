/**
 * SMS Provider Port
 *
 * Defines the interface for SMS providers (Twilio, AWS SNS, etc.)
 * Implementations can be created in the adapters layer.
 *
 * @example
 * // Create a Twilio adapter
 * const twilioSms: SmsPort = {
 *   send: async (input) => {
 *     const message = await client.messages.create({
 *       body: input.message,
 *       to: input.to,
 *       from: TWILIO_PHONE_NUMBER,
 *     });
 *     return { success: true, messageId: message.sid };
 *   }
 * };
 */

/**
 * Input for sending an SMS message.
 */
export interface SendSmsInput {
  /** Phone number in E.164 format (e.g., +14155551234) */
  to: string;
  /** SMS message content (max 1600 chars for long SMS) */
  message: string;
  /** Optional metadata for tracking */
  metadata?: Record<string, string>;
}

/**
 * Result of sending an SMS.
 */
export type SendSmsResult =
  | { success: true; messageId?: string }
  | { success: false; error: string; code?: string };

/**
 * SMS provider port interface.
 * Implement this to add SMS capabilities via Twilio, SNS, etc.
 */
export interface SmsPort {
  /** Send an SMS message */
  send(input: SendSmsInput): Promise<SendSmsResult>;
}

// ============================================================================
// Default implementation (logs in dev, throws in prod)
// ============================================================================

let smsProvider: SmsPort | null = null;

/**
 * Set the SMS provider implementation.
 * Call this at startup to configure SMS sending.
 */
export function setSmsProvider(provider: SmsPort): void {
  smsProvider = provider;
}

/**
 * Get the current SMS provider, or null if not configured.
 */
export function getSmsProvider(): SmsPort | null {
  return smsProvider;
}

/**
 * Send an SMS using the configured provider.
 * Falls back to logging in dev mode if no provider is set.
 *
 * @throws Error in production if no provider is configured
 */
export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
  if (smsProvider) {
    return smsProvider.send(input);
  }

  // No provider configured - check environment
  const APP_ENV = process.env.APP_ENV ?? "dev";

  if (APP_ENV === "prod") {
    return {
      success: false,
      error: "SMS provider not configured",
      code: "NO_PROVIDER",
    };
  }

  // Dev mode: log the message for testing
  console.log("[sms-dev] Would send SMS:", {
    to: input.to.slice(0, 6) + "****",
    messageLength: input.message.length,
    preview: input.message.slice(0, 50) + (input.message.length > 50 ? "..." : ""),
  });

  return { success: true, messageId: `dev-${Date.now()}` };
}
