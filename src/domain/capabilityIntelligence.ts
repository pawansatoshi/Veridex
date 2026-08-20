import type { NormalizedAnalysis, NormalizedCapability } from "./analyzer.js";

export interface CapabilityAuthority { capability: NormalizedCapability["capability"]; result: NormalizedCapability["result"]; authority: unknown; evidence: Record<string, unknown>; confidence: number; }
export interface CapabilityIntelligence { subject: NormalizedAnalysis["contract"]; capabilityMap: readonly CapabilityAuthority[]; evidenceGraph: readonly Record<string, unknown>[]; state: "established" | "partial" | "inconclusive"; confidence: number; }
export interface CapabilityChange { capability: NormalizedCapability["capability"]; before: NormalizedCapability["result"] | "missing"; after: NormalizedCapability["result"] | "missing"; change: "added" | "removed" | "changed"; evidence: { before?: Record<string, unknown>; after?: Record<string, unknown> }; }
export interface CapabilityDiff { changed: boolean; changes: readonly CapabilityChange[]; confidence: number; conclusive: boolean; }

export function buildCapabilityIntelligence(analysis: NormalizedAnalysis): CapabilityIntelligence {
  const capabilityMap = analysis.capabilities.map((item) => ({ capability: item.capability, result: item.result, authority: item.evidence.authority ?? item.evidence.ownerAddress ?? null, evidence: item.evidence, confidence: item.confidence }));
  return { subject: analysis.contract, capabilityMap, evidenceGraph: capabilityMap.map((item) => ({ subject: analysis.contract.contractAddress, capability: item.capability, result: item.result, authority: item.authority, confidence: item.confidence, evidence: item.evidence })), state: analysis.conclusive ? "established" : analysis.capabilities.some((item) => item.conclusive) ? "partial" : "inconclusive", confidence: analysis.confidence };
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(",")}}`;
}

export function diffCapabilities(before: NormalizedAnalysis, after: NormalizedAnalysis): CapabilityDiff {
  const names = new Set([...before.capabilities.map((item) => item.capability), ...after.capabilities.map((item) => item.capability)]);
  const changes: CapabilityChange[] = [];
  for (const capability of names) {
    const previous = before.capabilities.find((item) => item.capability === capability);
    const current = after.capabilities.find((item) => item.capability === capability);
    const beforeResult = previous?.result ?? "missing";
    const afterResult = current?.result ?? "missing";
    const resultChanged = beforeResult !== afterResult;
    const evidenceChanged = previous !== undefined && current !== undefined && stableSerialize(previous.evidence) !== stableSerialize(current.evidence);
    const stateChanged = previous !== undefined && current !== undefined && (previous.conclusive !== current.conclusive || previous.confidence !== current.confidence);
    if (!resultChanged && !evidenceChanged && !stateChanged) continue;
    const change = beforeResult === "negative" && afterResult === "positive"
      ? "added"
      : beforeResult === "positive" && afterResult === "negative"
        ? "removed"
        : "changed";
    changes.push({ capability, before: beforeResult, after: afterResult, change, evidence: { ...(previous ? { before: previous.evidence } : {}), ...(current ? { after: current.evidence } : {}) } });
  }
  const confidence = changes.length === 0
    ? Math.min(before.confidence, after.confidence)
    : changes.reduce((sum, change) => sum + Math.min(before.capabilities.find((item) => item.capability === change.capability)?.confidence ?? 0, after.capabilities.find((item) => item.capability === change.capability)?.confidence ?? 0), 0) / changes.length;
  return {
    changed: changes.length > 0,
    changes,
    confidence,
    conclusive: before.conclusive && after.conclusive && changes.every((change) => !["inconclusive", "unavailable", "error"].includes(change.before) && !["inconclusive", "unavailable", "error"].includes(change.after)),
  };
}
