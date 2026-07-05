import type { RequestHandler } from 'express';

import type { RateLimitStrategy } from '../ratelimit/strategy.js';
import { HttpError } from '../utils/errors/app.errors.js';

//  Express middleware that enforces a `RateLimitStrategy`, keyed on client IP.
export function createRateLimit(strategy: RateLimitStrategy): RequestHandler {
  return (req, res, next) => {
    const key = req.ip ?? 'unknown';
    const { allowed, limit, remaining, resetSeconds, retryAfterSeconds } = strategy.check(
      key,
      Date.now(),
    );

    // standard headers for rate-limit
    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(resetSeconds));

    if (allowed) {
      next();
      return;
    }

    res.setHeader('Retry-After', String(retryAfterSeconds));

    throw new HttpError(429, 'Too Many Requests', { retryAfterSeconds });
  };
}
