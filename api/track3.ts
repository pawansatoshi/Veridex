import { runTrack3Analysis } from "../src/application/track3.js";

interface RequestLike {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}

interface ResponseLike {
  statusCode?: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
}

interface Bucket {
  startedAt: number;
  count: number;
}

const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = Number(process.env.TRACK3_MAX_REQUESTS_PER_IP || 8);
const buckets = new Map<string, Bucket>();

function header(req: RequestLike, name: string): string | undefined {
  const value = req.headers?.[name.toLowerCase()] ?? req.headers?.[name] ?? req.headers?.[name.toUpperCase()];
  return Array.isArray(value) ? value[0] : value;
}

function requestOriginAllowed(req: RequestLike): boolean {
  const origin = header(req, "origin");
  if (!origin) return true;
  const allowed = process.env.VERIDEX_APP_ORIGIN || "https://veridex-ecru.vercel.app";
  return origin === allowed;
}

function clientKey(req: RequestLike): string {
  const forwarded = header(req, "x-forwarded-for");
  return (forwarded?.split(",")[0]?.trim() || header(req, "x-real-ip") || "unknown").slice(0, 120);
}

function isRateLimited(req: RequestLike): boolean {
  const key = clientKey(req);
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    buckets.set(key, { startedAt: now, count: 1 });
    return false;
  }
  if (current.count >= MAX_PER_WINDOW) return true;
  current.count += 1;
  return false;
}

function json(res: ResponseLike, statusCode: number, body: unknown): void {
  res.statusCode = statusCode;
  res.end(JSON.stringify(body));
}

export default async function handler(req: RequestLike, res: ResponseLike): Promise<void> {
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("vary", "origin");

  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    json(res, 405, { error: "method_not_allowed" });
    return;
  }

  if (!requestOriginAllowed(req)) {
    json(res, 403, { error: "origin_not_allowed" });
    return;
  }

  if (isRateLimited(req)) {
    res.setHeader("retry-after", String(Math.ceil(WINDOW_MS / 1000)));
    json(res, 429, { error: "rate_limited", detail: "Track 3 analysis is rate-limited to protect the paid intelligence budget." });
    return;
  }

  const requestId = crypto.randomUUID();
  const started = Date.now();
  try {
    const result = await runTrack3Analysis(req.body);
    console.info(JSON.stringify({
      event: "track3_request",
      requestId: result.requestId || requestId,
      ipKey: clientKey(req),
      decision: result.decision.status,
      telegraphStatus: result.telegraph.status,
      telegraphIntent: result.telegraph.intent ?? null,
      telegraphMiner: result.telegraph.miner ?? null,
      elapsedMs: Date.now() - started,
    }));
    res.setHeader("x-veridex-request-id", result.requestId || requestId);
    json(res, 200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message === "invalid_request" ? 400 : 503;
    console.warn(JSON.stringify({ event: "track3_failure", requestId, error: message, elapsedMs: Date.now() - started }));
    json(res, status, {
      error: status === 400 ? "invalid_request" : "track3_unavailable",
      detail: status === 400 ? "Expected Ethereum mainnet chain (1/ethereum) and a valid contractAddress." : "Track 3 analysis is temporarily unavailable. No security conclusion was inferred from the provider failure.",
      requestId,
    });
  }
}
