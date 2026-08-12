import { assertEvmAddress } from "./address.js";
import { checkMintCapability, checkOwnership, checkPauseCapability, checkPausedState, type AnalysisContext } from "./checks.js";
import { nowIso } from "./evidence.js";
import { detectErc1967Proxy } from "./proxy.js";
import { mapBounded } from "../infra/concurrency.js";
import type { AnalysisEventSink } from "../infra/telemetry.js";
import type { AnalysisError, AnalysisQuality, NormalizedAnalysisResult } from "../types/result.js";
import type { CheckResult, ProxyEvidence } from "../types/analysis.js";

export interface AnalysisEngineOptions { maxConcurrency: number; events?: AnalysisEventSink; }
export class AnalysisEngine {
  private sequence = 0;
  constructor(private readonly options: AnalysisEngineOptions) { if (!Number.isInteger(options.maxConcurrency) || options.maxConcurrency < 1 || options.maxConcurrency > 16) throw new Error("maxConcurrency must be between 1 and 16"); }
  private emit(events: AnalysisEventSink | undefined, name: Parameters<AnalysisEventSink["emit"]>[0]["name"], status: Parameters<AnalysisEventSink["emit"]>[0]["status"], detail?: string): void {
    if (events === undefined) return;
    const event: Parameters<AnalysisEventSink["emit"]>[0] = { sequence: ++this.sequence, name, status };
    if (detail !== undefined) event.detail = detail;
    events.emit(event);
  }
  async analyze(context: AnalysisContext): Promise<NormalizedAnalysisResult> {
    assertEvmAddress(context.requestedAddress, "requested address");
    assertEvmAddress(context.contractAddress, "contract address");
    if (context.codeAddress !== undefined) assertEvmAddress(context.codeAddress, "code address");
    if (!context.chain) throw new Error("chain is required");
    this.emit(this.options.events, "INTAKE", "completed");
    this.emit(this.options.events, "PROXY_SCAN", "started");
    let proxy: ProxyEvidence;
    const errors: AnalysisError[] = [];
    try {
      proxy = (await detectErc1967Proxy(context.rpc, context.contractAddress)).evidence;
      this.emit(this.options.events, "PROXY_SCAN", "completed");
      if (proxy.isProxy && proxy.proxyType === "beacon") this.emit(this.options.events, "IMPLEMENTATION_RESOLUTION", "skipped", "Beacon implementation remains unresolved in Phase 01; Phase 02 owns beacon composition.");
      else if (proxy.implementationAddress !== undefined) this.emit(this.options.events, "IMPLEMENTATION_RESOLUTION", "completed");
    } catch (error) {
      proxy = { isProxy: false, observationStatus: "inconclusive" };
      const message = error instanceof Error ? error.message : "proxy scan failed";
      errors.push({ kind: "proxy_scan_failure", message });
      this.emit(this.options.events, "PROXY_SCAN", "degraded", message);
    }
    if (proxy.observationStatus === "inconclusive") return this.finalize(context, proxy, [], errors);
    if (proxy.isProxy && proxy.proxyType === "beacon" && proxy.implementationAddress === undefined) {
      errors.push({ kind: "unresolved_implementation", message: "Beacon address was observed but beacon.implementation() resolution is intentionally deferred to Phase 02." });
      return this.finalize(context, proxy, [], errors);
    }
    const effectiveContext: AnalysisContext = proxy.implementationAddress === undefined ? context : { ...context, codeAddress: proxy.implementationAddress };
    const checks = await mapBounded(["ownership", "pause", "mint"] as const, this.options.maxConcurrency, async (kind) => {
      if (kind === "ownership") { this.emit(this.options.events, "OWNERSHIP_CHECK", "started"); const result = await checkOwnership(effectiveContext); this.emit(this.options.events, "OWNERSHIP_CHECK", result.certaintyStatus === "inconclusive" ? "degraded" : "completed"); return result; }
      if (kind === "pause") { this.emit(this.options.events, "PAUSE_CHECK", "started"); const result = await checkPauseCapability(effectiveContext); this.emit(this.options.events, result.detectionMethod === "bytecode_fallback" ? "BYTECODE_FALLBACK" : "ABI_VERIFICATION", "completed"); this.emit(this.options.events, "PAUSE_CHECK", result.certaintyStatus === "inconclusive" ? "degraded" : "completed"); return result; }
      this.emit(this.options.events, "MINT_CHECK", "started"); const result = await checkMintCapability(effectiveContext); this.emit(this.options.events, result.detectionMethod === "bytecode_fallback" ? "BYTECODE_FALLBACK" : "ABI_VERIFICATION", "completed"); this.emit(this.options.events, "MINT_CHECK", result.certaintyStatus === "inconclusive" ? "degraded" : "completed"); return result;
    });
    const pauseCapability = checks[1];
    if (pauseCapability === undefined) throw new Error("Internal error: pause capability result missing");
    const pausedState = await checkPausedState(effectiveContext, pauseCapability);
    const allChecks: CheckResult[] = [...checks, pausedState];
    for (const check of allChecks) if (check.error !== undefined) errors.push({ kind: check.failure ?? "check_error", message: check.error, checkName: check.checkName });
    return this.finalize(context, proxy, allChecks, errors, effectiveContext.codeAddress);
  }
  private finalize(context: AnalysisContext, proxy: ProxyEvidence, checks: readonly CheckResult[], errors: readonly AnalysisError[], codeAddress?: string): NormalizedAnalysisResult {
    this.emit(this.options.events, "EVIDENCE_RECONCILIATION", errors.length > 0 ? "degraded" : "completed");
    const inconclusive = proxy.observationStatus === "inconclusive" || checks.some((check) => check.certaintyStatus === "inconclusive") || errors.length > 0;
    const quality: AnalysisQuality = { status: inconclusive ? "inconclusive" : "conclusive", degraded: inconclusive, reasons: errors.map((error) => error.kind) };
    const identity = codeAddress === undefined ? { contractAddress: context.contractAddress } : { contractAddress: context.contractAddress, codeAddress };
    const result: NormalizedAnalysisResult = { request: { contractAddress: context.requestedAddress, chain: context.chain }, identity, proxy, checks, evidence: checks.map((check) => ({ checkName: check.checkName, evidence: check.evidence, provenance: check.provenance })), quality, errors, metadata: { schemaVersion: 1, observedAt: nowIso() } };
    this.emit(this.options.events, "RESULT_READY", inconclusive ? "degraded" : "completed");
    return result;
  }
}
