/**
 * Google OAuth provider adapter.
 *
 * Verifies Google ID tokens using the tokeninfo endpoint.
 */

import type { ProviderAdapter, ProviderProfile } from './types';
import { getEnv } from '@unisane/kernel';

/**
 * Verify a Google ID token and extract user profile
 */
async function verifyGoogleIdToken(idToken: string): Promise<ProviderProfile> {
  const { GOOGLE_CLIENT_ID } = getEnv();
  if (!GOOGLE_CLIENT_ID) throw new Error('GOOGLE_CLIENT_ID not configured');

  const url = new URL('https://oauth2.googleapis.com/tokeninfo');
  url.searchParams.set('id_token', idToken);

  const res = await fetch(url.toString(), { method: 'GET' });
  if (!res.ok) throw new Error(`google tokeninfo error: ${res.status}`);

  const data = (await res.json()) as Record<string, unknown>;

  // Verify audience matches our client ID
  const aud = String(data.aud ?? '');
  if (aud !== GOOGLE_CLIENT_ID) throw new Error('google token audience mismatch');

  // Extract required fields
  const email = String(data.email ?? '');
  const sub = String(data.sub ?? '');
  if (!email || !sub) throw new Error('google token missing subject or email');

  // Extract optional fields
  const emailVerified = String(data.email_verified ?? 'false') === 'true';
  const displayName = (data.name as string | undefined) ?? null;
  const imageUrl = (data.picture as string | undefined) ?? null;

  return {
    provider: 'google',
    subject: sub,
    email,
    emailVerified,
    displayName,
    imageUrl,
  };
}

/**
 * Google OAuth provider adapter
 */
export const googleAdapter: ProviderAdapter = {
  async verifyToken(token: string): Promise<ProviderProfile> {
    return verifyGoogleIdToken(token);
  },
};
