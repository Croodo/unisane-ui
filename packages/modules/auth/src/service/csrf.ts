/**
 * AUTH-001 FIX: CSRF token stub.
 *
 * @deprecated Use `csrfFactory` instead for proper CSRF token generation.
 * This stub function does not generate actual CSRF tokens and should not be used.
 * The `csrfFactory` function properly generates cryptographically secure tokens
 * and sets the appropriate cookie.
 *
 * This function exists only for backward compatibility and will be removed
 * in a future version.
 *
 * @see csrfFactory
 */
export async function getCsrf(): Promise<{ ok: true; warning: string }> {
  console.warn(
    '[DEPRECATED] getCsrf() is a stub. Use csrfFactory() for proper CSRF token generation.'
  );
  return {
    ok: true as const,
    warning: 'This is a stub function. Use csrfFactory for actual CSRF token generation.',
  };
}

