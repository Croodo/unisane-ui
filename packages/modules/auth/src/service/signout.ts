/**
 * AUTH-002 FIX: Sign out stub.
 *
 * @deprecated Use `signoutFactory` instead for proper sign out handling.
 * This stub function does not clear authentication cookies and should not be used.
 * The `signoutFactory` function properly clears the access token cookie
 * to complete the sign out process.
 *
 * This function exists only for backward compatibility and will be removed
 * in a future version.
 *
 * @see signoutFactory
 */
export async function signOut(): Promise<{ ok: true; warning: string }> {
  console.warn(
    '[DEPRECATED] signOut() is a stub. Use signoutFactory() for proper sign out handling.'
  );
  return {
    ok: true as const,
    warning: 'This is a stub function. Use signoutFactory for actual sign out handling.',
  };
}

