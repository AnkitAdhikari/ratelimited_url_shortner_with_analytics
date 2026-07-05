export interface RateLimitEntry {
  windowId: number;
  count: number;
  expiresAt: number;
}

// interface for redis compatiability
export interface RateLimitStore {
  get(key: string): RateLimitEntry | undefined;
  set(key: string, entry: RateLimitEntry): void;
  delete(key: string): void;
}

export class MapStore implements RateLimitStore {
  private readonly entries = new Map<string, RateLimitEntry>();
  private readonly clock: () => number;

  constructor(opts: { sweepIntervalMs?: number; clock?: () => number } = {}) {
    const sweepIntervalMs = opts.sweepIntervalMs ?? 60_000;
    this.clock = opts.clock ?? Date.now;

    const sweep = setInterval(() => this.evictExpired(), sweepIntervalMs);
    sweep.unref();
  }

  get(key: string): RateLimitEntry | undefined {
    return this.entries.get(key);
  }

  set(key: string, entry: RateLimitEntry): void {
    this.entries.set(key, entry);
  }

  delete(key: string): void {
    this.entries.delete(key);
  }

  private evictExpired(): void {
    const now = this.clock();
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) {
        this.entries.delete(key);
      }
    }
  }
}
