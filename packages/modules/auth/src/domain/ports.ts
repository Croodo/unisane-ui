import type { AuthCredentialView } from './types';

export interface AuthCredentialRepoPort {
  findByEmailNorm(emailNorm: string): Promise<AuthCredentialView | null>;
  create(input: { userId: string; emailNorm: string; algo: 'scrypt'; salt: string; hash: string }): Promise<AuthCredentialView>;
  updatePassword(emailNorm: string, input: { algo: 'scrypt'; salt: string; hash: string }): Promise<AuthCredentialView | null>;
  recordFailed(credId: string, opts?: { lockOnCount?: number; lockForMs?: number }): Promise<AuthCredentialView | null>;
  clearFailures(credId: string): Promise<void>;
}

