export interface RateLimitResult {
  allowed: boolean;
  // max requests permitted per window as X-RateLimit-Limit.
  limit: number;
  // requests left in the current window
  remaining: number;
  // unix time at which the window resets
  resetSeconds: number;
  // seconds until the client may retry
  retryAfterSeconds: number;
}

export interface RateLimitStrategy {
  check(key: string, now: number): RateLimitResult;
}
