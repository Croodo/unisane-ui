import { kv, connectDb, scryptHashPassword, Email } from '@unisane/kernel';
import { AuthCredentialRepo } from '../data/auth.repository';
import { ERR } from '@unisane/gateway';

/**
 * AUTH-007 FIX: Validate reset token format before use.
 *
 * Tokens are generated with randomToken(32) which produces 32 bytes
 * encoded as base64url, resulting in 43 characters.
 *
 * Validating format early:
 * 1. Prevents unnecessary Redis lookups with malformed tokens
 * 2. Blocks potential injection attacks via token parameter
 * 3. Provides better error messages for users
 */
function isValidTokenFormat(token: string): boolean {
  // Token should be non-empty
  if (!token || typeof token !== 'string') return false;

  // Token length: 32 bytes base64url encoded = 43 characters
  // Allow some flexibility (32-64 chars) in case token length changes
  if (token.length < 32 || token.length > 64) return false;

  // Token should only contain base64url characters (A-Z, a-z, 0-9, -, _)
  // No padding (=) in base64url
  if (!/^[A-Za-z0-9_-]+$/.test(token)) return false;

  return true;
}

export async function resetVerify(input: { email: string; token: string; password: string }): Promise<{ userId: string }> {
  // AUTH-007 FIX: Validate token format before any operations
  if (!isValidTokenFormat(input.token)) {
    throw ERR.validation('Invalid token format');
  }

  await connectDb();
  const emailNorm = Email.create(input.email).toString();
  const { resetTokenKey } = await import('../domain/keys');
  const key = resetTokenKey(emailNorm, input.token);
  const userId = await kv.get(key);
  if (!userId) throw ERR.validation('Invalid or expired token');
  const { algo, saltB64, hashB64 } = await scryptHashPassword(input.password);
  const cred = await AuthCredentialRepo.findByEmailNorm(emailNorm);
  if (!cred) throw ERR.validation('Account not found');
  await AuthCredentialRepo.updatePassword(emailNorm, { algo, salt: saltB64, hash: hashB64 });
  await kv.del(key);
  return { userId };
}
