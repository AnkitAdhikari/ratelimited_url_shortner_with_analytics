import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

// maps an RTK Query error to a user-facing message; 429 returns null because
// the rate-limit UI (driven by the rateLimit slice) already covers it
export function describeError(
  error: FetchBaseQueryError | { message?: string } | undefined,
): string | null {
  if (error === undefined) return null;

  if ('status' in error) {
    if (error.status === 429) return null;
    if (error.status === 'FETCH_ERROR') {
      return 'Could not reach the server. Check your connection and try again.';
    }
    if (typeof error.data === 'object' && error.data !== null) {
      const body = error.data as { message?: unknown; error?: unknown };
      const message = body.message ?? body.error;
      if (typeof message === 'string') return message;
    }
    return 'Request failed';
  }

  return error.message ?? 'Request failed';
}
