import type { RateLimitStore } from './store.js';
import type { RateLimitResult, RateLimitStrategy } from './strategy.js';

export class FixedWindowLimiter implements RateLimitStrategy {
  private readonly store: RateLimitStore;
  private readonly max: number;
  private readonly windowMs: number;
  private readonly clock: () => number;

  constructor(opts: {
    store: RateLimitStore;
    max: number;
    windowSeconds: number;
    // fake clock omit in production
    clock?: () => number;
  }) {
    this.store = opts.store;
    this.max = opts.max;
    this.windowMs = opts.windowSeconds * 1000;
    this.clock = opts.clock ?? Date.now;
  }

  // `now` defaults to the injected clock so the limiter can be exercised in
  check(key: string, now: number = this.clock()): RateLimitResult {
    const windowId = Math.floor(now / this.windowMs);
    const expiresAt = (windowId + 1) * this.windowMs;

    const existing = this.store.get(key);

    // older window is spent and new winodw is used
    const count = existing && existing.windowId === windowId ? existing.count + 1 : 1;
    this.store.set(key, { windowId, count, expiresAt });

    // metadata
    const remaining = Math.max(0, this.max - count);
    const resetSeconds = Math.ceil(expiresAt / 1000);

    if (count <= this.max) {
      return { allowed: true, limit: this.max, remaining, resetSeconds, retryAfterSeconds: 0 };
    }

    // Round up so the client never retries a fraction of a second too early
    const retryAfterSeconds = Math.max(1, Math.ceil((expiresAt - now) / 1000));
    return { allowed: false, limit: this.max, remaining, resetSeconds, retryAfterSeconds };
  }
}
