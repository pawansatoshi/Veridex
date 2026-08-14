import { createMinerDependencies } from "./http.js";

/**
 * Warm-instance singleton used by Vercel handlers so cache, coalescing and
 * latency telemetry are shared by analyze/metrics within the same runtime.
 */
export const minerDependencies = createMinerDependencies();
