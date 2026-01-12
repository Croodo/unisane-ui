/**
 * API Versioning Strategy
 *
 * This module provides utilities for API versioning following RFC 8594 (Deprecation) standards.
 *
 * ## Versioning Philosophy
 *
 * The Unisane API uses **URL-based versioning** (`/api/rest/v1/`, `/api/rest/v2/`)
 * combined with **deprecation headers** for lifecycle communication.
 *
 * ### Why URL-based versioning?
 *
 * 1. **Explicit & Cacheable**: Version is part of the URL, works with CDN caching
 * 2. **No Header Parsing**: Simpler client implementation, no content negotiation needed
 * 3. **Clear Routing**: Easy to route different versions to different deployments
 * 4. **Browser Friendly**: Works in address bar, curl, and browser dev tools
 * 5. **Contract-First**: Matches our ts-rest contract generation model
 *
 * ### Lifecycle Headers (RFC 8594)
 *
 * We use standard headers to communicate API lifecycle:
 *
 * | Header | Purpose | Example |
 * |--------|---------|---------|
 * | `Deprecation` | Marks endpoint as deprecated | `Deprecation: 2025-06-01` |
 * | `Sunset` | When endpoint will be removed | `Sunset: Sun, 01 Jun 2025 23:59:59 GMT` |
 * | `Link` | Points to successor | `Link: </api/rest/v2/users>; rel="successor-version"` |
 * | `X-API-Version` | Current version (informational) | `X-API-Version: v1` |
 *
 * ## Version Lifecycle
 *
 * ```
 * [Stable] → [Deprecated] → [Sunset] → [Removed]
 *     │           │            │
 *     │           │            └── Endpoint returns 410 Gone
 *     │           │
 *     │           └── Deprecation + Sunset headers added
 *     │                (minimum 6 months notice)
 *     │
 *     └── No deprecation headers
 * ```
 *
 * ## Migration Policy
 *
 * 1. **Minimum Deprecation Period**: 6 months from announcement to sunset
 * 2. **Breaking Changes**: Only in major version bumps (v1 → v2)
 * 3. **Non-Breaking Changes**: Can be added to current version
 * 4. **Parallel Support**: Old version supported until sunset date
 *
 * ## Example Usage
 *
 * ```typescript
 * // In contract meta
 * defineOpMeta({
 *   op: "users.list",
 *   deprecation: {
 *     date: "2025-06-01",
 *     sunsetDate: "2025-12-01",
 *     successor: "/api/rest/v2/users",
 *     reason: "Pagination format changed in v2"
 *   },
 *   service: { ... }
 * });
 *
 * // Headers generated automatically:
 * // Deprecation: 2025-06-01
 * // Sunset: Mon, 01 Dec 2025 23:59:59 GMT
 * // Link: </api/rest/v2/users>; rel="successor-version"
 * ```
 */

import { HEADER_NAMES } from './headers';

/**
 * Current API version.
 */
export const CURRENT_API_VERSION = 'v1';

/**
 * Deprecation metadata for an endpoint.
 */
export interface DeprecationInfo {
  /** ISO 8601 date when deprecation was announced (e.g., "2025-06-01") */
  date: string;
  /** ISO 8601 date when endpoint will be removed (e.g., "2025-12-01") */
  sunsetDate: string;
  /** Path to the replacement endpoint */
  successor?: string;
  /** Human-readable reason for deprecation */
  reason?: string;
}

/**
 * Build deprecation headers for a deprecated endpoint.
 *
 * @param info - Deprecation information
 * @returns Headers object to merge into response
 *
 * @example
 * ```typescript
 * const headers = buildDeprecationHeaders({
 *   date: "2025-06-01",
 *   sunsetDate: "2025-12-01",
 *   successor: "/api/rest/v2/users"
 * });
 * // {
 * //   "deprecation": "2025-06-01",
 * //   "sunset": "Mon, 01 Dec 2025 23:59:59 GMT",
 * //   "link": "</api/rest/v2/users>; rel=\"successor-version\""
 * // }
 * ```
 */
export function buildDeprecationHeaders(info: DeprecationInfo): Record<string, string> {
  const headers: Record<string, string> = {};

  // Deprecation header (RFC 8594)
  headers[HEADER_NAMES.DEPRECATION] = info.date;

  // Sunset header - convert ISO date to HTTP date format (RFC 7231)
  const sunsetDate = new Date(info.sunsetDate);
  sunsetDate.setHours(23, 59, 59, 0); // End of day
  headers[HEADER_NAMES.SUNSET] = sunsetDate.toUTCString();

  // Link header for successor (RFC 5988)
  if (info.successor) {
    headers[HEADER_NAMES.LINK] = `<${info.successor}>; rel="successor-version"`;
  }

  return headers;
}

/**
 * Build version header for all responses.
 *
 * @param version - API version string (e.g., "v1", "v2")
 * @returns Headers object to merge into response
 */
export function buildVersionHeader(version = CURRENT_API_VERSION): Record<string, string> {
  return {
    [HEADER_NAMES.API_VERSION]: version,
  };
}

/**
 * Check if an endpoint is past its sunset date.
 *
 * @param sunsetDate - ISO 8601 sunset date
 * @returns true if the endpoint should return 410 Gone
 */
export function isPastSunset(sunsetDate: string): boolean {
  const sunset = new Date(sunsetDate);
  sunset.setHours(23, 59, 59, 999);
  return Date.now() > sunset.getTime();
}

/**
 * Calculate days until sunset.
 *
 * @param sunsetDate - ISO 8601 sunset date
 * @returns Number of days until sunset (negative if past)
 */
export function daysUntilSunset(sunsetDate: string): number {
  const sunset = new Date(sunsetDate);
  const now = new Date();
  const diffMs = sunset.getTime() - now.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format a sunset warning message for logging.
 *
 * @param endpoint - The endpoint path
 * @param info - Deprecation information
 * @returns Formatted warning message
 */
export function formatDeprecationWarning(endpoint: string, info: DeprecationInfo): string {
  const days = daysUntilSunset(info.sunsetDate);
  const status = days < 0 ? 'PAST SUNSET' : `${days} days remaining`;

  let message = `[DEPRECATED] ${endpoint} - ${status}`;
  if (info.reason) {
    message += ` | Reason: ${info.reason}`;
  }
  if (info.successor) {
    message += ` | Use: ${info.successor}`;
  }

  return message;
}

/**
 * Version comparison utilities.
 */
export const Version = {
  /**
   * Parse version string to number for comparison.
   * @example Version.parse("v2") // 2
   */
  parse(version: string): number {
    const match = version.match(/v?(\d+)/i);
    return match && match[1] ? parseInt(match[1], 10) : 0;
  },

  /**
   * Compare two version strings.
   * @returns negative if a < b, 0 if equal, positive if a > b
   */
  compare(a: string, b: string): number {
    return Version.parse(a) - Version.parse(b);
  },

  /**
   * Check if version a is newer than version b.
   */
  isNewer(a: string, b: string): boolean {
    return Version.compare(a, b) > 0;
  },

  /**
   * Check if version a is older than version b.
   */
  isOlder(a: string, b: string): boolean {
    return Version.compare(a, b) < 0;
  },
};
