export const SESSION_CONFIG = {
  // Default: 30 days for a "remember me" style experience
  DEFAULT_EXPIRATION_SEC: 30 * 24 * 60 * 60, // 2,592,000 seconds
  // Short: 1 hour (for sensitive sessions if needed later)
  SHORT_EXPIRATION_SEC: 60 * 60,
} as const;
