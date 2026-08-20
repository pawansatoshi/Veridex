import type { NormalizedAnalysis } from "./analyzer.js";
import { diffCapabilities, type CapabilityDiff } from "./capabilityIntelligence.js";
import { buildCapabilityPassport, type CapabilityPassport } from "./capabilityPassport.js";

export type WatchStatus = "active" | "paused";
export type WatchComparisonStatus = "baseline" | "unchanged" | "changed" | "inconclusive";
export type WatchChangeSeverity = "critical" | "warning" | "informational" | "inconclusive";

export interface CapabilityWatch {
  id: string;
  status: WatchStatus;
  chain: string;
  address: string;
  intervalMs: number;
  minIntervalMs: number;
  maxIntervalMs: number;
  observations: number;
  consecutiveFailures: number;
  nextDueAt: string;
  createdAt: string;
  updatedAt: string;
  lastPassport?: CapabilityPassport;
}

export interface WatchObservation {
  watchId: string;
  passport: CapabilityPassport;
  comparison: WatchComparisonStatus;
  severity: WatchChangeSeverity;
  diff?: CapabilityDiff;
  observedAt: string;
}

export interface WatchAlert {
  watchId: string;
  severity: Exclude<WatchChangeSeverity, "inconclusive">;
  whatChanged: string;
  previousState: CapabilityPassport;
  currentState: CapabilityPassport;
  evidence: CapabilityDiff;
  confidence: number;
  observedAt: string;
  comparisonStatus: "changed";
}

export interface WatchStore {
  get(id: string): Promise<CapabilityWatch | undefined>;
  put(watch: CapabilityWatch): Promise<void>;
  appendObservation(observation: WatchObservation): Promise<void>;
  listDue(now: Date): Promise<CapabilityWatch[]>;
}

export class InMemoryWatchStore implements WatchStore {
  private readonly watches = new Map<string, CapabilityWatch>();
  private readonly history = new Map<string, WatchObservation[]>();

  async get(id: string): Promise<CapabilityWatch | undefined> {
    const watch = this.watches.get(id);
    return watch ? structuredClone(watch) : undefined;
  }

  async put(watch: CapabilityWatch): Promise<void> {
    this.watches.set(watch.id, structuredClone(watch));
  }

  async appendObservation(observation: WatchObservation): Promise<void> {
    const history = this.history.get(observation.watchId) ?? [];
    history.push(structuredClone(observation));
    this.history.set(observation.watchId, history);
  }

  async listDue(now: Date): Promise<CapabilityWatch[]> {
    return [...this.watches.values()]
      .filter((watch) => watch.status === "active" && new Date(watch.nextDueAt).getTime() <= now.getTime())
      .map((watch) => structuredClone(watch));
  }

  historyFor(id: string): readonly WatchObservation[] {
    return this.history.get(id)?.map((item) => structuredClone(item)) ?? [];
  }
}

export interface CapabilityWatchSchedulerOptions {
  maxObservationsPerTick?: number;
  now?: () => Date;
}

export type WatchAnalyzer = (watch: CapabilityWatch) => Promise<NormalizedAnalysis>;
export type WatchAlertSink = (alert: WatchAlert) => Promise<void>;

const DEFAULT_INTERVAL_MS = 15 * 60 * 1000;
const DEFAULT_MIN_INTERVAL_MS = 5 * 60 * 1000;
const DEFAULT_MAX_INTERVAL_MS = 24 * 60 * 60 * 1000;

function nextInterval(watch: CapabilityWatch, successful: boolean): number {
  if (successful) return Math.min(watch.intervalMs * 2, watch.maxIntervalMs);
  return Math.max(Math.floor(watch.intervalMs / 2), watch.minIntervalMs);
}

function severityFor(diff: CapabilityDiff): Exclude<WatchChangeSeverity, "inconclusive"> {
  if (diff.changes.some((change) => change.capability === "upgradeability" || change.capability === "mint")) return "critical";
  if (diff.changes.some((change) => change.capability === "ownership" || change.capability === "pause")) return "warning";
  return "informational";
}

function isComparable(analysis: NormalizedAnalysis): boolean {
  const verificationFailed = ["api_failure", "timeout", "malformed_response", "not_configured"].includes(analysis.providerStatus.verification);
  return analysis.providerStatus.rpc === "ok" && !verificationFailed;
}

function describe(diff: CapabilityDiff): string {
  return diff.changes.map((change) => `${change.capability}: ${change.before} -> ${change.after}`).join(", ");
}

export function createCapabilityWatch(
  address: string,
  chain: string,
  options: Partial<Pick<CapabilityWatch, "intervalMs" | "minIntervalMs" | "maxIntervalMs">> = {},
  now = new Date(),
): CapabilityWatch {
  const normalizedAddress = address.toLowerCase();
  const createdAt = now.toISOString();
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const minIntervalMs = options.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS;
  const maxIntervalMs = options.maxIntervalMs ?? DEFAULT_MAX_INTERVAL_MS;
  if (!Number.isSafeInteger(intervalMs) || intervalMs < minIntervalMs || intervalMs > maxIntervalMs) throw new Error("Invalid watch interval");
  if (!Number.isSafeInteger(minIntervalMs) || minIntervalMs < 1_000) throw new Error("Invalid minimum watch interval");
  if (!Number.isSafeInteger(maxIntervalMs) || maxIntervalMs < minIntervalMs) throw new Error("Invalid maximum watch interval");
  return {
    id: `watch_${chain.toLowerCase()}_${normalizedAddress}`,
    status: "active",
    chain,
    address: normalizedAddress,
    intervalMs,
    minIntervalMs,
    maxIntervalMs,
    observations: 0,
    consecutiveFailures: 0,
    nextDueAt: new Date(now.getTime() + intervalMs).toISOString(),
    createdAt,
    updatedAt: createdAt,
  };
}

export class CapabilityWatchScheduler {
  private readonly maxObservationsPerTick: number;
  private readonly now: () => Date;

  constructor(
    private readonly store: WatchStore,
    private readonly analyze: WatchAnalyzer,
    private readonly alertSink?: WatchAlertSink,
    options: CapabilityWatchSchedulerOptions = {},
  ) {
    this.maxObservationsPerTick = options.maxObservationsPerTick ?? 10;
    if (!Number.isSafeInteger(this.maxObservationsPerTick) || this.maxObservationsPerTick < 1) throw new Error("Invalid observation budget");
    this.now = options.now ?? (() => new Date());
  }

  async tick(): Promise<readonly WatchObservation[]> {
    const now = this.now();
    const due = (await this.store.listDue(now)).slice(0, this.maxObservationsPerTick);
    const observations: WatchObservation[] = [];
    for (const watch of due) observations.push(await this.observe(watch, now));
    return observations;
  }

  private async observe(watch: CapabilityWatch, now: Date): Promise<WatchObservation> {
    const previous = watch.lastPassport;
    try {
      const analysis = await this.analyze(watch);
      const passport = buildCapabilityPassport(analysis, now.toISOString());
      let comparison: WatchComparisonStatus = "baseline";
      let severity: WatchChangeSeverity = "informational";
      let diff: CapabilityDiff | undefined;

      if (previous) {
        if (!isComparable(analysis) || previous.posture.conclusive === false) {
          comparison = "inconclusive";
          severity = "inconclusive";
        } else {
          diff = diffCapabilities(
            { ...analysis, capabilities: previous.capabilities },
            analysis,
          );
          comparison = diff.changed ? "changed" : "unchanged";
          severity = diff.changed ? severityFor(diff) : "informational";
        }
      }

      const observation: WatchObservation = { watchId: watch.id, passport, comparison, severity, ...(diff ? { diff } : {}), observedAt: now.toISOString() };
      const updated: CapabilityWatch = {
        ...watch,
        observations: watch.observations + 1,
        consecutiveFailures: 0,
        intervalMs: nextInterval(watch, true),
        nextDueAt: new Date(now.getTime() + nextInterval(watch, true)).toISOString(),
        updatedAt: now.toISOString(),
        lastPassport: passport,
      };
      await this.store.appendObservation(observation);
      await this.store.put(updated);

      if (previous && comparison === "changed" && diff && diff.conclusive && this.alertSink) {
        await this.alertSink({
          watchId: watch.id,
          severity: severity as Exclude<WatchChangeSeverity, "inconclusive">,
          whatChanged: describe(diff),
          previousState: previous,
          currentState: passport,
          evidence: diff,
          confidence: diff.confidence,
          observedAt: now.toISOString(),
          comparisonStatus: "changed",
        });
      }
      return observation;
    } catch (error) {
      const updated: CapabilityWatch = {
        ...watch,
        consecutiveFailures: watch.consecutiveFailures + 1,
        intervalMs: nextInterval(watch, false),
        nextDueAt: new Date(now.getTime() + nextInterval(watch, false)).toISOString(),
        updatedAt: now.toISOString(),
      };
      await this.store.put(updated);
      const observation: WatchObservation = {
        watchId: watch.id,
        passport: previous ?? buildCapabilityPassport({
          contract: { requestedAddress: watch.address, contractAddress: watch.address, chain: watch.chain },
          proxy: {
            contractAddress: watch.address,
            status: "unavailable",
            evidence: {
              implementationSlot: "unavailable",
              beaconSlot: "unavailable",
              adminSlot: "unavailable",
              detail: `proxy resolution unavailable because analysis failed: ${String(error)}`,
            },
          },
          verification: {
            status: "api_failure",
            contractAddress: watch.address,
            verified: false,
            abiAvailable: false,
            sourceAvailable: false,
            provenance: "none",
          },
          capabilities: [], evidence: [], confidence: 0, conclusive: false, providerStatus: { verification: "api_failure", rpc: "unavailable" },
        }, now.toISOString()),
        comparison: "inconclusive",
        severity: "inconclusive",
        observedAt: now.toISOString(),
      };
      await this.store.appendObservation(observation);
      return observation;
    }
  }
}
