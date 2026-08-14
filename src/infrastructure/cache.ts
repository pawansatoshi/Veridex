export interface CacheSnapshot {
  entries: number;
  inflight: number;
  hits: number;
  misses: number;
  coalesced: number;
  stores: number;
  evictions: number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessedAt: number;
}

export interface AnalysisCacheOptions {
  ttlMs: number;
  maxEntries: number;
  now?: () => number;
}

/**
 * Small bounded process-local cache for read-only analysis.
 *
 * The TTL is intentionally short because contract capabilities can change.
 * In-flight requests are always coalesced even when the cache TTL is zero.
 * Errors are never cached.
 */
export class AnalysisCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();
  private readonly inflight = new Map<string, Promise<T>>();
  private readonly now: () => number;
  private hits = 0;
  private misses = 0;
  private coalesced = 0;
  private stores = 0;
  private evictions = 0;

  public constructor(private readonly options: AnalysisCacheOptions) {
    if (!Number.isInteger(options.ttlMs) || options.ttlMs < 0 || options.ttlMs > 300_000) {
      throw new Error("cache ttlMs must be an integer in [0, 300000]");
    }
    if (!Number.isInteger(options.maxEntries) || options.maxEntries < 1 || options.maxEntries > 10_000) {
      throw new Error("cache maxEntries must be an integer in [1, 10000]");
    }
    this.now = options.now ?? (() => Date.now());
  }

  public async getOrCompute(key: string, compute: () => Promise<T>): Promise<T> {
    const now = this.now();
    const existing = this.entries.get(key);
    if (existing && existing.expiresAt > now) {
      existing.lastAccessedAt = now;
      this.hits += 1;
      return existing.value;
    }
    if (existing) this.entries.delete(key);

    const running = this.inflight.get(key);
    if (running) {
      this.coalesced += 1;
      return running;
    }

    this.misses += 1;
    const promise = Promise.resolve().then(compute);
    this.inflight.set(key, promise);

    try {
      const value = await promise;
      if (this.options.ttlMs > 0) {
        this.entries.set(key, {
          value,
          expiresAt: this.now() + this.options.ttlMs,
          lastAccessedAt: this.now(),
        });
        this.stores += 1;
        this.trimToLimit();
      }
      return value;
    } finally {
      this.inflight.delete(key);
    }
  }

  public clear(): void {
    this.entries.clear();
  }

  public snapshot(): CacheSnapshot {
    this.purgeExpired();
    return {
      entries: this.entries.size,
      inflight: this.inflight.size,
      hits: this.hits,
      misses: this.misses,
      coalesced: this.coalesced,
      stores: this.stores,
      evictions: this.evictions,
    };
  }

  private purgeExpired(): void {
    const now = this.now();
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key);
    }
  }

  private trimToLimit(): void {
    while (this.entries.size > this.options.maxEntries) {
      let oldestKey: string | undefined;
      let oldestAccess = Number.POSITIVE_INFINITY;
      for (const [key, entry] of this.entries) {
        if (entry.lastAccessedAt < oldestAccess) {
          oldestAccess = entry.lastAccessedAt;
          oldestKey = key;
        }
      }
      if (oldestKey === undefined) return;
      this.entries.delete(oldestKey);
      this.evictions += 1;
    }
  }
}
