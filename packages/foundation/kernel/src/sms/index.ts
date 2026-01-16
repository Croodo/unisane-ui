/**
 * SMS Module
 *
 * Provides a port-based abstraction for SMS providers.
 * Configure a provider (Twilio, SNS) at startup, then use sendSms().
 *
 * @example
 * import { setSmsProvider, sendSms } from '@unisane/kernel';
 *
 * // At startup, configure provider
 * setSmsProvider(twilioAdapter);
 *
 * // Later, send SMS
 * const result = await sendSms({ to: '+14155551234', message: 'Your code: 123456' });
 */

export {
  sendSms,
  setSmsProvider,
  getSmsProvider,
} from "./port";

export type {
  SmsPort,
  SendSmsInput,
  SendSmsResult,
} from "./port";
