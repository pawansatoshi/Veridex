import type { NormalizedAnalysis } from "../domain/analyzer.js";
import type { MinerDependencies, MinerRequest } from "./http.js";

/**
 * Schema-neutral protocol boundary. This deliberately does not invent a
 * Telegraph Intent name or wire format. Once the exact H1 Intent contract is
 * verified, only this boundary needs a protocol-specific encoder/decoder.
 */
export interface TelegraphMinerAdapter {
  analyze(input: MinerRequest): Promise<NormalizedAnalysis>;
}

export function createTelegraphMinerAdapter(dependencies: MinerDependencies): TelegraphMinerAdapter {
  return {
    analyze: (input) => dependencies.analyze(input),
  };
}
