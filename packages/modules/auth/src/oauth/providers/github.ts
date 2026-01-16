/**
 * GitHub OAuth provider adapter.
 *
 * Verifies GitHub access tokens by calling the GitHub API.
 * Fetches user profile and email (which may be private).
 */

import type { ProviderAdapter, ProviderProfile } from './types';

/**
 * Fetch GitHub user profile using an access token
 */
async function fetchGithubProfile(accessToken: string): Promise<ProviderProfile> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'user-agent': 'unisane-auth',
  } as const;

  // Fetch user profile
  const uRes = await fetch('https://api.github.com/user', { headers });
  if (!uRes.ok) throw new Error(`github user error: ${uRes.status}`);
  const user = (await uRes.json()) as Record<string, unknown>;

  // Try to get email from profile, otherwise fetch from emails endpoint
  let email = String(user.email ?? '');
  if (!email) {
    const eRes = await fetch('https://api.github.com/user/emails', { headers });
    if (eRes.ok) {
      const emails = (await eRes.json()) as Array<{
        email?: string;
        primary?: boolean;
        verified?: boolean;
      }>;
      const primary = emails.find((e) => e.primary) ?? emails[0];
      if (primary?.email) email = primary.email;
    }
  }

  if (!email) throw new Error('github email unavailable');

  // Extract required fields
  const id = String(user.id ?? '');
  if (!id) throw new Error('github subject missing');

  // Extract optional fields
  const displayName =
    (user.name as string | undefined) ?? (user.login as string | undefined) ?? null;
  const imageUrl = (user.avatar_url as string | undefined) ?? null;

  return {
    provider: 'github',
    subject: id,
    email,
    displayName,
    imageUrl,
  };
}

/**
 * GitHub OAuth provider adapter
 */
export const githubAdapter: ProviderAdapter = {
  async verifyToken(token: string): Promise<ProviderProfile> {
    return fetchGithubProfile(token);
  },
};
