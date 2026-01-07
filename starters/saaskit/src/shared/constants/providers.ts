import { z } from 'zod';

export const MAIL_PROVIDERS = ['ses', 'resend'] as const;
export type MailProvider = (typeof MAIL_PROVIDERS)[number];
export const ZMailProvider = z.enum(MAIL_PROVIDERS);

export const BILLING_PROVIDERS = ['stripe', 'razorpay'] as const;
export type BillingProvider = (typeof BILLING_PROVIDERS)[number];
export const ZBillingProvider = z.enum(BILLING_PROVIDERS);

// OAuth/social providers supported by the kit
export const OAUTH_PROVIDERS = ['google', 'github'] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];
export const ZOAuthProvider = z.enum(OAUTH_PROVIDERS);

