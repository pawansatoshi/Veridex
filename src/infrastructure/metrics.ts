export interface LatencySnapshot {
  count: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
}

export class LatencyTracker {
  private readonly samples: number[] = [];

  public constructor(private readonly maxSamples = 2_000) {
    if (!Number.isInteger(maxSamples) || maxSamples < 10 || maxSamples > 100_000) {
      throw new Error("maxSamples must be an integer in [10, 100000]");
    }
  }

  public observe(durationMs: number): void {
    if (!Number.isFinite(durationMs) || durationMs < 0) throw new Error("Latency must be a finite non-negative number");
    this.samples.push(durationMs);
    if (this.samples.length > this.maxSamples) this.samples.shift();
  }

  public snapshot(): LatencySnapshot {
    if (this.samples.length === 0) return { count: 0, p50Ms: 0, p95Ms: 0, p99Ms: 0 };
    const sorted = [...this.samples].sort((a, b) => a - b);
    return {
      count: sorted.length,
      p50Ms: percentile(sorted, 0.5),
      p95Ms: percentile(sorted, 0.95),
      p99Ms: percentile(sorted, 0.99),
    };
  }

  public clear(): void {
    this.samples.length = 0;
  }
}

function percentile(sorted: readonly number[], quantile: number): number {
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(quantile * sorted.length) - 1));
  return sorted[index] ?? 0;
}

export async function measureAsync<T>(tracker: LatencyTracker, operation: () => Promise<T>): Promise<T> {
  const started = performance.now();
  try {
    return await operation();
  } finally {
    tracker.observe(performance.now() - started);
  }
}
