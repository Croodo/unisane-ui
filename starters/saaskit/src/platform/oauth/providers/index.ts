import type { OAuthProvider } from '@unisane/kernel';

export type ProviderProfile = {
  provider: OAuthProvider;
  subject: string; // stable provider user id
  email: string;
  emailVerified?: boolean;
  displayName?: string | null;
  imageUrl?: string | null;
};

export interface ProviderAdapter {
  verifyToken(token: string): Promise<ProviderProfile>;
}

export async function getProviderAdapter(name: string): Promise<ProviderAdapter | null> {
  switch (name) {
    case 'google':
      return (await import('./google')).googleAdapter;
    case 'github':
      return (await import('./github')).githubAdapter;

    default:
      return null;
  }
}

export function isProviderEnabled(name: string, list: string[]): boolean {
  return list.includes(String(name).toLowerCase());
}
