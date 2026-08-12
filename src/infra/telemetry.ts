export type AnalysisEventName =
  | "INTAKE"
  | "PROXY_SCAN"
  | "IMPLEMENTATION_RESOLUTION"
  | "ABI_VERIFICATION"
  | "BYTECODE_FALLBACK"
  | "OWNERSHIP_CHECK"
  | "PAUSE_CHECK"
  | "MINT_CHECK"
  | "EVIDENCE_RECONCILIATION"
  | "RESULT_READY";

export interface AnalysisEvent {
  sequence: number;
  name: AnalysisEventName;
  status: "started" | "completed" | "degraded" | "skipped";
  detail?: string;
}

export interface AnalysisEventSink {
  emit(event: AnalysisEvent): void;
}

export class MemoryAnalysisEventSink implements AnalysisEventSink {
  private readonly events: AnalysisEvent[] = [];
  emit(event: AnalysisEvent): void { this.events.push({ ...event }); }
  snapshot(): readonly AnalysisEvent[] { return this.events.map((event) => ({ ...event })); }
}

export class NullAnalysisEventSink implements AnalysisEventSink {
  emit(_event: AnalysisEvent): void { /* intentionally empty */ }
}
