import type { CheckResult, ProxyEvidence } from "./analysis.js";
export interface AnalysisQuality { status: "conclusive" | "inconclusive"; degraded: boolean; reasons: readonly string[]; }
export interface AnalysisError { kind: string; message: string; checkName?: string; }
export interface NormalizedAnalysisResult {
  request: { contractAddress: string; chain: string };
  identity: { contractAddress: string; codeAddress?: string };
  proxy: ProxyEvidence;
  checks: readonly CheckResult[];
  evidence: readonly unknown[];
  quality: AnalysisQuality;
  errors: readonly AnalysisError[];
  metadata: { schemaVersion: 1; observedAt: string };
}
