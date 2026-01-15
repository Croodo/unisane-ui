import type { AuthCredentialView } from './types';

export interface AuthCredentialRepoPort {
  findByEmailNorm(emailNorm: string): Promise<AuthCredentialView | null>;
  create(input: { userId: string; emailNorm: string; algo: 'scrypt'; salt: string; hash: string }): Promise<AuthCredentialView>;
  updatePassword(emailNorm: string, input: { algo: 'scrypt'; salt: string; hash: string }): Promise<AuthCredentialView | null>;
  recordFailedLoginAttempt(credId: string, opts?: { lockOnCount?: number; lockForMs?: number }): Promise<AuthCredentialView | null>;
  resetFailedAttempts(credId: string): Promise<void>;
}

